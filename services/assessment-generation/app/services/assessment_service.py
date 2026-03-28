import json
import os
import tempfile
from typing import Dict, List, Optional, Tuple

import requests

from app.services.rag_service import RAGService
from app.utils.llm_client import query_llm

def _sanitize_json_string(s: str) -> str:
    s = (s or "").strip()
    if s.startswith("```"):
        lines = s.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        s = "\n".join(lines).strip()
    return s

_QUESTION_TYPES = {"mcq", "short_text", "essay", "coding", "math"}
_DIFFICULTIES = {"easy", "medium", "hard"}


def _get_any_key(q: dict, keys: List[str]):
    for k in keys:
        if k in q:
            return q.get(k)
    q_lower = {str(k).lower(): v for k, v in q.items()}
    for k in keys:
        lk = str(k).lower()
        if lk in q_lower:
            return q_lower.get(lk)
    return None


def _normalize_llm_question(q: dict, *, default_difficulty: str) -> dict:
    text = _get_any_key(q, [
        "questionText",
        "question_text",
        "text",
        "question",
        "prompt",
    ]) or ""

    raw_type = _get_any_key(q, [
        "questionType",
        "question_type",
        "type",
        "questiontype",
    ]) or "mcq"
    t = str(raw_type).lower().strip().replace("-", "_")
    if t in {"mathematical", "mathematics"}:
        t = "math"
    if t == "short":
        t = "short_text"
    if t not in _QUESTION_TYPES:
        raise ValueError(f"Invalid questionType from LLM: {t}")

    options = _get_any_key(q, ["options", "choices"]) 
    if options is None:
        options = []
    if not isinstance(options, list):
        options = [options]
    options = [str(o).strip() for o in options if str(o).strip()]

    expected_answer = _get_any_key(q, [
        "expectedAnswer",
        "expected_answer",
        "correct_answer",
        "answer",
        "expected",
        "solution",
    ]) or ""

    marks = _get_any_key(q, ["marks", "points", "score"])
    if marks is None:
        marks = 1
    try:
        marks = float(marks)
    except Exception:
        marks = 1
    if marks <= 0:
        marks = 1

    difficulty = (str(_get_any_key(q, ["difficulty"]) or default_difficulty or "")).lower().strip()
    if difficulty not in _DIFFICULTIES:
        difficulty = default_difficulty

    if not str(text).strip():
        raise ValueError("LLM produced an empty questionText")
    if not str(expected_answer).strip():
        raise ValueError("LLM produced an empty expectedAnswer")
    if t == "mcq" and len(options) < 2:
        raise ValueError("MCQ must include non-empty options")
    if t != "mcq":
        options = []

    return {
        "questionText": str(text).strip(),
        "questionType": t,
        "options": options,
        "expectedAnswer": str(expected_answer).strip(),
        "marks": marks,
        "difficulty": difficulty,
    }

def _download_pdf_to_temp(url: str, *, timeout_s: int = 30, max_bytes: int = 20 * 1024 * 1024) -> str:
    resp = requests.get(url, stream=True, timeout=timeout_s)
    resp.raise_for_status()
    fd, path = tempfile.mkstemp(suffix=".pdf")
    received = 0
    try:
        with os.fdopen(fd, "wb") as f:
            for chunk in resp.iter_content(chunk_size=64 * 1024):
                if not chunk:
                    continue
                received += len(chunk)
                if received > max_bytes:
                    raise ValueError("reference material too large")
                f.write(chunk)
        return path
    except Exception:
        try:
            os.remove(path)
        except Exception:
            pass
        raise


def _build_rag_context_from_urls(
    reference_materials: List[dict],
    query: str,
    *,
    k: int = 6,
    max_chars: int = 4000,
) -> Tuple[str, List[str]]:
    if not reference_materials:
        return "", []

    warnings: List[str] = []
    temp_paths: List[str] = []
    try:
        for item in reference_materials:
            url = (item.get("url") or "").strip()
            if not url:
                continue
            try:
                temp_paths.append(_download_pdf_to_temp(url))
            except Exception as e:
                warnings.append(f"Failed to download reference material: {str(e)}")

        if not temp_paths:
            return "", warnings

        rag = RAGService()
        rag.load_pdfs(temp_paths)
        chunks = rag.search(query, k=k)
        joined = "\n\n---\n\n".join([c.content for c in chunks if c and c.content])
        return joined[:max_chars], warnings
    finally:
        for p in temp_paths:
            try:
                os.remove(p)
            except Exception:
                pass

def _profile_used(assessment_type: str, difficulty: str) -> str:
    return f"{assessment_type}:{difficulty}"


def _build_prompts(
    *,
    subject: str,
    assessment_type: str,
    difficulty: str,
    question_type_counts: Dict[str, int],
    instructions: Optional[str],
    rag_context: str,
) -> Tuple[str, str]:
    profile = _profile_used(assessment_type, difficulty)

    system_prompt = (
        "You generate assessments. Return STRICT JSON only. "
        "Never wrap output in markdown fences. "
        "Output must be a JSON object with a single key 'questions' whose value is an array. "
        "Each question must include: questionText (string), questionType (mcq|short_text|essay|coding|math), "
        "options (array; non-empty only for mcq; empty otherwise), expectedAnswer (string), marks (number), difficulty (easy|medium|hard)."
    )

    semantics = {
        "quiz": {
            "easy": "Short and straightforward; mostly recall and basic application. Prefer 1-2 marks.",
            "medium": "Balanced; some reasoning; prefer 1-3 marks.",
            "hard": "Trickier; deeper reasoning; prefer 2-4 marks.",
        },
        "exam": {
            "easy": "Time-bounded; mix of easy parts; prefer 1-3 marks.",
            "medium": "Standard exam difficulty; mix of concepts; prefer 2-5 marks.",
            "hard": "Challenging multi-step items; prefer 4-8 marks.",
        },
        "assignment": {
            "easy": "Take-home; clear deliverables; light depth; prefer 3-6 marks.",
            "medium": "Take-home; deeper; can include small design/coding; prefer 5-10 marks.",
            "hard": "Take-home; substantial; multi-part; prefer 8-15 marks.",
        },
    }[assessment_type][difficulty]

    counts_lines = "\n".join([f"- {k}: {int(v)}" for k, v in question_type_counts.items()])
    total = sum(question_type_counts.values())

    instructions_block = f"\nAdditional instructions:\n{instructions.strip()}\n" if isinstance(instructions, str) and instructions.strip() else ""
    rag_block = f"\nReference excerpts (use as grounding; do not quote verbatim unless necessary):\n{rag_context}\n" if rag_context else ""

    user_prompt = f"""
Profile: {profile}

Subject: {subject}
AssessmentType: {assessment_type}
Difficulty: {difficulty}

QuestionTypeCounts (HARD CONSTRAINTS; must match exactly):
{counts_lines}

TotalQuestions (must equal sum above): {total}
{instructions_block}
{rag_block}

HARD RULES:
- Output MUST be a JSON object: {{"questions": [ ... ]}}
- The questions array length MUST equal {total}.
- The per-type counts MUST match QuestionTypeCounts exactly.
- For mcq: options must be a non-empty array of strings (prefer 4 options) and expectedAnswer must match one option.
- For non-mcq: options must be an empty array.
- Provide an expectedAnswer for every question.
- Follow these assessment semantics: {semantics}
"""
    return system_prompt, user_prompt


def _enforce_counts(questions: List[dict], question_type_counts: Dict[str, int]) -> None:
    total_expected = sum(question_type_counts.values())
    if len(questions) != total_expected:
        raise ValueError(f"LLM produced {len(questions)} questions but expected {total_expected}")

    actual: Dict[str, int] = {k: 0 for k in question_type_counts.keys()}
    for q in questions:
        qt = q.get("questionType")
        if qt not in actual:
            raise ValueError(f"LLM produced unexpected questionType: {qt}")
        actual[qt] += 1

    mismatches = {k: {"expected": question_type_counts[k], "actual": actual[k]} for k in actual if actual[k] != question_type_counts[k]}
    if mismatches:
        raise ValueError(f"questionTypeCounts mismatch: {mismatches}")


def generate_assessment_payload(
    *,
    subject: str,
    assessment_type: str,
    difficulty: str,
    question_type_counts: Dict[str, int],
    instructions: Optional[str],
    reference_materials: List[dict],
    rag_top_k: int = 6,
    rag_max_chars: int = 4000,
) -> dict:
    rag_context, warnings = _build_rag_context_from_urls(
        reference_materials,
        query=str(subject),
        k=rag_top_k,
        max_chars=rag_max_chars,
    )

    system_prompt, prompt = _build_prompts(
        subject=subject,
        assessment_type=assessment_type,
        difficulty=difficulty,
        question_type_counts=question_type_counts,
        instructions=instructions,
        rag_context=rag_context,
    )

    last_error: Optional[str] = None
    for attempt in range(2):
        llm_response = query_llm(prompt, system_prompt=system_prompt)
        raw = _sanitize_json_string(llm_response)
        try:
            parsed = json.loads(raw)
        except Exception as e:
            last_error = f"LLM returned invalid JSON: {str(e)}"
            if attempt == 0:
                prompt = (
                    prompt
                    + "\n\nYour previous response was invalid JSON. Regenerate the full output as STRICT JSON only (no markdown)."
                )
                continue
            raise ValueError(last_error)

        if isinstance(parsed, list):
            question_items = parsed
        elif isinstance(parsed, dict) and isinstance(parsed.get("questions"), list):
            question_items = parsed["questions"]
        else:
            last_error = "LLM output must be a JSON object with 'questions' array"
            if attempt == 0:
                prompt = (
                    prompt
                    + "\n\nYour previous response did not match the required schema. Regenerate the full output as {\"questions\": [...]} only."
                )
                continue
            raise ValueError(last_error)

        try:
            questions = [_normalize_llm_question(q, default_difficulty=difficulty) for q in question_items]
            _enforce_counts(questions, question_type_counts)
            break
        except ValueError as e:
            last_error = str(e)
            if attempt == 0:
                prompt = (
                    prompt
                    + "\n\nYour previous JSON violated these constraints: "
                    + last_error
                    + "\nRegenerate the ENTIRE JSON output correctly."
                )
                continue
            raise

    response = {
        "questions": questions,
        "profileUsed": _profile_used(assessment_type, difficulty),
    }
    if warnings:
        response["warnings"] = warnings
    return response
