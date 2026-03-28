from flask import Blueprint, request
from app.controllers.assessment_controller import generate_assessment

generation_bp = Blueprint("generation", __name__)


@generation_bp.get("/health")
def health():
    return {"status": "ok"}, 200


@generation_bp.post("/generate")
def generate():
    return generate_assessment(request)
