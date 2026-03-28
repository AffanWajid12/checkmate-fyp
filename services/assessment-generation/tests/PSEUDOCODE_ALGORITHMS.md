# CheckMate Assessment Generator - Core Algorithms (Pseudocode)

## 1. Assessment Generation Service

### Algorithm Create_Generated_Assessment(subject, question_count, question_types, assessment_type, generated_by, pdf_paths):

**RAG Context Phase:**
```
IF pdf_paths provided THEN
    CALL Build_RAG_Context(pdf_paths, subject)
    Store result in rag_context
ELSE
    rag_context is empty
END IF
```

**Prompt Construction Phase:**
```
Build prompt with:
    Subject, question_count, question_types, assessment_type
    Output format: JSON array
    Assessment rules (difficulty, marks distribution)
    Source material (if rag_context exists)
```

**LLM Generation Phase:**
```
TRY:
    CALL Query_LLM(prompt)
    CALL Sanitize_JSON_String(response)
    Parse as JSON array
    Store in question_data
CATCH error:
    THROW "Error parsing LLM response"
END TRY
```

**Question Mapping Phase:**
```
FOR each question in question_data:
    CALL Map_LLM_Question_To_Model(question)
    Add to questions list
END FOR
```

**Save Assessment Phase:**
```
Create Assessment object with all fields
Save to database
RETURN Assessment
```

---

### Algorithm Build_RAG_Context(pdf_paths, query):

```
IF pdf_paths is empty THEN
    RETURN empty string
END IF

Initialize RAGService
CALL RAGService.Load_PDFs(pdf_paths)
CALL RAGService.Search(query, k=6)

FOR each chunk in search results:
    Append chunk content with delimiter
END FOR

Clip to max 4000 characters
RETURN context string
```

---

### Algorithm Map_LLM_Question_To_Model(question_dict):

```
Extract question_text (handle multiple key formats)
Extract question_type (normalize "mathematical" to "math")
Extract options list (convert to strings)
Extract correct_answer
Extract marks (default 1, ensure integer)
Extract difficulty (validate: easy/medium/hard)

RETURN Question object with:
    Unique question_id
    All extracted fields
    Empty lists for missing fields
```

---

### Algorithm Sanitize_JSON_String(json_string):

```
Trim whitespace
IF string wrapped in code fences (```) THEN
    Remove first and last lines
    Rejoin remaining lines
END IF
RETURN clean string
```

---

## 2. RAG Service (Retrieval-Augmented Generation)

### Algorithm RAGService_Initialize(model_name, chunk_size, chunk_overlap):

```
Create HuggingFace Embeddings model
Create Text Splitter with chunk settings
Initialize empty document database
Initialize empty documents list
```

---

### Algorithm Load_PDFs(pdf_paths):

```
CALL Load_Texts_Via_LangChain(pdf_paths)
Store in texts list

Split texts into chunks using text_splitter
Store in documents list

Create FAISS vector database from documents
```

---

### Algorithm Load_Texts_Via_LangChain(pdf_paths):

```
Initialize output list

FOR each pdf_path in pdf_paths:
    IF file not found THEN
        CONTINUE
    END IF
    
    TRY PyPDFLoader:
        Load PDF pages
    CATCH error:
        TRY UnstructuredPDFLoader:
            Load PDF pages
        CATCH error:
            Add error message
            CONTINUE
        END TRY
    END TRY
    
    FOR each page in loaded pages:
        Create header: "Source: {filename} -- Page {number}"
        Extract page content
        IF content not empty THEN
            Add header + content to output
        END IF
    END FOR
END FOR

RETURN output list
```

---

### Algorithm Search(query, k):

```
IF no documents loaded THEN
    THROW error
END IF

TRY:
    Perform similarity search with scores
    Create RAGResult list with content and scores
    RETURN results
CATCH error:
    Fallback: Basic retrieval without scores
    Create RAGResult list with content only
    RETURN results
END TRY
```

---

### Algorithm Add_Texts(texts):

```
Split texts into chunks

IF database empty THEN
    Create new vector database
ELSE
    Add chunks to existing database
END IF

Update documents list
```

---

## 3. LLM Client

### Algorithm Query_LLM(prompt):

```
Create request payload:
    model: "gemma"
    prompt: prompt
    temperature: 0.3

Send POST to LLM API endpoint
Parse response JSON
RETURN generated text
```

---

## 4. Assessment Controller

### Algorithm Generate_Assessment(request):

```
Extract from request:
    subject, questionCount, questionTypes
    assessmentType, generatedBy, pdfPaths

IF subject missing THEN
    RETURN error 400
END IF

TRY:
    CALL Create_Generated_Assessment(all parameters)
    Convert to MongoDB format
    RETURN JSON 201
CATCH error:
    RETURN error 500
END TRY
```

---

### Algorithm Get_All_Assessments():

```
CALL Fetch_All_Assessments()
RETURN JSON list 200
```

---

### Algorithm Get_Assessment_By_Id(assessment_id):

```
TRY:
    CALL Fetch_Assessment_By_Id(assessment_id)
    Convert to MongoDB format
    RETURN JSON 200
CATCH error:
    RETURN error 404
END TRY
```

---

### Algorithm Delete_Assessment(assessment_id):

```
TRY:
    CALL Remove_Assessment(assessment_id)
    RETURN success message 200
CATCH error:
    RETURN error 404
END TRY
```

---

## 5. Data Access Layer

### Algorithm Fetch_All_Assessments():

```
Query all Assessment documents
Convert each to MongoDB format
RETURN list
```

---

### Algorithm Fetch_Assessment_By_Id(assessment_id):

```
Query Assessment WHERE id = assessment_id
RETURN Assessment object
```

---

### Algorithm Remove_Assessment(assessment_id):

```
Delete Assessment WHERE id = assessment_id
```

---

## Data Models

### Question Model (Embedded):
```
question_id: String (required)
question_text: String (required)
question_type: mcq | short_text | essay | math | coding
options: List of Strings
correct_answer: String
expected_keywords: List of Strings
marks: Integer (default 1)
difficulty: easy | medium | hard
metadata: Dictionary
```

### Assessment Model (Main):
```
title: String (required)
description: String
assessment_type: assignment | quiz | exam
source_materials: List of Strings
total_questions: Integer
questions: List of Question objects
created_by: String (required)
status: draft | final
version: Integer (default 1)
rubric: Dictionary
created_at: DateTime (auto)
updated_at: DateTime (auto)
```

---

## System Flow

### Complete Assessment Generation:

```
User Request
    ↓
Parse & Validate Input
    ↓
Build RAG Context (if PDFs provided)
    → Load PDFs
    → Create Embeddings
    → Search Relevant Content
    ↓
Construct LLM Prompt
    → Add subject, count, types
    → Add assessment rules
    → Add RAG context
    ↓
Query Language Model
    ↓
Sanitize & Parse Response
    ↓
Map to Data Models
    ↓
Create Assessment Object
    ↓
Save to Database
    ↓
Return Response
```

---

**End of Documentation**

