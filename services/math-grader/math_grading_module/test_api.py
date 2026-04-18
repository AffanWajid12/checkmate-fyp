import requests
import json
import time

MATH_GRADER_URL = "http://localhost:5007/api/grade"
HEALTH_CHECK_URL = "http://localhost:5007/api/health"
LLM_HEALTH_CHECK_URL = "http://localhost:5003/api/health"

test_cases = [
    {
        "name": "Incorrect Solution (Sign Error)",
        "payload": {
            "rubric": """
                The student should correctly set up the integral, apply substitution where needed, integrate step-by-step, and simplify the final expression.
                Partial credit should be given if they attempt the right substitution or setup.
            """,
            "question": """
                Evaluate the integral:
                ∫ x e⁻ˣ dx
                Provide a step-by-step solution using the method of integration by parts.
            """,
            "model_solution": """
                Integral: ∫ x e^(-x) dx
                Method: Integration by Parts (∫ u dv = uv - ∫ v du)
                Step 1: Choose u = x (du = dx) and dv = e^(-x) dx (v = -e^(-x)).
                Step 2: Apply formula: ∫ x e^(-x) dx = x(-e^(-x)) - ∫ (-e^(-x)) dx
                Step 3: Simplify: -x e^(-x) + ∫ e^(-x) dx = -x e^(-x) - e^(-x) + C
                Final Answer: -e^(-x)(x + 1) + C
            """,
            "student_solution": """
                I will evaluate ∫ x e⁻ˣ dx.
                u = x, du = dx
                dv = e⁻ˣ dx, v = e⁻ˣ  <-- ERROR HERE (should be -e⁻ˣ)
                Applying uv - ∫ v du:
                x e⁻ˣ - ∫ e⁻ˣ dx
                x e⁻ˣ - (-e⁻ˣ) + C
                x e⁻ˣ + e⁻ˣ + C
            """,
            "score_threshold": 70,
            "strictness_threshold": 3
        }
    },
    {
        "name": "Correct Solution",
        "payload": {
            "rubric": "Correct step-by-step integration by parts.",
            "question": "Evaluate ∫ x e⁻ˣ dx",
            "model_solution": "∫ x e⁻ˣ dx = -e⁻ˣ(x + 1) + C",
            "student_solution": """
                Let u = x, dv = e⁻ˣ dx.
                Then du = dx, v = -e⁻ˣ.
                Using ∫ u dv = uv - ∫ v du:
                ∫ x e⁻ˣ dx = -x e⁻ˣ - ∫ (-e⁻ˣ) dx
                = -x e⁻ˣ + ∫ e⁻ˣ dx
                = -x e⁻ˣ - e⁻ˣ + C
                = -e⁻ˣ (x + 1) + C
            """,
            "score_threshold": 70,
            "strictness_threshold": 3
        }
    }
]

def test_health():
    print("--- Checking Service Health ---")
    try:
        r_llm = requests.get(LLM_HEALTH_CHECK_URL, timeout=5)
        print(f"LLM Service (5003): {r_llm.status_code} - {r_llm.json()}")
    except Exception as e:
        print(f"LLM Service (5003) is DOWN: {e}")

    try:
        r_math = requests.get(HEALTH_CHECK_URL, timeout=5)
        print(f"Math Grader (5007): {r_math.status_code} - {r_math.json()}")
    except Exception as e:
        print(f"Math Grader (5007) is DOWN: {e}")

def test_grading():
    for case in test_cases:
        print(f"\n--- Testing: {case['name']} ---")
        start_time = time.time()
        try:
            response = requests.post(MATH_GRADER_URL, json=case["payload"], timeout=60)
            elapsed = time.time() - start_time
            print(f"Status Code: {response.status_code}")
            print(f"Time Taken: {elapsed:.2f}s")
            if response.ok:
                print("Response JSON:")
                print(json.dumps(response.json(), indent=2))
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    test_health()
    test_grading()
