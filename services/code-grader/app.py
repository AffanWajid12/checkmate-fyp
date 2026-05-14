"""
code-grader — Flask microservice for local code evaluation
Port: 5004

Routes:
  GET  /health                 — liveness probe
  POST /run-tests              — execute code locally against test cases
  POST /generate-test-cases    — use LLM (Ollama) to generate test cases

No Judge0 / Docker / Redis / Postgres required.
Code is executed locally using subprocess with a per-test timeout.
Requirements: python3 and node must be installed on the host machine.
"""

import os
import json
import uuid
import tempfile
import subprocess
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env from the same directory as this file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)
CORS(app)

# ── Config ────────────────────────────────────────────────────────────────────
LLM_URL       = os.environ.get("LLM_URL", "http://localhost:5003/api/generate")
EXEC_TIMEOUT  = int(os.environ.get("EXEC_TIMEOUT_SECONDS", "10"))  # per test case

# Maps language name → (file extension, command template)
# {file} is replaced with the temp file path at runtime
LANGUAGE_CONFIG = {
    "python":     (".py",  ["python3", "{file}"]),
    "javascript": (".js",  ["node",    "{file}"]),
}


# ── Local code execution ───────────────────────────────────────────────────────

def _run_code_locally(source_code: str, language: str, stdin_text: str) -> dict:
    """
    Write source_code to a temp file, execute it with the language runtime,
    pipe stdin_text into it, and return { stdout, stderr, status }.
    """
    cfg = LANGUAGE_CONFIG.get(language.lower())
    if not cfg:
        return {"stdout": "", "stderr": f"Unsupported language: {language}", "status": "Error"}

    ext, cmd_template = cfg

    # Write code to a unique temp file
    tmp_dir  = tempfile.gettempdir()
    tmp_name = os.path.join(tmp_dir, f"cg_{uuid.uuid4().hex}{ext}")

    try:
        with open(tmp_name, "w", encoding="utf-8") as f:
            f.write(source_code)

        cmd = [part.replace("{file}", tmp_name) for part in cmd_template]

        result = subprocess.run(
            cmd,
            input=stdin_text or "",
            capture_output=True,
            text=True,
            timeout=EXEC_TIMEOUT,
        )

        stdout = result.stdout.strip()
        stderr = result.stderr.strip()
        status = "Accepted" if result.returncode == 0 else "Runtime Error"

        return {"stdout": stdout, "stderr": stderr, "status": status, "returncode": result.returncode}

    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": f"Time Limit Exceeded ({EXEC_TIMEOUT}s)", "status": "Time Limit Exceeded", "returncode": -1}
    except FileNotFoundError as exc:
        runtime = cmd_template[0]
        return {"stdout": "", "stderr": f"Runtime '{runtime}' not found. Is it installed? ({exc})", "status": "Error", "returncode": -1}
    except Exception as exc:
        return {"stdout": "", "stderr": str(exc), "status": "Error", "returncode": -1}
    finally:
        try:
            os.remove(tmp_name)
        except OSError:
            pass


# ── LLM helper ────────────────────────────────────────────────────────────────

def _call_ollama(prompt: str, timeout: int = 90) -> str:
    resp = requests.post(LLM_URL, json={"prompt": prompt}, timeout=timeout)
    resp.raise_for_status()
    return resp.json().get("response", "")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    # Also check that runtimes are available
    runtimes = {}
    for lang, (_, cmd) in LANGUAGE_CONFIG.items():
        try:
            subprocess.run([cmd[0], "--version"], capture_output=True, timeout=3)
            runtimes[lang] = "ok"
        except Exception as e:
            runtimes[lang] = str(e)

    return jsonify({"status": "ok", "service": "code-grader", "runtimes": runtimes}), 200


@app.route("/run-tests", methods=["POST"])
def run_tests():
    """
    Body (JSON):
      source_code  : str   — full source code
      language     : str   — "python" | "javascript"
      test_cases   : list  — [{ id, input, expected_output, is_hidden }]
      total_marks  : float — max marks for auto-grade

    Response:
      {
        results      : [{ test_case_id, passed, stdout, stderr, status, input, expected_output, is_hidden }],
        passed_tests : int,
        total_tests  : int,
        grade        : float
      }
    """
    data        = request.json or {}
    source_code = data.get("source_code", "")
    language    = data.get("language", "python").lower()
    test_cases  = data.get("test_cases", [])
    total_marks = float(data.get("total_marks", 10))

    if not source_code:
        return jsonify({"error": "source_code is required"}), 400
    if language not in LANGUAGE_CONFIG:
        return jsonify({"error": f"Unsupported language '{language}'. Use: {list(LANGUAGE_CONFIG)}"}), 400
    if not test_cases:
        return jsonify({"error": "test_cases must be a non-empty list"}), 400

    results = []
    passed  = 0

    for tc in test_cases:
        tc_id     = tc.get("id", "")
        stdin     = tc.get("input", "")
        expected  = (tc.get("expected_output") or "").strip()
        is_hidden = bool(tc.get("is_hidden", False))

        run = _run_code_locally(source_code, language, stdin)

        stdout      = run["stdout"]
        stderr      = run["stderr"]
        status      = run["status"]
        tc_passed   = (status in ("Accepted",)) and (stdout == expected)

        if tc_passed:
            passed += 1

        results.append({
            "test_case_id":    tc_id,
            "passed":          tc_passed,
            "stdout":          stdout,
            "stderr":          stderr,
            "status":          status,
            "input":           stdin,
            "expected_output": expected if not is_hidden else None,
            "is_hidden":       is_hidden,
        })

    total = len(test_cases)
    grade = round((passed / total) * total_marks, 2) if total > 0 else 0.0

    return jsonify({
        "results":      results,
        "passed_tests": passed,
        "total_tests":  total,
        "grade":        grade,
    }), 200


@app.route("/generate-test-cases", methods=["POST"])
def generate_test_cases():
    """
    Body (JSON):
      question : str — the coding problem statement
      language : str — "python" | "javascript"
      count    : int — how many test cases (default 5, max 20)

    Response:
      { test_cases: [{ id, input, expected_output, is_hidden }] }
    """
    data     = request.json or {}
    question = data.get("question", "").strip()
    language = data.get("language", "python")
    count    = max(1, min(int(data.get("count", 5)), 20))

    if not question:
        return jsonify({"error": "question is required"}), 400

    prompt = f"""You are an expert programmer. Generate exactly {count} test cases for the following coding problem.
The solution should be written in {language}.

Problem:
{question}

Rules:
1. Each test case must have an "input" string (what is sent to stdin) and "expected_output" string (what the program should print to stdout, stripped of trailing whitespace).
2. Include a mix of basic cases, edge cases, and boundary cases.
3. The last {max(1, count // 3)} test cases should be marked as hidden (is_hidden: true).
4. Return ONLY a valid JSON array — no markdown, no explanation.

Format:
[
  {{"input": "...", "expected_output": "...", "is_hidden": false}},
  ...
]
"""

    try:
        raw = _call_ollama(prompt).strip()

        start = raw.find("[")
        end   = raw.rfind("]")
        if start == -1 or end == -1:
            raise ValueError("No JSON array in LLM response")

        tcs_raw = json.loads(raw[start:end + 1])
        if not isinstance(tcs_raw, list):
            raise ValueError("LLM did not return a list")

        test_cases = []
        hidden_threshold = count - max(1, count // 3)
        for i, tc in enumerate(tcs_raw[:count]):
            test_cases.append({
                "id":              str(uuid.uuid4()),
                "input":           str(tc.get("input", "")),
                "expected_output": str(tc.get("expected_output", "")).strip(),
                "is_hidden":       bool(tc.get("is_hidden", i >= hidden_threshold)),
            })

        return jsonify({"test_cases": test_cases}), 200

    except Exception as exc:
        return jsonify({"error": f"Test case generation failed: {exc}"}), 500


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5004))
    print(f"→ code-grader running on http://localhost:{port}")
    print(f"  Runtimes: python3, node  |  Timeout: {EXEC_TIMEOUT}s per test case")
    app.run(host="0.0.0.0", port=port, debug=True)
