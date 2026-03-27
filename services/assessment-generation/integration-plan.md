<!-- filepath: c:\Users\Administrator\Desktop\FYP\checkmate-fyp\services\assessment-generation\integration-plan.md -->

# Assessment Generation Integration Plan (Backend → Microservice → Frontend)

This plan integrates the existing Flask-based `services/assessment-generation` service into the main Node/Express backend (`/backend`) and the web frontend (`/frontend`). It follows the required order:

1) **Backend compatibility first** (DB schema + backend API endpoints + reference materials)
2) **Refactor assessment-generation microservice** (contract normalization + prompts + PDFs via links + use `services/llm`)
3) **Frontend generation UX + preview + export DOCX**

---

## Phase 0 — Baseline discovery + API contract lock (no behavior changes)

### Goals
- Freeze a **single request/response contract** for “generation” to avoid repeated rewrites across backend + microservice + frontend.
- Document how uploaded reference materials are represented (Supabase storage paths + signed URLs).

### Tasks
- **Confirm existing backend storage approach**
  - Backend already uploads assessment source materials to Supabase Storage bucket `source-materials` and stores records in Postgres table `source_materials` (see Prisma model `source_materials` in `backend/prisma/schema.prisma`).
  - Backend already has `generateSignedUrl()` utilities in `backend/src/utils/courseHelpers.js` (used elsewhere for signed URLs).
- **Define the generation contract (backend-facing)**
  - Request fields should cover what exists in `services/assessment-generation/streamlit_app.py` (assessment type, difficulty, question counts by type, subject, optional instructions, optional reference materials).
  - Response must return questions + expected answers in a structure backend can store and frontend can render.

### Deliverable
- A written “contract” section (below) that both backend endpoint and microservice endpoint will implement.

---

## Phase 1 — Backend-first implementation (schema + endpoints + storage)

### 1.1 Schema changes in `backend/prisma/schema.prisma`

#### Goals
- Introduce **Generated Assessments** as a separate domain object distinct from `assessments`.
- Introduce **Reference Materials** as a separate table that can be attached to a generation request.
- Ensure Generated Assessments are **associated with a teacher** (required).

#### Current relevant schema state
- `assessments` are course/announcement-linked objects used for real submissions.
- `source_materials` exist but are tied to `assessments` (not to generation sessions).

#### Proposed schema additions (conceptual)
- `generated_assessments`
  - `id` (uuid)
  - `teacher_id` → `users.id`
  - `title` (derived from subject/type/difficulty)
  - `subject`
  - `assessment_type` (reuse existing `AssessmentType` enum or add separate enum if needed)
  - `difficulty` (new enum or string constrained to `easy|medium|hard`)
  - `instructions` (optional: free text “additional instructions”)
  - `question_count`
  - `question_payload` (JSONB): normalized questions array returned by microservice
  - `status` (draft/final optional)
  - timestamps

- `reference_materials`
  - `id` (uuid)
  - `teacher_id` → `users.id`
  - `course_id` (optional)
  - `bucket_path`
  - `file_name`, `file_size`, `mime_type`
  - timestamps

- Join table: `generated_assessment_reference_materials` (many-to-many)
  - `generated_assessment_id`
  - `reference_material_id`

> Notes:
> - This is intentionally separated from existing `source_materials` (which belong to real `assessments`).
> - Implementation can reuse the same Supabase bucket (`source-materials`) to avoid new infra.


### 1.2 Backend endpoints (Express) — generation + reference materials

#### Goals
- Frontend calls backend only.
- Backend owns persistence in Postgres.
- Backend calls microservice only for *generation computation*, not storage.

#### New endpoints (proposed)
1) **Reference Materials management**
- `POST /api/reference-materials` (teacher)
  - multipart upload `files[]`
  - upload to Supabase Storage (reuse existing upload middleware `uploadMultiple`)
  - create `reference_materials` rows
- `GET /api/reference-materials` (teacher)
  - list teacher’s uploaded reference materials; optionally filter by course
- (Optional) `DELETE /api/reference-materials/:id` (teacher)

2) **Generate assessment (backend orchestrator)**
- `POST /api/assessments/generate` (teacher)
  - JSON body includes parameters + selected reference material IDs
  - backend resolves those reference IDs → storage paths → signed URLs
  - backend calls Flask microservice generation endpoint with **URL-based materials**
  - backend normalizes microservice response → persists `generated_assessments`
  - returns generated_assessment to frontend

3) **Generated assessment retrieval**
- `GET /api/generated-assessments` (teacher)
- `GET /api/generated-assessments/:id` (teacher)

4) **DOCX export**
- `GET /api/generated-assessments/:id/export.docx` (teacher)
  - backend generates a clean `.docx` using stored payload (no LLM call)


### 1.3 Backend-to-microservice call plumbing

#### Goals
- Use a predictable base URL for the microservice.
- Avoid passing local file paths; pass **signed URLs** for PDFs.

#### Tasks
- Add backend config for assessment-generation service URL (e.g. env var).
- Implement an internal “client” helper to call microservice.
- Ensure timeouts, error mapping, and retries (simple ones) are consistent.


### 1.4 Backend request/response contract (to be enforced)

#### Backend endpoint request (frontend → backend)
- `subject` (string)
- `assessmentType` (`QUIZ|ASSIGNMENT|EXAM` or `quiz|assignment|exam` — pick one and standardize)
- `difficulty` (`easy|medium|hard`)
- `questionTypeCounts` (object): `mcq`, `short_text`, `essay`, `coding`, `math` counts (like Streamlit)
- `instructions` (optional string)
- `referenceMaterialIds` (optional array of UUIDs)

#### Backend endpoint response (backend → frontend)
- `generatedAssessment` object including:
  - metadata (id, teacherId, subject, assessmentType, difficulty, instructions, createdAt)
  - `questions` (array) with a stable structure:
    - `index`
    - `type`
    - `text`
    - `options` (array, optional)
    - `expectedAnswer`
    - `marks`
    - `difficulty`

> The backend should store the microservice output as JSONB and also return a frontend-friendly normalized array.

---

## Phase 2 — Refactor `services/assessment-generation` into a true microservice

### Goals
- Remove microservice ownership of persistence (MongoDB becomes optional or removed from the “generate” path).
- Normalize request/response JSON to match backend contract.
- Improve prompt differentiation by **assessment type** and **difficulty** (separate prompt profiles).
- Replace direct Groq/OpenAI calls with the existing `services/llm` service.
- Support **PDF links** from backend (Supabase signed URLs), not local paths.

### 2.1 API contract + routes cleanup

#### Current issues from code
- Generation route currently lives under `/api/assessments/generate`, and blueprint prefix is duplicated between `app/__init__.py` and `app/routes/assessment_routes.py`.
- Controller currently returns `assessment.to_mongo()` and persists to Mongo.

#### Refactor tasks
- Provide a single “pure generation” endpoint (service-internal), conceptually:
  - `POST /generate`
- Remove or de-emphasize Mongo CRUD endpoints (`GET/DELETE`) from the microservice integration path.
- Ensure **no MongoDB save** happens for generation requests used by the main backend.


### 2.2 Request normalization in microservice

#### Target request (backend → microservice)
- `subject`
- `assessmentType` (`quiz|assignment|exam`)
- `difficulty` (`easy|medium|hard`)
- `questionTypeCounts` (same shape as Streamlit)
- `questionCount` (optional; or derived from sum)
- `instructions` (optional)
- `referenceMaterials` (optional array): each item contains
  - `url` (signed URL)
  - `fileName` (optional)

> This mirrors the Streamlit UI while eliminating server-local paths.


### 2.3 PDF ingestion from URLs (RAG)

#### Current behavior
- `RAGService.load_pdfs(pdf_paths)` assumes `os.path.exists(path)`; it loads from disk.

#### Required behavior
- Accept PDF links from backend (signed URLs).
- Microservice should:
  - download PDFs to temp files, OR
  - extend the loader to handle `http(s)` sources.

Deliverable: RAG layer that can process `referenceMaterials[].url`.


### 2.4 Prompt profiles: assessment type × difficulty

#### Current behavior
- Flask service prompt has general “ASSESSMENT SEMANTICS” and mentions quiz/exam/assignment.
- Difficulty is only an output constraint; caller can’t enforce a bias.
- Streamlit prototype already includes `difficulty_bias` and strict per-type counts.

#### Required refactor
- Define prompt “profiles” (templates) such as:
  - QUIZ + easy/medium/hard
  - ASSIGNMENT + easy/medium/hard
  - EXAM + easy/medium/hard
- Each profile should encode:
  - time expectation
  - marks distribution guidance
  - expected cognitive level
  - strict count rules for question types
  - strict output schema

Deliverable: deterministic prompt selection based on inputs.


### 2.5 Replace `llm_client.py` with `services/llm` integration

#### Current behavior
- `query_llm()` uses Groq directly via OpenAI SDK.

#### Required behavior
- Call the existing microservice `services/llm` (already in repo) as the single LLM entrypoint.
- Define a small adapter inside assessment-generation service:
  - `POST` to llm service with `{ prompt, model?, temperature?, maxTokens? }` (exact payload depends on existing llm service API; must be confirmed from code).

Deliverable: assessment-generation service becomes a client of `services/llm`, not of Groq directly.


### 2.6 Response normalization (microservice → backend)

#### Required response
Return a pure JSON payload (no Mongo fields) containing:
- `questions`: array of
  - `questionText`
  - `questionType`
  - `options` (only for mcq)
  - `expectedAnswer`
  - `marks`
  - `difficulty`
- Optional metadata:
  - prompt profile used
  - any warnings (e.g., type mismatch)

Backend will then do final normalization + persistence.


### 2.7 Observability and failure modes
- Ensure parse failures return structured errors (400/422) with a short message.
- Include raw LLM output in logs only (not returned) to avoid leaking tokens/PII.

---

## Phase 3 — Backend finalization: normalization, persistence, and export

### Goals
- Backend persists generated assessments as first-class records.
- Backend returns a preview-friendly format to frontend.
- Backend provides DOCX export endpoint.

### 3.1 Backend normalization layer
- Create a mapping function to convert microservice `questions[]` into a stable internal JSONB payload.
- Enforce:
  - total count matches requested
  - per-type counts match requested
  - `mcq` options present and non-empty

### 3.2 Persist Generated Assessment
- In `POST /api/assessments/generate`:
  - create `generated_assessments` row
  - attach selected `reference_materials` (join table)

### 3.3 DOCX generation endpoint
- `GET /api/generated-assessments/:id/export.docx`
- Implementation notes:
  - Use stored JSONB payload (no microservice call)
  - Include: title block, instructions, then question list, then an “Answer Key” section.
  - Use `Content-Disposition: attachment; filename="..."`

---

## Phase 4 — Frontend (web) generation form + preview + export

### Goals
- Add an intuitive teacher-facing generation flow similar to `streamlit_app.py`:
  - assessment type
  - difficulty
  - subject/topic
  - per-question-type counts
  - additional instructions
  - reference materials selection (upload new or choose existing)
- Render a clean preview.
- Provide an **Export DOCX** action calling backend.

### 4.1 UI: Generation page/components
- New page/route in `/frontend/src` (exact location depends on current routing conventions).
- Form fields:
  - `assessmentType`: select (quiz/assignment/exam)
  - `difficulty`: select (easy/medium/hard)
  - `subject`: input
  - counts per type: mcq/short_text/essay/coding/math (sum displayed)
  - `instructions`: textarea
  - reference materials:
    - list existing (from `GET /api/reference-materials`)
    - upload new (calls `POST /api/reference-materials`), then select

### 4.2 Frontend API integration
- On submit:
  - call `POST /api/assessments/generate` with JSON body.
  - show loading + error states (LLM may take time).

### 4.3 Preview renderer
- Render questions in a structured way:
  - MCQ shows A/B/C/D options
  - Others show expected answer
  - show marks + difficulty labels

### 4.4 Export DOCX button
- Button triggers file download from:
  - `GET /api/generated-assessments/:id/export.docx`
- Use browser download flow (create `<a href>` with blob).

---

## Phase 5 — End-to-end hardening + acceptance checks

### Integration tests (manual + automated where available)
- **Backend-only**
  - Create reference materials (upload) + list.
  - Generate assessment with no materials.
  - Generate assessment using selected materials.
  - Export docx.

- **Microservice**
  - Generate with strict type counts.
  - Generate with difficulty settings and verify distribution constraints in output.
  - Generate with PDF URL RAG enabled.

- **Frontend**
  - Form validation (sum of counts > 0; subject required).
  - Preview correctness.
  - Export downloads correctly.

### Non-functional checkpoints
- Timeouts: backend should have a generous timeout on microservice call.
- Security: ensure reference material signed URLs are short-lived and only generated for authorized teacher.
- Logging: request IDs across backend → microservice.

---

## Implementation sequencing summary (clear order)

1. **Backend schema**: add `generated_assessments` + `reference_materials` (+ join table)
2. **Backend APIs**: reference materials upload/list + `POST /api/assessments/generate` + retrieval + DOCX export
3. **Microservice refactor**: pure generation endpoint + contract normalization + prompt profiles + PDF URL support + call `services/llm`
4. **Backend finalize integration**: normalize microservice response + persist + expose to frontend
5. **Frontend**: generation form + preview + export docx button
6. **Hardening**: validations + E2E checks
