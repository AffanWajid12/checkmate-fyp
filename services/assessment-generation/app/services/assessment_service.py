from app.models.assessment_model import Assessment, Question
from app.utils.llm_client import query_llm
import json
import uuid
from typing import List, Optional
from app.services.rag_service import RAGService

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

def _map_llm_q_to_model(q: dict) -> dict:
    # Accept camelCase/snake_case and normalize to model schema
    text = q.get("question_text") or q.get("questionText") or q.get("text") or ""
    raw_type = q.get("question_type") or q.get("type") or "mcq"
    t = str(raw_type).lower().strip()
    # LLM may use "mathematical"; model wants "math"
    question_type = "math" if t in {"mathematical", "math"} else t
    options = q.get("options") or []
    if not isinstance(options, list):
        options = [str(options)]
    answer = q.get("correct_answer") or q.get("answer") or ""
    marks = q.get("marks", 1)
    try:
        marks = int(marks)
    except Exception:
        marks = 1
    difficulty = (q.get("difficulty") or "").lower() or None
    if difficulty not in {"easy", "medium", "hard"}:
        difficulty = None
    return {
        "question_id": str(uuid.uuid4()),
        "question_text": str(text),
        "question_type": question_type,
        "options": [str(o) for o in options],
        "correct_answer": str(answer),
        "expected_keywords": q.get("expected_keywords") or [],
        "marks": marks,
        "difficulty": difficulty,
        "metadata": q.get("metadata") or {},
    }

def _build_rag_context(pdf_paths: Optional[List[str]], query: str, k: int = 6, max_chars: int = 4000) -> str:
    if not pdf_paths:
        return ""
    rag = RAGService()
    rag.load_pdfs(pdf_paths)
    chunks = rag.search(query, k=k)
    # Concatenate with simple delimiter and clip
    joined = "\n\n---\n\n".join([c.content for c in chunks if c and c.content])
    return joined[:max_chars]

def create_generated_assessment(
    subject,
    question_count,
    question_types,
    assessment_type,
    generated_by,
    pdf_paths: Optional[List[str]] = None,
    rag_top_k: int = 6,
    rag_max_chars: int = 4000,
):
    """
    Generates an assessment using an AI model via llm_client, optionally grounded with RAG over provided PDFs.
    """
    # Build optional RAG context
    rag_context = _build_rag_context(pdf_paths, query=str(subject), k=rag_top_k, max_chars=rag_max_chars)
    allowed_types = ", ".join(question_types)
    # Prompt prefers snake_case keys to align with model and Streamlit flow
    source_block = f"""
SOURCE MATERIAL EXCERPTS (authoritative; prefer content here; do not include this block in output):
{rag_context}
""" if rag_context else ""

    prompt = f"""
You are an Assessment Generator. Produce high-quality academic questions that strictly follow the caller's parameters and the assessment semantics below. Output ONLY a raw JSON array of question objects — no prose, no headings, no code fences, no trailing commas. Use double quotes for all keys/strings.

CALLER PARAMETERS
- subject/topic: "{subject}"
- assessment_kind: "{assessment_type}"
- question_count: {question_count}
- allowed_question_types: {allowed_types}

GENERAL OUTPUT RULES — HARD CONSTRAINTS
- Return ONLY a JSON array of question objects. Do not include any text outside the array.
- JSON schema per question (snake_case keys):
  {{
    "question_text": "string",
    "question_type": "mcq" | "short_text" | "essay" | "coding" | "math",
    "options": ["A","B","C","D"],   // present ONLY for "mcq"; else []
    "correct_answer": "string",     // correct choice for mcq, or concise solution for others
    "marks": 1,                      // integer
    "difficulty": "easy" | "medium" | "hard"
  }}
- STRICT TYPE AND COUNT COMPLIANCE:
  - Generate EXACTLY {question_count} questions in total.
  - Use ONLY these types: {allowed_types}. Do NOT introduce any other type.
  - If multiple types are allowed, distribute questions as evenly as possible among them.
- Do NOT use LaTeX or backslashes; write math in plain text/Unicode only to keep JSON valid.

ASSESSMENT SEMANTICS
- QUIZ (10–15 minutes): emphasize speed; mostly mcq/short_text; ~70% easy, ~30% medium; marks 1–2.
- EXAM — SESSIONAL (1 hour): ~40% easy, ~50% medium, ~10% hard; varied marks/types.
- EXAM — FINAL (3 hours): ~20% easy, ~50% medium, ~30% hard; include multi-step problems and a few higher-mark items.
- ASSIGNMENT (multi-day ≥ 4 days): fewer but deeper problems; emphasize essay/coding/math; include deliverables and a brief rubric in answer.

QUALITY RULES
- Keep questions aligned to the subject/topic and realistic for the assessment_kind.
- Avoid ambiguity; ensure each question is answerable with provided info.
- Output ONLY the JSON array using the exact keys listed above. No extra text.
{source_block}
"""
    try:
        llm_response = query_llm(prompt)
        raw = _sanitize_json_string(llm_response)
        question_data = json.loads(raw)
        if not isinstance(question_data, list):
            raise ValueError("LLM did not return a JSON array")
    except Exception as e:
        print(f"Error while parsing LLM response: {str(e)}")
        raise ValueError(f"Error while parsing LLM response: {str(e)}")

    # Convert JSON questions to MongoEngine Question objects (model schema)
    questions = [Question(**_map_llm_q_to_model(q)) for q in question_data]

    # Normalize assessment_type to model enum
    at = str(assessment_type).lower()
    if at not in {"quiz", "assignment", "exam"}:
        at = "quiz"

    assessment = Assessment(
        title=f"{subject} {assessment_type}",
        description=f"Auto-generated {assessment_type} for {subject}",
        assessment_type=at,
        source_materials=[str(p) for p in (pdf_paths or [])],
        total_questions=len(questions),
        questions=questions,
        created_by=generated_by,
        status="draft",
        version=1,
        rubric={},
    )
    assessment.save()
    return assessment


def fetch_all_assessments():
    return [a.to_mongo() for a in Assessment.objects]


def fetch_assessment_by_id(assessment_id):
    return Assessment.objects.get(id=assessment_id)


def remove_assessment(assessment_id):
    Assessment.objects(id=assessment_id).delete()
