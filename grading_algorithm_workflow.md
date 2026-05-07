# AI Grading & QA Pairing System Workflow

## 1. Question Extraction Module
**Purpose**: Extract structured questions, marks, and hierarchical parts from teacher-provided source materials (PDF/Images).
**Algorithm Extract_Questions(source_material, is_scanned)**
1. **Text Extraction**:
   - **IF** `is_scanned` is True: Use OCR Engine (`ocr_engine.py`) to convert images into text blocks.
   - **ELSE**: Use standard text extraction logic (e.g., `PyPDF2`).
2. **LLM Structuring Phase**:
   - Construct the prompt.
   - Send raw text to the Local LLM (`http://localhost:5003/api/generate`).
   - **Instruction**: "Extract all questions, subparts, and assigned points. Organize them into a nested JSON hierarchy."
3. **Output Generation**:
   - Parse and clean the returned LLM response into a valid JSON array.
   - **RETURN** structured questions array to the backend.

---

## 2. Rubric Generation Module
**Purpose**: Automatically create a cell-by-cell grading matrix (rubric) for each extracted question based on total marks and teacher criteria.
**Algorithm Generate_Rubrics(questions_array, strictness, global_columns)**
1. **Node Filtering**: 
   - Recursively traverse the `questions_array` tree.
   - Identify all "leaf" questions (questions with no subparts that require grading).
2. **Mark Range Calculation**:
   - For each leaf, calculate dynamic mark ranges based on total points and the number of columns (e.g., 10 marks over 3 columns -> "7-10 Marks", "4-6 Marks", "0-3 Marks").
3. **LLM Generation (Batch Processing)**:
   - Group leaf questions into batches (e.g., 5 per call) to optimize LLM performance.
   - **Construct Prompt**: Supply predefined criteria (or ask LLM to suggest 3-5 criteria) and the calculated Mark Ranges.
   - **Instruction**: "Generate a comprehensive, cell-by-cell grading rubric JSON array with precise descriptions for each mark level."
   - Call LLM and parse the batch JSON response.
4. **Output Integration**: 
   - Map the generated rubric matrices back to their respective question IDs (`path_key`).
   - **RETURN** mapped rubrics.

---

## 3. Question-Answer Pairing (QA Pairing) Module
**Purpose**: Intelligently map unstructured student-provided answers from submission files to the structured original question objects.
**Algorithm Pair_Student_Answers(original_questions_structure, student_submission_file)**
1. **Student Text Extraction**:
   - Backend combines all student submission attachments into a single standardized PDF via `/combine-to-pdf`.
   - Extract raw text from the combined PDF using the OCR or PyPDF engine.
   - Store results as `student_raw_text`.
2. **Mapping Phase (LLM)**:
   - Construct the Mapping Prompt enforcing the **Fixed Skeleton Rule**.
   - **Input 1**: `original_questions_structure` (The SACRED SKELETON).
   - **Input 2**: `student_raw_text`.
   - **Instruction**: "For each leaf question in the skeleton, find the corresponding student answer and populate the `student_answer` field. Do not mutate the schema, add new objects, or remove metadata."
   - Call LLM (`call_llm`).
3. **Output Generation**:
   - Validate that the final JSON strictly adheres to the original input skeleton.
   - **RETURN** Paired Question-Answer Result.

---

## 4. AI Evaluation (Grading) Module
**Purpose**: Evaluate the paired student answers against the generated rubrics and provided reference materials using Retrieval-Augmented Generation (RAG).
**Algorithm Grade_Exam(paired_questions_structure, reference_materials, strictness_level)**
1. **Resource Setup & RAG Indexing**:
   - Extract text from uploaded reference materials (PPT, PDF, TXT) via `ResourceProcessor`.
   - Chunk text into paragraphs and encode them into embeddings using `SentenceTransformer('all-MiniLM-L6-v2')`.
   - Store embeddings in a local `faiss` vector database cache for semantic search.
2. **Context Retrieval**:
   - For each question to be graded, query the `faiss` index using the question text.
   - Retrieve the Top-K relevant text chunks to provide factual context to the grader.
3. **LLM Evaluation (Batch Processing)**:
   - Extract leaf questions from `paired_questions_structure`.
   - Batch questions (e.g., 2 per call).
   - **Construct Prompt**: Combine Question, Student Answer, Rubric Matrix, Max Marks, Teacher Instructions, and the **Retrieved Reference Context**.
   - **Instruction**: "Evaluate the student answers. Return a JSON object with score, positive points, negative points, and summary."
   - Call LLM (`_grade_batch_with_ai`).
4. **Score Normalization**:
   - Apply a mathematical `strictness_multiplier` to the raw LLM score (e.g., "extremely strict" = 0.80 multiplier, "lenient" = 1.05 multiplier).
   - Bound the final score between 0 and the Max Marks.
   - **RETURN** the final grading evaluations mapped by question ID.

---

## 5. System Workflow Integration (Backend Connection)
**Purpose**: Coordinate frontend–backend interaction throughout the extraction, pairing, and grading pipelines.
**Algorithm Main_Workflow**:
1. **Upload Source Material**:
   - Teacher uploads an exam PDF on the Frontend.
   - Backend saves the file in a secure Supabase Storage bucket and stores metadata in the Prisma PostgreSQL database (`source_materials`).
2. **Extraction Phase**:
   - Backend (`gradingController.js -> extractQuestions`) downloads the PDF securely from Supabase.
   - Forwards the file buffers to the Python QA-Pairing Microservice (`:5002/extract-questions`).
   - Receives JSON structure and forwards it to frontend for teacher review/editing.
3. **Student Submission**:
   - Student submits their answers (PDFs/Images).
   - Backend securely stores submission files in Supabase (`attachments`).
4. **Pairing Phase**:
   - Teacher clicks "Grade".
   - Backend (`gradingController.js -> pairStudentAnswers`) downloads all attachments for a submission.
   - Sends attachments and the finalized Question JSON to the QA-Pairing Microservice (`:5002/pair-answers`).
5. **Grading & Finalization Phase**:
   - Backend sends the paired JSON structure to the Grade-English Microservice (`:5004/grade`).
   - The AI evaluates the answers and returns the scores and feedback.
   - Backend parses the AI response, creates `evaluations` records, calculates total scores, and persists everything into Prisma.
   - Final results are displayed seamlessly on the frontend UI.
