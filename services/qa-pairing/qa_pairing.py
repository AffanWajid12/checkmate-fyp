import json
import requests

import os
from dotenv import load_dotenv

load_dotenv()

LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://127.0.0.1:5003/api/generate")

def call_llm(prompt, system_prompt=None, model_override=None):
    print("Prompt Given to LLM: ", prompt[:500] + "..." if len(prompt) > 500 else prompt)
    try:
        payload = {"prompt": prompt}
        if system_prompt:
            payload["system_prompt"] = system_prompt
        if model_override:
            payload["model"] = model_override

        response = requests.post(
            LLM_SERVICE_URL,
            json=payload,
            timeout=300
        )

        if response.status_code == 200:
            result = response.json()
            return result.get("response", "")
        else:
            print(f"LLM API Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"LLM Connection Error: {e}")
        return None

def parse_json_response(response_text):
    try:
        clean_json = response_text.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.startswith("```"):
            clean_json = clean_json[3:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        return json.loads(clean_json.strip())
    except json.JSONDecodeError:
        print("Failed to parse JSON:", response_text[:500])
        return None

def pair_questions_and_answers(questions_json, student_text):
    """
    Pairs extracted student text with the provided questions JSON structure.
    Returns a JSON object with student answers filled in.
    """
    print("➡ Pairing questions and answers...")
    prompt = f"""
    You are an expert AI Examination Assistant. Your task is to map student answers from a raw OCR transcript to a **FIXED SKELETON** Question JSON.

    ### 💀 THE FIXED SKELETON RULE (MOST IMPORTANT)
    The "Questions JSON Template" provided below is a **SACRED SKELETON**.
    1. **NO SCHEMA MUTATION**: You are strictly forbidden from adding new objects or subparts.
    2. **STRICT KEY PRESERVATION**: If `subparts` is `[]` in the template, it **MUST** remain `[]` in your output. Never create a subpart (like 'a' or 'b') if it doesn't already exist.
    3. **PRESERVE METADATA**: You must preserve all extra fields in the input objects (like `path`, `type`, `points`, `total_marks`, etc.). DO NOT REMOVE THEM.
    4. **NO DUPLICATION**: Never create a subpart that repeats the "text" of the parent question. 
    5. **EXACT COUNT**: The output array must have the exact same number of objects, in the same order, and hierarchy as the input template.

    ### ❗ MAPPING LOGIC
    - **LEAF NODES ONLY**: Only "leaf nodes" (questions where `subparts` is `[]`) should receive a "student_answer". 
    - **DIRECT MAPPING**: If a question like Q1 has `subparts: []`, put the answer directly in Q1's "student_answer" field. Do not create a subpart "a" to hold it, even if the student wrote "Q1a".
    - **NO TEXT OVERWRITING**: The "text" field represents the original question. Do not overwrite or replace it with the student's response.
    - **NULL HANDLING**: If no answer is found for a specific leaf node, "student_answer" MUST be null.
    - **OLLAMA FORMAT**: Output ONLY valid JSON. No markdown blocks (like ```json), no conversational text, no commentary.

    ### 🎯 TARGET DATA TO PROCESS
    Questions JSON Template:
    {json.dumps(questions_json)}

    Student Exam Text (OCR Evidence):
    {student_text}

    Output accurately mapped JSON with "student_answer" fields and ALL original metadata preserved:
    """

    response = call_llm(prompt)

    if response:
        parsed = parse_json_response(response)
        if parsed:
            return parsed
        else:
            return {"error": "Failed to parse pairing result", "raw_response": response}
    else:
        return {"error": "Failed to pair questions and answers"}
