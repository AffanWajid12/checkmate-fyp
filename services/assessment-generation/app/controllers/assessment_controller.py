from flask import jsonify
from app.services.assessment_service import generate_assessment_payload


_ALLOWED_ASSESSMENT_TYPES = {"quiz", "assignment", "exam"}
_ALLOWED_DIFFICULTIES = {"easy", "medium", "hard"}
_QUESTION_TYPE_KEYS = ["mcq", "short_text", "essay", "coding", "math"]


def _json_error(message: str, status_code: int, details=None):
    payload = {"error": message}
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status_code


def generate_assessment(request):
    data = request.get_json(silent=True) or {}

    subject = (data.get("subject") or "").strip()
    assessment_type = str(data.get("assessmentType") or "").lower().strip()
    difficulty = str(data.get("difficulty") or "").lower().strip()
    instructions = data.get("instructions")
    question_type_counts = data.get("questionTypeCounts") or {}
    reference_materials = data.get("referenceMaterials")

    if not subject:
        return _json_error("subject is required", 400)
    if assessment_type not in _ALLOWED_ASSESSMENT_TYPES:
        return _json_error("assessmentType must be quiz|assignment|exam", 422)
    if difficulty not in _ALLOWED_DIFFICULTIES:
        return _json_error("difficulty must be easy|medium|hard", 422)
    if not isinstance(question_type_counts, dict):
        return _json_error("questionTypeCounts must be an object", 422)

    normalized_counts = {}
    for key in _QUESTION_TYPE_KEYS:
        raw = question_type_counts.get(key, 0)
        try:
            value = int(raw)
        except Exception:
            return _json_error(f"questionTypeCounts.{key} must be a number", 422)
        if value < 0:
            return _json_error(f"questionTypeCounts.{key} must be >= 0", 422)
        normalized_counts[key] = value

    total_requested = sum(normalized_counts.values())
    if total_requested <= 0:
        return _json_error("sum(questionTypeCounts) must be > 0", 422)

    if reference_materials is not None:
        if not isinstance(reference_materials, list):
            return _json_error("referenceMaterials must be an array", 422)
        for i, item in enumerate(reference_materials):
            if not isinstance(item, dict):
                return _json_error("referenceMaterials items must be objects", 422)
            url = (item.get("url") or "").strip()
            if not (url.startswith("http://") or url.startswith("https://")):
                return _json_error(f"referenceMaterials[{i}].url must be http(s)", 422)

    try:
        payload = generate_assessment_payload(
            subject=subject,
            assessment_type=assessment_type,
            difficulty=difficulty,
            question_type_counts=normalized_counts,
            instructions=instructions,
            reference_materials=reference_materials or [],
        )
        return jsonify(payload), 200
    except ValueError as e:
        # LLM output/schema/count mismatch
        return _json_error(str(e), 502)
    except Exception:
        return _json_error("generation failed", 500)
