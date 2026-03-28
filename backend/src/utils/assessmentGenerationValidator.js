/**
 * Assessment Generation Request/Response Validation
 * 
 * Validates incoming requests and microservice responses against the defined contract.
 * 
 * Integration Plan: Phase 1.4 — Backend request/response contract (to be enforced)
 */

/**
 * Valid question types
 */
export const QUESTION_TYPES = {
    MCQ: 'mcq',
    SHORT_TEXT: 'short_text',
    ESSAY: 'essay',
    CODING: 'coding',
    MATH: 'math',
};

/**
 * Valid assessment types
 */
export const ASSESSMENT_TYPES = {
    QUIZ: 'quiz',
    ASSIGNMENT: 'assignment',
    EXAM: 'exam',
};

/**
 * Valid difficulty levels
 */
export const DIFFICULTY_LEVELS = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
};

/**
 * Validates backend endpoint request (frontend → backend)
 * 
 * POST /api/assessments/generate
 * 
 * Required fields:
 * - subject: string
 * - assessmentType: 'quiz' | 'assignment' | 'exam'
 * - difficulty: 'easy' | 'medium' | 'hard'
 * - questionTypeCounts: { mcq, short_text, essay, coding, math }
 * 
 * Optional fields:
 * - instructions: string
 * - referenceMaterialIds: string[] (UUIDs)
 * 
 * @param {Object} request - Request body
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateGenerateAssessmentRequest = (request) => {
    const errors = [];
    
    // Check required fields
    if (!request.subject || typeof request.subject !== 'string' || request.subject.trim() === '') {
        errors.push('subject is required and must be a non-empty string');
    }
    
    if (!request.assessmentType || !Object.values(ASSESSMENT_TYPES).includes(request.assessmentType)) {
        errors.push(`assessmentType must be one of: ${Object.values(ASSESSMENT_TYPES).join(', ')}`);
    }
    
    if (!request.difficulty || !Object.values(DIFFICULTY_LEVELS).includes(request.difficulty)) {
        errors.push(`difficulty must be one of: ${Object.values(DIFFICULTY_LEVELS).join(', ')}`);
    }
    
    // Validate questionTypeCounts
    if (!request.questionTypeCounts || typeof request.questionTypeCounts !== 'object') {
        errors.push('questionTypeCounts is required and must be an object');
    } else {
        const expectedTypes = Object.values(QUESTION_TYPES);
        const counts = request.questionTypeCounts;
        
        // Check all required keys exist and are numbers >= 0
        expectedTypes.forEach(type => {
            if (!(type in counts)) {
                errors.push(`questionTypeCounts.${type} is required`);
            } else if (typeof counts[type] !== 'number' || counts[type] < 0) {
                errors.push(`questionTypeCounts.${type} must be a non-negative number`);
            }
        });
        
        // Check that sum > 0
        const sum = Object.values(counts).reduce((a, b) => a + b, 0);
        if (sum === 0) {
            errors.push('Sum of all questionTypeCounts must be greater than 0');
        }
    }
    
    // Validate optional instructions
    if (request.instructions && typeof request.instructions !== 'string') {
        errors.push('instructions must be a string if provided');
    }
    
    // Validate optional referenceMaterialIds
    if (request.referenceMaterialIds) {
        if (!Array.isArray(request.referenceMaterialIds)) {
            errors.push('referenceMaterialIds must be an array if provided');
        } else {
            request.referenceMaterialIds.forEach((id, index) => {
                if (typeof id !== 'string' || id.trim() === '') {
                    errors.push(`referenceMaterialIds[${index}] must be a non-empty string (UUID)`);
                }
            });
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Validates microservice endpoint request (backend → microservice)
 * 
 * POST /generate
 * 
 * Same structure as backend request, but reference materials IDs are replaced with signed URLs
 * 
 * @param {Object} request - Request body
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateMicroserviceRequest = (request) => {
    const errors = [];
    
    // Basic fields same as backend request
    if (!request.subject || typeof request.subject !== 'string' || request.subject.trim() === '') {
        errors.push('subject is required and must be a non-empty string');
    }
    
    if (!request.assessmentType || !Object.values(ASSESSMENT_TYPES).includes(request.assessmentType)) {
        errors.push(`assessmentType must be one of: ${Object.values(ASSESSMENT_TYPES).join(', ')}`);
    }
    
    if (!request.difficulty || !Object.values(DIFFICULTY_LEVELS).includes(request.difficulty)) {
        errors.push(`difficulty must be one of: ${Object.values(DIFFICULTY_LEVELS).join(', ')}`);
    }
    
    if (!request.questionTypeCounts || typeof request.questionTypeCounts !== 'object') {
        errors.push('questionTypeCounts is required and must be an object');
    } else {
        const expectedTypes = Object.values(QUESTION_TYPES);
        const counts = request.questionTypeCounts;
        
        expectedTypes.forEach(type => {
            if (!(type in counts)) {
                errors.push(`questionTypeCounts.${type} is required`);
            } else if (typeof counts[type] !== 'number' || counts[type] < 0) {
                errors.push(`questionTypeCounts.${type} must be a non-negative number`);
            }
        });
        
        const sum = Object.values(counts).reduce((a, b) => a + b, 0);
        if (sum === 0) {
            errors.push('Sum of all questionTypeCounts must be greater than 0');
        }
    }
    
    // Validate optional referenceMaterials (array of { url, fileName? })
    if (request.referenceMaterials) {
        if (!Array.isArray(request.referenceMaterials)) {
            errors.push('referenceMaterials must be an array if provided');
        } else {
            request.referenceMaterials.forEach((material, index) => {
                if (typeof material !== 'object' || !material.url) {
                    errors.push(`referenceMaterials[${index}].url is required and must be a string`);
                }
                if (material.fileName && typeof material.fileName !== 'string') {
                    errors.push(`referenceMaterials[${index}].fileName must be a string if provided`);
                }
            });
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Validates microservice endpoint response (microservice → backend)
 * 
 * Required fields:
 * - questions: array of
 *   - questionText: string
 *   - questionType: 'mcq' | 'short_text' | 'essay' | 'coding' | 'math'
 *   - options: string[] (non-empty for mcq, empty otherwise)
 *   - expectedAnswer: string
 *   - marks: number
 *   - difficulty: 'easy' | 'medium' | 'hard'
 * 
 * Optional fields:
 * - warnings: string[]
 * - profileUsed: string
 * 
 * @param {Object} response - Microservice response
 * @param {Object} expectedCounts - Expected question type counts for validation
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateMicroserviceResponse = (response, expectedCounts = null) => {
    const errors = [];
    
    if (!response || typeof response !== 'object') {
        errors.push('Response must be an object');
        return { valid: false, errors };
    }
    
    if (!Array.isArray(response.questions)) {
        errors.push('response.questions must be an array');
        return { valid: false, errors };
    }
    
    if (response.questions.length === 0) {
        errors.push('response.questions must not be empty');
        return { valid: false, errors };
    }
    
    // Validate each question
    const actualCounts = {
        [QUESTION_TYPES.MCQ]: 0,
        [QUESTION_TYPES.SHORT_TEXT]: 0,
        [QUESTION_TYPES.ESSAY]: 0,
        [QUESTION_TYPES.CODING]: 0,
        [QUESTION_TYPES.MATH]: 0,
    };
    
    response.questions.forEach((question, index) => {
        const prefix = `questions[${index}]`;
        
        if (!question.questionText || typeof question.questionText !== 'string') {
            errors.push(`${prefix}.questionText is required and must be a string`);
        }
        
        if (!question.questionType || !Object.values(QUESTION_TYPES).includes(question.questionType)) {
            errors.push(`${prefix}.questionType must be one of: ${Object.values(QUESTION_TYPES).join(', ')}`);
        } else {
            actualCounts[question.questionType]++;
        }
        
        if (!Array.isArray(question.options)) {
            errors.push(`${prefix}.options must be an array`);
        } else {
            if (question.questionType === QUESTION_TYPES.MCQ) {
                if (question.options.length === 0) {
                    errors.push(`${prefix}.options must not be empty for MCQ questions`);
                }
                question.options.forEach((opt, optIndex) => {
                    if (typeof opt !== 'string') {
                        errors.push(`${prefix}.options[${optIndex}] must be a string`);
                    }
                });
            } else if (question.options.length > 0) {
                // Only MCQ should have options
                console.warn(`${prefix} has options but questionType is ${question.questionType}`);
            }
        }
        
        if (!question.expectedAnswer || typeof question.expectedAnswer !== 'string') {
            errors.push(`${prefix}.expectedAnswer is required and must be a string`);
        }
        
        if (typeof question.marks !== 'number' || question.marks <= 0) {
            errors.push(`${prefix}.marks must be a positive number`);
        }
        
        if (!Object.values(DIFFICULTY_LEVELS).includes(question.difficulty)) {
            errors.push(`${prefix}.difficulty must be one of: ${Object.values(DIFFICULTY_LEVELS).join(', ')}`);
        }
    });
    
    // Validate optional fields
    if (response.warnings && !Array.isArray(response.warnings)) {
        errors.push('response.warnings must be an array if provided');
    }
    
    if (response.profileUsed && typeof response.profileUsed !== 'string') {
        errors.push('response.profileUsed must be a string if provided');
    }
    
    // Check question type counts match expected (if provided)
    if (expectedCounts) {
        Object.keys(expectedCounts).forEach(type => {
            if (actualCounts[type] !== expectedCounts[type]) {
                errors.push(
                    `Question type '${type}' count mismatch: expected ${expectedCounts[type]}, got ${actualCounts[type]}`
                );
            }
        });
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
};

/**
 * Validates generated assessment response to frontend
 * 
 * @param {Object} assessment - Generated assessment object
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateGeneratedAssessmentResponse = (assessment) => {
    const errors = [];
    
    if (!assessment || typeof assessment !== 'object') {
        errors.push('Assessment must be an object');
        return { valid: false, errors };
    }
    
    // Check required metadata fields
    if (!assessment.id || typeof assessment.id !== 'string') {
        errors.push('Assessment must have an id (UUID string)');
    }
    
    if (!assessment.teacherId || typeof assessment.teacherId !== 'string') {
        errors.push('Assessment must have a teacherId (UUID string)');
    }
    
    if (!assessment.subject || typeof assessment.subject !== 'string') {
        errors.push('Assessment must have a subject (string)');
    }
    
    if (!Object.values(ASSESSMENT_TYPES).includes(assessment.assessmentType)) {
        errors.push(`Assessment must have a valid assessmentType`);
    }
    
    if (!Object.values(DIFFICULTY_LEVELS).includes(assessment.difficulty)) {
        errors.push(`Assessment must have a valid difficulty`);
    }
    
    // Check questions array
    if (!Array.isArray(assessment.questions)) {
        errors.push('Assessment must have a questions array');
    } else {
        assessment.questions.forEach((q, index) => {
            if (typeof q.index !== 'number' || q.index !== index + 1) {
                errors.push(`questions[${index}].index must be ${index + 1} (1-based)`);
            }
            if (!Object.values(QUESTION_TYPES).includes(q.type)) {
                errors.push(`questions[${index}].type is invalid`);
            }
            if (typeof q.text !== 'string') {
                errors.push(`questions[${index}].text must be a string`);
            }
            if (!Array.isArray(q.options)) {
                errors.push(`questions[${index}].options must be an array`);
            }
            if (typeof q.expectedAnswer !== 'string') {
                errors.push(`questions[${index}].expectedAnswer must be a string`);
            }
            if (typeof q.marks !== 'number') {
                errors.push(`questions[${index}].marks must be a number`);
            }
        });
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
};
