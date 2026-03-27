from flask import Blueprint, request
from app.controllers.assessment_controller import (
    generate_assessment,
    get_all_assessments,
    get_assessment_by_id,
    delete_assessment
)

assessment_bp = Blueprint("assessment", __name__, url_prefix="/api/assessments")

@assessment_bp.route("/generate", methods=["POST"])
def generate():
    return generate_assessment(request)

@assessment_bp.route("/", methods=["GET"])
def get_all():
    return get_all_assessments()

@assessment_bp.route("/<string:assessment_id>", methods=["GET"])
def get_one(assessment_id):
    return get_assessment_by_id(assessment_id)

@assessment_bp.route("/<string:assessment_id>", methods=["DELETE"])
def delete(assessment_id):
    return delete_assessment(assessment_id)
