import os
import json
import uuid
from typing import List, Dict, Any

import streamlit as st
from dotenv import load_dotenv

# Prefer using backend utilities and models directly
from app.utils.llm_client import query_llm
from app.config import init_db
from app.models.assessment_model import Assessment, Question
from app.services.rag_service import RAGService
import tempfile


# ---------- Setup ----------
load_dotenv()  # Load .env so LLM_API_URL, LLM_MODEL, MONGO_URI are available


# ---------- Helpers ----------
QUESTION_TYPE_MAP_TO_MODEL = {
	"mcq": "mcq",
	"short_text": "short_text",
	"essay": "essay",
	"coding": "coding",
	"mathematical": "math",  # normalize external to model's "math"
	"math": "math",
}

QUESTION_TYPE_MAP_TO_LLM = {
	"mcq": "mcq",
	"short_text": "short_text",
	"essay": "essay",
	"coding": "coding",
	"math": "mathematical",  # LLM prompt prefers "mathematical"
}


def sanitize_json_string(s: str) -> str:
	"""Remove Markdown code fences and trim whitespace to get raw JSON."""
	s = s.strip()
	if s.startswith("```"):
		# Remove leading ```json or ``` and trailing ```
		lines = s.splitlines()
		# Drop first and last fence lines if present
		if lines and lines[0].startswith("```"):
			lines = lines[1:]
		if lines and lines[-1].startswith("```"):
			lines = lines[:-1]
		s = "\n".join(lines).strip()
	return s


def normalize_question_dict(q: Dict[str, Any]) -> Dict[str, Any]:
	"""Accepts either camelCase or snake_case keys and normalizes to model schema."""
	# Accept multiple possible keys
	question_text = q.get("question_text") or q.get("questionText") or q.get("text")
	raw_type = q.get("question_type") or q.get("type")
	options = q.get("options") or []
	correct_answer = q.get("correct_answer") or q.get("answer")
	marks = q.get("marks", 1)
	difficulty = (q.get("difficulty") or q.get("level") or "").lower() or None

	# Normalize type to model's allowed choices
	t = (str(raw_type).lower() if raw_type else "").strip()
	question_type = QUESTION_TYPE_MAP_TO_MODEL.get(t, t or "mcq")

	# Ensure options is a list of strings
	if not isinstance(options, list):
		options = [str(options)]
	options = [str(o) for o in options]

	return {
		"question_id": str(uuid.uuid4()),
		"question_text": str(question_text) if question_text else "",
		"question_type": question_type,
		"options": options,
		"correct_answer": str(correct_answer) if correct_answer is not None else "",
		"expected_keywords": q.get("expected_keywords") or [],
		"marks": int(marks) if isinstance(marks, (int, float, str)) and str(marks).isdigit() else 1,
		"difficulty": difficulty if difficulty in {"easy", "medium", "hard"} else None,
		"metadata": q.get("metadata") or {},
	}


def call_llm_for_assessment(
	subject: str,
	assessment_type: str,
	difficulty: str,
	question_count: int,
	question_type_counts: Dict[str, int],
	allow_latex: bool,
	rag_context: str | None = None,
) -> List[Dict[str, Any]]:
	"""Build a robust prompt and parse the LLM JSON array response into normalized dicts, enforcing type counts."""
	# Map types for LLM and filter to requested (count > 0)
	requested_types = [t for t, c in (question_type_counts or {}).items() if (c or 0) > 0]
	llm_types = [QUESTION_TYPE_MAP_TO_LLM.get(t, t) for t in requested_types]

	# Prepare counts JSON snippet for the prompt
	counts_lines = []
	for t in ["mcq", "short_text", "essay", "coding", "math"]:
		c = int(question_type_counts.get(t, 0)) if question_type_counts else 0
		counts_lines.append(f'    "{QUESTION_TYPE_MAP_TO_LLM.get(t, t)}": {c}')
	counts_block = "{\n" + ",\n".join(counts_lines) + "\n}"

	latex_clause = (
		"- Math may include LaTeX/Markdown formulas using $...$ or $$...$$.\n"
		"- IMPORTANT JSON RULES: escape backslashes as \\\\ and use \\n for line breaks inside strings.\n"
	) if allow_latex else (
		"- Do NOT use LaTeX or backslashes; write math in plain text/Unicode only.\n"
	)
	source_block = f"""
SOURCE MATERIAL EXCERPTS (authoritative; prefer content here; do not include this block in output):
{rag_context}
""" if rag_context else ""

	prompt = f"""
You are an Assessment Generator. Produce high-quality academic questions that strictly follow the caller's parameters and the assessment semantics below.

CALLER PARAMETERS
- subject/topic: "{subject}"
- assessment_kind: "{assessment_type}"
- difficulty_bias: "{difficulty}"
- question_count: {question_count}
- question_type_counts (hard constraint; must sum to question_count):
{counts_block}

GENERAL OUTPUT RULES — HARD CONSTRAINTS
- Return ONLY a raw JSON array of question objects. No prose, no headings, no code fences, no trailing commas.
- Use double quotes for all keys/strings. Do not include comments.
- JSON schema per question (snake_case keys):
  {{
    "question_text": "string",
    "question_type": "mcq" | "short_text" | "essay" | "coding" | "math",
    "options": ["A","B","C","D"],   // present ONLY for "mcq"; else []
    "correct_answer": "string",          // correct choice text for mcq, or concise solution
    "marks": 1,                           // integer
    "difficulty": "easy" | "medium" | "hard"
  }}
- STRICT TYPE AND COUNT COMPLIANCE:
  - Generate EXACTLY the total question_count.
  - Generate EXACTLY the specified number of questions for each type from question_type_counts.
  - Do NOT use any type not present in question_type_counts.
{latex_clause}
{source_block}

ASSESSMENT SEMANTICS (choose based on assessment_kind)
- QUIZ (target total: 10–15 minutes): emphasize speed; ~70% easy, ~30% medium; marks 1–2; mostly mcq/short_text.
- EXAM — SESSIONAL (1 hour): 55–65 minutes; ~40% easy, ~50% medium, ~10% hard; ~40% mcq/short_text, ~60% essay/coding/math.
- EXAM — FINAL (3 hours): 170–190 minutes; ~20% easy, ~50% medium, ~30% hard; ~30% mcq/short_text, ~70% essay/coding/math; include capstone.
- ASSIGNMENT (multi-day ≥ 480 minutes): fewer, deeper problems; emphasize essay/coding/math; ~20% medium, ~80% hard; include deliverables.

QUALITY RULES
- Keep content aligned to the subject/topic and difficulty.
- Ensure the sum of estimated time implied by difficulty/marks fits the target window.
- If constraints conflict, preserve type counts and total question_count first.
"""

	raw = query_llm(prompt)
	raw = sanitize_json_string(raw)
	try:
		data = json.loads(raw)
		if not isinstance(data, list):
			raise ValueError("LLM did not return a JSON array")
	except Exception as e:
		raise ValueError(f"Failed to parse LLM output as JSON: {e}\nRaw: {raw[:500]}")

	# Normalize each question to model schema
	normalized = [normalize_question_dict(q) for q in data]
	return normalized


def render_assessment_preview(title: str, subject: str, assessment_type: str, difficulty: str, questions: List[Dict[str, Any]]):
	st.markdown(f"# {title}")
	st.markdown(f"**Subject/Topic:** {subject}  ")
	st.markdown(f"**Type:** {assessment_type.capitalize()}  |  **Difficulty:** {difficulty.capitalize()}")
	st.markdown(f"**Total Questions:** {len(questions)}")
	st.markdown("---")

	for i, q in enumerate(questions, start=1):
		st.markdown(f"### Q{i}. ({q.get('marks', 1)} mark{'s' if q.get('marks', 1) != 1 else ''})")
		st.markdown(f"_{q.get('question_type','').upper()}_")
		st.write(q.get("question_text", ""))
		if q.get("question_type") == "mcq" and q.get("options"):
			options = q["options"]
			correct = q.get("correct_answer")
			# Show options with bold on correct
			for idx, opt in enumerate(options):
				label = f"{chr(65+idx)}. {opt}"
				if str(opt).strip() == str(correct).strip():
					st.markdown(f"- **{label}**")
				else:
					st.markdown(f"- {label}")
		elif q.get("correct_answer"):
			st.markdown(f"**Answer (expected):** {q['correct_answer']}")
		st.markdown("---")


def save_assessment_to_db(title: str, subject: str, assessment_type: str, difficulty: str, questions: List[Dict[str, Any]], created_by: str = "streamlit") -> str:
	# Ensure DB connection
	init_db()

	# Build Question embedded docs
	question_docs = [Question(**q) for q in questions]

	doc = Assessment(
		title=title,
		description=f"Auto-generated {assessment_type} ({difficulty}) for {subject}",
		assessment_type=assessment_type,
		source_materials=st.session_state.get("uploaded_pdf_names", []),
		total_questions=len(question_docs),
		questions=question_docs,
		created_by=created_by,
		status="draft",
		version=1,
		rubric={},
	)
	doc.save()
	return str(doc.id)


# ---------- UI ----------
st.set_page_config(page_title="Assessment Generator", page_icon="📝", layout="centered")
st.title("CheckMate Assessment Generator")
st.caption("Generate assessments with AI and preview them as a formatted document.")

with st.form("gen_form"):
	col1, col2 = st.columns(2)
	with col1:
		assessment_type = st.selectbox("Assessment type", ["quiz", "assignment", "exam"], index=0)
		difficulty = st.selectbox("Difficulty bias", ["easy", "medium", "hard"], index=1)
		subject = st.text_input("Subject / Topic", value="Mathematics - Algebra")
	with col2:
		st.markdown("Select counts per question type (sum = total questions)")
		c_mcq = st.number_input("MCQ count", min_value=0, max_value=100, value=5, step=1)
		c_short = st.number_input("Short text count", min_value=0, max_value=100, value=0, step=1)
		c_essay = st.number_input("Essay count", min_value=0, max_value=100, value=0, step=1)
		c_coding = st.number_input("Coding count", min_value=0, max_value=100, value=0, step=1)
		c_math = st.number_input("Math count", min_value=0, max_value=100, value=0, step=1)

	allow_latex = st.checkbox("Allow LaTeX for math questions", value=True)
	uploaded_files = st.file_uploader("Source material PDFs (optional)", type=["pdf"], accept_multiple_files=True)
	question_type_counts = {
		"mcq": int(c_mcq),
		"short_text": int(c_short),
		"essay": int(c_essay),
		"coding": int(c_coding),
		"math": int(c_math),
	}
	question_count = sum(question_type_counts.values())
	st.info(f"Total questions: {question_count}")

	submitted = st.form_submit_button("Generate Assessment")

if submitted:
	llm_url = os.getenv("LLM_API_URL")
	llm_model = os.getenv("LLM_MODEL")
	if not llm_url or not llm_model:
		st.error("LLM_API_URL and LLM_MODEL must be set in the environment (.env).")
	else:
		# Persist uploaded PDFs to temp paths and prepare RAG context
		temp_paths: list[str] = []
		st.session_state["uploaded_pdf_names"] = []
		if uploaded_files:
			for uf in uploaded_files:
				with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
					tmp.write(uf.read())
					temp_paths.append(tmp.name)
					st.session_state["uploaded_pdf_names"].append(getattr(uf, "name", os.path.basename(tmp.name)))
		rag_context = ""
		if temp_paths:
			try:
				rag = RAGService()
				rag.load_pdfs(temp_paths)
				# Use subject as the retrieval query; fetch a generous top-k and clip in prompt
				top_k = min(8, max(3, question_count))
				results = rag.search(subject, k=top_k)
				rag_context = "\n\n---\n\n".join([r.content for r in results if r and r.content])[:4000]
			except Exception as e:
				st.warning(f"RAG setup failed, proceeding without grounding: {e}")

		with st.spinner("Generating questions via LLM..."):
			try:
				normalized_questions = call_llm_for_assessment(
					subject=subject,
					assessment_type=assessment_type,
					difficulty=difficulty,
					question_count=question_count,
					question_type_counts=question_type_counts,
					allow_latex=allow_latex,
					rag_context=rag_context or None,
				)
			except Exception as e:
				st.error(f"Generation failed: {e}")
				normalized_questions = []

		if normalized_questions:
			title = f"{subject} — {assessment_type.capitalize()} ({difficulty.capitalize()})"
			render_assessment_preview(title, subject, assessment_type, difficulty, normalized_questions)

			# Validate type counts
			actual_counts = {}
			for q in normalized_questions:
				qt = q.get("question_type")
				actual_counts[qt] = actual_counts.get(qt, 0) + 1
			mismatches = [
				f"{t}: expected {question_type_counts.get(t,0)}, got {actual_counts.get(t,0)}"
				for t in ["mcq","short_text","essay","coding","math"]
				if question_type_counts.get(t,0) != actual_counts.get(t,0)
			]
			if mismatches:
				st.warning("Type-count mismatches detected: " + "; ".join(mismatches))

			st.success("Preview ready.")
			if st.button("Save to database"):
				try:
					new_id = save_assessment_to_db(title, subject, assessment_type, difficulty, normalized_questions)
					st.success(f"Saved assessment with id: {new_id}")
				except Exception as e:
					st.error(f"Failed to save assessment: {e}")

st.info("Tip: Run with `streamlit run backend/streamlit_app.py` and ensure your .env has MONGO_URI, LLM_API_URL, and LLM_MODEL.")

