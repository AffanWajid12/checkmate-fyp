from langchain_core.runnables import RunnableLambda
import requests
import json
import re
import os
from dotenv import load_dotenv

from prompts import get_prompt, make_user_prompt

load_dotenv()

MATH_LLM_URL = os.getenv("MATH_LLM_URL")
JSON_LLM_URL = os.getenv("JSON_LLM_URL")

if not MATH_LLM_URL:
    raise EnvironmentError("MATH_LLM_URL not set. Add it to .env or environment variables.")
if not JSON_LLM_URL:
    raise EnvironmentError("JSON_LLM_URL not set. Add it to .env or environment variables.")

def make_math_payload(input: dict) -> dict:
    """
    Create the payload for the math evaluation API.

    Args:
        input (dict): Should contain keys:
            - rubric
            - question
            - model_solution
            - student_solution
            - system_prompt_type (optional, default 'overall')

    Returns:
        dict: Payload ready to send to Math Model, and the type of system prompt
    """
    
    model_type = "math"
    
    system_prompt_type = input.get("system_prompt_type", "overall")
    
    system_prompt = get_prompt(model_type, system_prompt_type)
    
    user_prompt = make_user_prompt(
        model=model_type,
        rubric=input["rubric"],
        question=input["question"],
        model_solution=input["model_solution"],
        student_solution=input["student_solution"]
    )
    
    # Payload format for the centralized LLM service
    payload = {
        "prompt": user_prompt,
        "system_prompt": system_prompt
    }
    
    print(f"Math Payload Has Been Created for section: {system_prompt_type}")
    
    return {
        "payload": payload,
        "system_prompt_type": system_prompt_type
    }

def call_math_model(math_payload: dict) -> dict:
    """
    Sends the prepared payload to the Math LLM endpoint and returns the text response.
    """
    
    headers = {"Content-Type": "application/json"}
    payload_to_send = math_payload["payload"]
    
    response = requests.post(MATH_LLM_URL, headers=headers, data=json.dumps(payload_to_send))
    
    if not response.ok:
        print(f"Error from Math LLM: {response.text}")
        response.raise_for_status()
        
    response_data = response.json()
    response_text = response_data.get("response", "No response content found.")
    
    print(f"Math Model Has Responded for section: {math_payload['system_prompt_type']}")
    
    return {
        "math_model_text": response_text,
        "system_prompt_type": math_payload["system_prompt_type"]
    }

def robust_parse_json(llm_output: str) -> dict:
    # Step 1: Strip Markdown / code fences
    cleaned = re.sub(r"```json|```", "", llm_output, flags=re.IGNORECASE).strip()

    # Step 2: Extract first {...} block
    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if not match:
        return {"error": "No JSON found", "raw_text": llm_output}
    
    json_str = match.group(0)

    # Step 3: Attempt parsing
    try:
        parsed = json.loads(json_str)
        # Step 4: If it's a stringified JSON inside, parse again
        if isinstance(parsed, str):
            parsed = json.loads(parsed)
        return parsed
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON", "raw_text": json_str}

def call_json_model(math_payload: dict) -> dict:
    """
    Send verbose text from Math LLM to the JSON parsing LLM endpoint.
    """
    
    math_model_text = math_payload.get("math_model_text")
    prompt_type = math_payload.get("system_prompt_type", "overall")
    
    system_prompt = get_prompt("json", prompt_type)
    
    user_prompt = make_user_prompt(
        model="json",
        math_model_text=math_model_text
    )
    
    payload = {
        "prompt": user_prompt,
        "system_prompt": system_prompt
    }
    
    headers = {"Content-Type": "application/json"}
    response = requests.post(JSON_LLM_URL, headers=headers, data=json.dumps(payload))
    
    if not response.ok:
        print(f"Error from JSON LLM: {response.text}")
        response.raise_for_status()
        
    response_data = response.json()
    text_output = response_data.get("response", "")
    
    # Process text output to extract JSON
    text_output = re.sub(r"^```json\s*|\s*```$", "", text_output.strip(), flags=re.MULTILINE)
    
    try:
        # Parse JSON returned by the service
        # Note: If robust_parse_json is better, we could use it here too
        parsed_output = json.loads(text_output)
        return parsed_output
    except json.JSONDecodeError:
        # Fallback to robust parsing
        return robust_parse_json(text_output)

MathPayloadRunnable = RunnableLambda(lambda x: make_math_payload(x))
MathModelRunnable = RunnableLambda(lambda math_payload: call_math_model(math_payload))
JsonParseRunnable = RunnableLambda(lambda math_response_payload: call_json_model(math_response_payload))

Grading_Chain = MathPayloadRunnable | MathModelRunnable | JsonParseRunnable