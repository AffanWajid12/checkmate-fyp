from flask import jsonify
from app.services.assessment_service import (
    create_generated_assessment,
    fetch_all_assessments,
    fetch_assessment_by_id,
    remove_assessment
)

def generate_assessment(request):
    data = request.get_json()

    subject = data.get("subject")
    question_count = data.get("questionCount", 5)
    question_types = data.get("questionTypes", ["mcq"])
    assessment_type = data.get("assessmentType", "Quiz")
    generated_by = data.get("generatedBy", "teacher123")
    pdf_paths = data.get("sourceMaterials") or data.get("pdfPaths")  # optional list of PDF paths

    if not subject:
        return jsonify({"error": "Subject is required"}), 400

    try:
        assessment = create_generated_assessment(
            subject, question_count, question_types, assessment_type, generated_by, pdf_paths=pdf_paths
        )
        return jsonify(assessment.to_mongo()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_all_assessments():
    assessments = fetch_all_assessments()
    return jsonify(assessments), 200


def get_assessment_by_id(assessment_id):
    try:
        assessment = fetch_assessment_by_id(assessment_id)
        return jsonify(assessment.to_mongo()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 404


def delete_assessment(assessment_id):
    try:
        remove_assessment(assessment_id)
        return jsonify({"message": "Assessment deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 404
