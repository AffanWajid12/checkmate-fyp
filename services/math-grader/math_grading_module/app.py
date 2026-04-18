from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

from app_back import run_full_grader

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/api/grade", methods=["POST"])
def grade_solution():
    """
    Grading endpoint for math solutions.
    Expects JSON body:
    {
        "rubric": "...",
        "question": "...",
        "model_solution": "...",
        "student_solution": "...",
        "score_threshold": 70, (optional)
        "strictness_threshold": 3 (optional)
    }
    """
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Required fields
    required_fields = ["rubric", "question", "model_solution", "student_solution"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
    
    rubric = data.get("rubric")
    question = data.get("question")
    model_solution = data.get("model_solution")
    student_solution = data.get("student_solution")
    score_threshold = data.get("score_threshold", 70)
    strictness_threshold = data.get("strictness_threshold", 3)
    
    try:
        # Run the full grading pipeline
        results = run_full_grader(
            rubric=rubric,
            question=question,
            model_solution=model_solution,
            student_solution=student_solution,
            score_threshold=score_threshold,
            strictness_threshold=strictness_threshold
        )
        return jsonify(results)
    except Exception as e:
        print(f"Error during grading: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "service": "math-grader"})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5007))
    print(f"Starting Math Grader Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
