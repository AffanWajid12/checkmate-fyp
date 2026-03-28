/**
 * Assessment Generation Microservice Client
 * 
 * This module handles communication with the Flask-based assessment-generation microservice.
 * It manages request formatting, microservice calls, error handling, and retries.
 * 
 * Integration Plan: Phase 1.3 — Backend-to-microservice call plumbing
 */

import axios from 'axios';

const GENERATION_SERVICE_URL = process.env.GENERATION_SERVICE_URL || 'http://localhost:5001';
const GENERATION_REQUEST_TIMEOUT = parseInt(process.env.GENERATION_REQUEST_TIMEOUT || '60000', 10); // 60 seconds
const GENERATION_MAX_RETRIES = parseInt(process.env.GENERATION_MAX_RETRIES || '1', 10); // No retries by default (set timeout instead)

/**
 * Creates an axios instance for microservice calls with configured timeout
 */
const createGenerationClient = () => {
    return axios.create({
        baseURL: GENERATION_SERVICE_URL,
        timeout: GENERATION_REQUEST_TIMEOUT,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

/**
 * Calls the assessment-generation microservice to generate questions
 * 
 * @param {Object} payload - Generation request payload
 * @param {string} payload.subject - Assessment subject
 * @param {string} payload.assessmentType - Type: 'quiz', 'assignment', or 'exam'
 * @param {string} payload.difficulty - Difficulty: 'easy', 'medium', or 'hard'
 * @param {Object} payload.questionTypeCounts - Count by question type { mcq, short_text, essay, coding, math }
 * @param {string} [payload.instructions] - Optional custom instructions
 * @param {Array} [payload.referenceMaterials] - Optional array of { url, fileName }
 * 
 * @returns {Promise<Object>} Microservice response with generated questions
 * @throws {Error} If microservice call fails after retries
 */
export const callGenerationService = async (payload) => {
    const client = createGenerationClient();
    
    let lastError;
    
    for (let attempt = 0; attempt <= GENERATION_MAX_RETRIES; attempt++) {
        try {
            console.log(`[Generation Service] Attempt ${attempt + 1}/${GENERATION_MAX_RETRIES + 1}`);
            console.log(`[Generation Service] Calling POST ${GENERATION_SERVICE_URL}/generate`);
            console.log(`[Generation Service] Payload:`, JSON.stringify(payload, null, 2));
            
            const response = await client.post('/generate', payload);
            
            console.log(`[Generation Service] Success. Status: ${response.status}`);
            return response.data;
            
        } catch (error) {
            lastError = error;
            
            console.error(`[Generation Service] Attempt ${attempt + 1} failed:`);
            
            if (error.response) {
                // Microservice responded with error status
                console.error(`[Generation Service] Response status: ${error.response.status}`);
                console.error(`[Generation Service] Response data:`, error.response.data);
                
                // Don't retry on 4xx errors (client faults)
                if (error.response.status >= 400 && error.response.status < 500) {
                    throw new Error(
                        `Generation service error (${error.response.status}): ${
                            error.response.data?.message || error.response.data?.error || 'Unknown error'
                        }`
                    );
                }
            } else if (error.code === 'ECONNREFUSED') {
                console.error(`[Generation Service] Connection refused. Is the service running at ${GENERATION_SERVICE_URL}?`);
            } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                console.error(`[Generation Service] Request timeout (${GENERATION_REQUEST_TIMEOUT}ms)`);
            } else {
                console.error(`[Generation Service] Error:`, error.message);
            }
            
            // If this was the last attempt, throw the error
            if (attempt === GENERATION_MAX_RETRIES) {
                break;
            }
            
            // Otherwise, wait a bit before retrying (exponential backoff)
            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
            console.log(`[Generation Service] Retrying in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }
    
    // All retries exhausted
    throw new Error(
        `Failed to generate assessment after ${GENERATION_MAX_RETRIES + 1} attempts. ` +
        `Last error: ${lastError.message}`
    );
};

/**
 * Maps microservice response to backend response format
 * 
 * Converts microservice question format to normalized backend JSONB payload
 * 
 * @param {Object} microserviceResponse - Raw response from microservice
 * @param {Array} microserviceResponse.questions - Array of question objects
 * @returns {Array} Normalized questions array with 1-based index added
 */
export const normalizeMicroserviceResponse = (microserviceResponse) => {
    if (!microserviceResponse || !Array.isArray(microserviceResponse.questions)) {
        throw new Error('Invalid microservice response: missing questions array');
    }
    
    // Add 1-based index to each question
    return microserviceResponse.questions.map((question, index) => ({
        ...question,
        index: index + 1,
    }));
};
