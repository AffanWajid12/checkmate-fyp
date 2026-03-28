# Backend Pseudocode Documentation
## CheckMate Assessment Generator - Core Algorithms and Functions

---

## MAIN WORKFLOW ALGORITHMS

### Algorithm Generate_Assessment:
**Purpose:** Generate a complete academic assessment using AI with optional RAG context from PDF materials

**Input:** subject, question_count, question_types[], assessment_type, generated_by, pdf_paths[]  
**Output:** Assessment object saved to database

```
Algorithm Generate_Assessment:
1. RAG Context Building Phase (Optional):
   Initialize rag_context as empty string
   IF pdf_paths is provided AND not empty THEN:
       Call build_rag_context(pdf_paths, subject, k=6, max_chars=4000)
       Store result in rag_context
   END IF

2. Prompt Construction Phase:
   Initialize allowed_types from question_types array
   IF rag_context is not empty THEN:
       Construct source_block with RAG excerpts
   ELSE:
       Set source_block to empty
   END IF
   
   Construct llm_prompt with:
       - Subject/topic information
       - Assessment type (quiz/exam/assignment)
       - Question count requirement
       - Allowed question types list
       - Output JSON schema specification
       - Type and count compliance rules
       - Assessment-specific semantic rules
       - Quality requirements
       - Source material block (if available)

3. LLM Query Phase:
   Call query_llm(llm_prompt)
   Store response in llm_response

4. Response Sanitization Phase:
   Call sanitize_json_string(llm_response)
   Remove markdown code fences
   Trim whitespace
   Store cleaned response in raw

5. JSON Parsing Phase:
   TRY:
       Parse raw as JSON into question_data
       IF question_data is not a list THEN:
           THROW ValueError("LLM did not return JSON array")
       END IF
   CATCH Exception e:
       Log error message
       THROW ValueError with error details
   END TRY

6. Question Normalization Phase:
   Initialize empty questions array
   FOR each q_json in question_data:
       Call map_llm_question_to_model(q_json)
       Create Question object with normalized data
       Append Question to questions array
   END FOR

7. Assessment Type Normalization Phase:
   Convert assessment_type to lowercase
   IF assessment_type NOT IN ["quiz", "assignment", "exam"] THEN:
       Set assessment_type to "quiz"
   END IF

8. Assessment Object Creation Phase:
   Create Assessment object with:
       title = "{subject} {assessment_type}"
       description = "Auto-generated {assessment_type} for {subject}"
       assessment_type = normalized type
       source_materials = pdf_paths or empty array
       total_questions = length of questions array
       questions = questions array
       created_by = generated_by
       status = "draft"
       version = 1
       rubric = empty dictionary

9. Database Persistence Phase:
   Call assessment.save()
   RETURN assessment object
```

---

### Algorithm RAG_Document_Processing:
**Purpose:** Load PDF documents, chunk them, and prepare vector embeddings for semantic search

**Input:** pdf_paths[]  
**Output:** Vectorstore database ready for querying

```
Algorithm RAG_Document_Processing:
1. Initialization Phase:
   Initialize HuggingFace embeddings with model "sentence-transformers/all-MiniLM-L6-v2"
   Initialize RecursiveCharacterTextSplitter:
       chunk_size = 500 characters
       chunk_overlap = 100 characters
   Initialize empty documents array
   Set vectorstore db to NULL

2. PDF Loading Phase:
   Initialize empty texts array
   FOR each pdf_path in pdf_paths:
       IF pdf_path does not exist THEN:
           Log "File not found" warning
           CONTINUE to next iteration
       END IF
       
       Initialize empty docs array
       
       // Primary loader attempt
       TRY:
           Create PyPDFLoader with pdf_path
           Call loader.load() into docs
           Log success message
       CATCH Exception:
           Log PyPDFLoader error
           Set docs to empty
       END TRY
       
       // Fallback loader attempt
       IF docs is empty THEN:
           TRY:
               Create UnstructuredPDFLoader with pdf_path
               Call loader.load() into docs
               Log success message
           CATCH Exception:
               Log UnstructuredPDFLoader error
               Set docs to empty
           END TRY
       END IF
       
       // Process loaded pages
       IF docs is not empty THEN:
           FOR each document d at index i in docs:
               Construct header = "Source: {filename} -- Page {i+1}/{total}"
               Extract page_content and trim whitespace
               IF content is not empty THEN:
                   Append (header + content) to texts array
               END IF
           END FOR
       ELSE:
           Append error message to texts array
       END IF
   END FOR

3. Text Chunking Phase:
   Call text_splitter.create_documents(texts)
   Store result in self.documents
   Log total chunk count

4. Vector Embedding Phase:
   Call FAISS.from_documents(self.documents, self.embeddings)
   Store vectorstore in self.db
   Log success message

5. Return Phase:
   Vectorstore is now ready for search operations
```

---

### Algorithm RAG_Semantic_Search:
**Purpose:** Retrieve most relevant document chunks for a given query using vector similarity

**Input:** query (string), k (number of results)  
**Output:** Array of RAGResult objects with content, scores, and metadata

```
Algorithm RAG_Semantic_Search:
1. Validation Phase:
   IF vectorstore db is NULL THEN:
       THROW ValueError("No documents loaded")
   END IF

2. Primary Search Phase:
   TRY:
       Call db.similarity_search_with_score(query, k)
       Store results in results array
       
       Initialize output array
       FOR each (document, score) pair in results:
           Create RAGResult with:
               content = document.page_content
               score = similarity score
               metadata = document.metadata (if exists)
           Append RAGResult to output
       END FOR
       
       RETURN output array
       
   CATCH Exception e:
       Log error message
       Proceed to fallback phase
   END TRY

3. Fallback Retrieval Phase:
   Create retriever from db with search parameter k
   Call retriever.get_relevant_documents(query)
   Store documents in docs
   
   Initialize output array
   FOR each document in first k docs:
       Create RAGResult with:
           content = document.page_content
           score = NULL
           metadata = document.metadata (if exists)
       Append RAGResult to output
   END FOR
   
   RETURN output array
```

---

### Algorithm Build_RAG_Context:
**Purpose:** Create a concatenated context string from most relevant PDF chunks for LLM prompting

**Input:** pdf_paths[], query, k (default 6), max_chars (default 4000)  
**Output:** Concatenated context string (clipped to max_chars)

```
Algorithm Build_RAG_Context:
1. Validation Phase:
   IF pdf_paths is NULL or empty THEN:
       RETURN empty string
   END IF

2. RAG Service Initialization Phase:
   Create new RAGService instance
   Call rag.load_pdfs(pdf_paths)

3. Search Phase:
   Call rag.search(query, k)
   Store results in chunks array

4. Context Concatenation Phase:
   Initialize empty joined string
   FOR each chunk in chunks:
       IF chunk is not NULL AND chunk.content is not empty THEN:
           Append chunk.content to joined
           Append delimiter "\n\n---\n\n" to joined
       END IF
   END FOR

5. Truncation Phase:
   Clip joined to first max_chars characters
   RETURN clipped string
```

---

## HELPER FUNCTION PSEUDOCODES

### Function sanitize_json_string:
**Purpose:** Remove markdown code fences and whitespace from LLM JSON responses

**Input:** s (string)  
**Output:** Cleaned JSON string

```
Function sanitize_json_string(s):
    1. Trim whitespace from s
    2. IF s starts with "```" THEN:
           Split s into lines array
           IF first line starts with "```" THEN:
               Remove first line
           END IF
           IF last line starts with "```" THEN:
               Remove last line
           END IF
           Join remaining lines with newline
           Trim whitespace
    3. RETURN cleaned string
```

---

### Function map_llm_question_to_model:
**Purpose:** Normalize LLM output question format to database model schema

**Input:** q (question dictionary from LLM)  
**Output:** Normalized question dictionary

```
Function map_llm_question_to_model(q):
    1. Text Extraction Phase:
       Extract question_text from possible keys: "question_text", "questionText", "text"
       Default to empty string if not found

    2. Type Normalization Phase:
       Extract question_type from possible keys: "question_type", "type"
       Convert to lowercase and trim
       IF type is "mathematical" THEN:
           Set type to "math"
       END IF
       Default to "mcq" if not found

    3. Options Processing Phase:
       Extract options from question
       IF options is not a list THEN:
           Convert to single-item list
       END IF
       Convert each option to string

    4. Answer Extraction Phase:
       Extract correct_answer from possible keys: "correct_answer", "answer"
       Convert to string, default to empty

    5. Marks Extraction Phase:
       Extract marks from question, default to 1
       TRY:
           Convert marks to integer
       CATCH:
           Set marks to 1
       END TRY

    6. Difficulty Normalization Phase:
       Extract difficulty, convert to lowercase
       IF difficulty NOT IN ["easy", "medium", "hard"] THEN:
           Set difficulty to NULL
       END IF

    7. Assembly Phase:
       RETURN dictionary with:
           question_id = new UUID
           question_text = extracted text
           question_type = normalized type
           options = processed options array
           correct_answer = extracted answer
           expected_keywords = from question or empty array
           marks = validated marks integer
           difficulty = validated difficulty or NULL
           metadata = from question or empty dictionary
```

---

### Function query_llm:
**Purpose:** Send prompt to LLM API and extract generated text

**Input:** prompt (string)  
**Output:** Generated text string

```
Function query_llm(prompt):
    1. Payload Construction Phase:
       Create payload dictionary:
           model = "gemma" (or configured model)
           prompt = input prompt
           temperature = 0.3

    2. API Request Phase:
       Send POST request to LLM_API_URL with JSON payload
       Store response in response object

    3. Response Parsing Phase:
       Parse response JSON
       Extract data["choices"][0]["text"]
       RETURN extracted text
```

---

### Function normalize_question_dict:
**Purpose:** Accept camelCase or snake_case question keys and normalize to model schema

**Input:** q (question dictionary with mixed key formats)  
**Output:** Normalized question dictionary

```
Function normalize_question_dict(q):
    1. Multi-Key Extraction Phase:
       Extract question_text from: "question_text" OR "questionText" OR "text"
       Extract raw_type from: "question_type" OR "type"
       Extract options (default empty array)
       Extract correct_answer from: "correct_answer" OR "answer"
       Extract marks (default 1)
       Extract difficulty from: "difficulty" OR "level"

    2. Type Mapping Phase:
       Convert raw_type to lowercase and trim
       Look up in QUESTION_TYPE_MAP_TO_MODEL
       Default to "mcq" if not found or invalid

    3. Options Validation Phase:
       IF options is not a list THEN:
           Convert to single-item list with string value
       END IF
       Convert all items to strings

    4. Difficulty Validation Phase:
       Convert difficulty to lowercase
       IF difficulty NOT IN ["easy", "medium", "hard"] THEN:
           Set difficulty to NULL
       END IF

    5. Assembly Phase:
       RETURN dictionary with:
           question_id = new UUID
           question_text = extracted text or empty string
           question_type = mapped type
           options = validated options array
           correct_answer = extracted answer or empty string
           expected_keywords = from q or empty array
           marks = integer marks or 1
           difficulty = validated difficulty or NULL
           metadata = from q or empty dictionary
```

---

### Function load_texts_via_langchain:
**Purpose:** Extract text content from PDF files with fallback loader strategies

**Input:** pdf_paths[] (array of file paths)  
**Output:** texts[] (array of text strings with headers)

```
Function load_texts_via_langchain(pdf_paths):
    1. Initialization Phase:
       Initialize empty output array

    2. PDF Processing Loop:
       FOR each pdf_path in pdf_paths:
           IF file does not exist THEN:
               Log warning
               CONTINUE to next iteration
           END IF
           
           Initialize empty docs array
           
           // Primary Loader Attempt
           TRY:
               Create PyPDFLoader(pdf_path)
               Call loader.load() into docs
               Log success with page count
           CATCH Exception:
               Log error
               Set docs to empty
           END TRY
           
           // Fallback Loader Attempt
           IF docs is empty THEN:
               TRY:
                   Create UnstructuredPDFLoader(pdf_path)
                   Call loader.load() into docs
                   Log success with page count
               CATCH Exception:
                   Log error
                   Set docs to empty
               END TRY
           END IF
           
           // Page Processing
           IF docs has content THEN:
               FOR each doc at index i:
                   Create header string with filename and page number
                   Extract and trim page_content
                   IF content is not empty THEN:
                       Append (header + content) to output
                       Log page details
                   END IF
               END FOR
           ELSE:
               Append error message to output
           END IF
       END FOR

    3. Return Phase:
       RETURN output array
```

---

### Function add_texts_to_rag:
**Purpose:** Add additional text chunks to existing RAG vectorstore

**Input:** texts[] (array of text strings)  
**Output:** Updated vectorstore

```
Function add_texts_to_rag(texts):
    1. Document Creation Phase:
       Call text_splitter.create_documents(texts)
       Store in new_documents

    2. Vectorstore Update Phase:
       IF vectorstore db is NULL THEN:
           Create new FAISS vectorstore from new_documents
       ELSE:
           Call db.add_documents(new_documents)
       END IF

    3. Memory Update Phase:
       Extend self.documents with new_documents
```

---

### Function clear_rag_knowledge_base:
**Purpose:** Reset RAG service to empty state

**Input:** None  
**Output:** None

```
Function clear_rag_knowledge_base():
    1. Set self.documents to empty array
    2. Set self.db to NULL
```

---

### Function get_document_count:
**Purpose:** Return total number of document chunks in vectorstore

**Input:** None  
**Output:** Integer count

```
Function get_document_count():
    1. RETURN length of self.documents array
```

---

### Function save_assessment_to_db:
**Purpose:** Persist generated assessment questions to MongoDB

**Input:** title, subject, assessment_type, difficulty, questions[], created_by  
**Output:** Assessment document ID (string)

```
Function save_assessment_to_db(title, subject, assessment_type, difficulty, questions, created_by):
    1. Database Connection Phase:
       Call init_db() to ensure connection

    2. Question Objects Creation Phase:
       Initialize empty question_docs array
       FOR each question_dict in questions:
           Create Question object from question_dict
           Append to question_docs
       END FOR

    3. Assessment Document Creation Phase:
       Create Assessment object with:
           title = input title
           description = formatted description string
           assessment_type = input type
           source_materials = uploaded PDF names from session
           total_questions = length of question_docs
           questions = question_docs array
           created_by = input created_by
           status = "draft"
           version = 1
           rubric = empty dictionary

    4. Persistence Phase:
       Call document.save()
       Extract document ID
       Convert to string
       RETURN ID string
```

---

### Function fetch_all_assessments:
**Purpose:** Retrieve all assessment documents from database

**Input:** None  
**Output:** Array of assessment dictionaries

```
Function fetch_all_assessments():
    1. Query Assessment.objects (all documents)
    2. FOR each assessment object:
           Call assessment.to_mongo()
           Append to results array
    3. RETURN results array
```

---

### Function fetch_assessment_by_id:
**Purpose:** Retrieve single assessment by unique identifier

**Input:** assessment_id (string)  
**Output:** Assessment object

```
Function fetch_assessment_by_id(assessment_id):
    1. Query Assessment.objects.get(id=assessment_id)
    2. RETURN assessment object
    3. IF not found, raises DoesNotExist exception
```

---

### Function remove_assessment:
**Purpose:** Delete assessment document from database

**Input:** assessment_id (string)  
**Output:** None

```
Function remove_assessment(assessment_id):
    1. Query Assessment.objects(id=assessment_id)
    2. Call .delete() on query result
    3. Document removed from database
```

---

## DATA FLOW SUMMARY

### Assessment Generation Flow:
```
User Request (subject, type, count, PDFs)
    ↓
Controller: generate_assessment()
    ↓
Service: create_generated_assessment()
    ↓
[Optional] RAG: build_rag_context() → load_pdfs() → search()
    ↓
Prompt Construction (with or without RAG context)
    ↓
LLM Client: query_llm()
    ↓
Response Sanitization & Parsing
    ↓
Question Normalization (map_llm_question_to_model)
    ↓
Assessment Model Creation
    ↓
Database Persistence
    ↓
Return Assessment Object
```

### RAG Processing Flow:
```
PDF Files Input
    ↓
RAGService: load_pdfs()
    ↓
PDF Loaders (PyPDF → Unstructured fallback)
    ↓
Text Extraction by Page
    ↓
RecursiveCharacterTextSplitter (500 char chunks, 100 overlap)
    ↓
HuggingFace Embeddings (all-MiniLM-L6-v2)
    ↓
FAISS Vector Store Creation
    ↓
Ready for Semantic Search
```

### RAG Search Flow:
```
Query String
    ↓
RAGService: search(query, k)
    ↓
FAISS: similarity_search_with_score()
    ↓
Retrieve Top-K Document Chunks
    ↓
Return RAGResult[] (content, score, metadata)
    ↓
Build Context String (concatenate & truncate)
    ↓
Inject into LLM Prompt
```

---

## KEY ALGORITHMIC NOTES

1. **RAG Integration is Optional:** The system gracefully handles assessment generation with or without source materials.

2. **Dual Loader Strategy:** PDF processing uses PyPDFLoader first, falls back to UnstructuredPDFLoader for robustness.

3. **JSON Sanitization:** Critical for handling LLM responses that may include markdown formatting or extra text.

4. **Type Normalization:** System accepts both camelCase (frontend) and snake_case (backend) with intelligent mapping.

5. **Assessment Semantics:** Different rules apply for Quiz (speed), Exam (comprehensive), Assignment (depth) in prompt construction.

6. **Chunk Optimization:** 500-character chunks with 100-character overlap balances context preservation and retrieval precision.

7. **Error Handling:** Multi-phase fallback strategies ensure system resilience (loader fallback, JSON parsing fallback, type mapping fallback).

8. **Embedding Model:** Uses sentence-transformers/all-MiniLM-L6-v2 for efficient CPU-based semantic similarity on CPU architecture.
