/**
 * LLM Service Client
 *
 * Wraps HTTP calls to the centralised Flask LLM micro-service (services/llm).
 * The service exposes POST /api/generate accepting { prompt, system_prompt }.
 */

import axios from "axios";

const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || "http://localhost:5003";
const LLM_REQUEST_TIMEOUT = parseInt(process.env.LLM_REQUEST_TIMEOUT || "120000", 10); // 120 s

const client = axios.create({
    baseURL: LLM_SERVICE_URL,
    timeout: LLM_REQUEST_TIMEOUT,
    headers: { "Content-Type": "application/json" },
});

/**
 * Send a prompt to the LLM service and return the generated text.
 *
 * @param {string} prompt        – The user/task prompt.
 * @param {string} [systemPrompt]– Optional system instruction.
 * @returns {Promise<string>}     – Raw text response from the LLM.
 */
export const llmGenerate = async (prompt, systemPrompt) => {
    const payload = { prompt };
    if (systemPrompt) payload.system_prompt = systemPrompt;

    try {
        const { data } = await client.post("/api/generate", payload);
        return data.response; // Flask service returns { response: "..." }
    } catch (error) {
        console.error("[LLM Client] Error:", error?.response?.data || error.message);
        throw new Error(
            `LLM service error: ${error?.response?.data?.error || error.message}`
        );
    }
};
