
# Assessment Generation API Reference

## Overview

This document describes the complete contract for assessment generation across the backend, microservice, and frontend layers. It implements **Phase 1: Backend-first implementation** (sections 1.2, 1.3, 1.4) of the Integration Plan.

### Architecture

- **Frontend** calls backend only (no direct microservice calls)
- **Backend** owns persistence in Postgres
- **Backend** calls microservice only for generation computation, not storage
- **Microservice** returns raw generated questions; backend normalizes and persists

### Base URL

```
http://localhost:5000/api
```

### Authentication

All endpoints require a bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Only **TEACHER** role users can access these endpoints.

---

## Reference Materials Management

### Upload Reference Materials

**POST** `/reference-materials`

Upload one or multiple reference material files (PDFs, documents, etc.) that can be used for RAG-based generation.

#### Request

- **Content-Type:** `multipart/form-data`
- **Files:** `files[]` (up to 10 files, max 20MB each)

#### Example

```bash
curl -X POST http://localhost:5000/api/reference-materials \
  -H "Authorization: Bearer TOKEN" \
  -F "files=@document1.pdf" \
  -F "files=@document2.docx"
```

#### Response (201 Created)

```json
{
  "message": "Reference materials uploaded successfully",
  "materials": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "bucket_path": "reference-materials/user-id/uuid.pdf",
      "file_name": "document1.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "teacher_id": "user-id",
      "createdAt": "2026-03-28T10:00:00Z",
      "updatedAt": "2026-03-28T10:00:00Z"
    }
  ]
}
```

#### Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 400 | No files uploaded | Multipart request had no files |
| 401 | Authorization header missing | No auth token provided |
| 403 | Forbidden | User is not a TEACHER |
| 500 | File upload failed | Supabase upload error |

---

### List Reference Materials

**GET** `/reference-materials`

Retrieve all reference materials uploaded by the authenticated teacher.

#### Request

No body required.

#### Query Parameters

None (future: could support filtering by course_id)

#### Example

```bash
curl -X GET http://localhost:5000/api/reference-materials \
  -H "Authorization: Bearer TOKEN"
```

#### Response (200 OK)

```json
{
  "message": "Reference materials retrieved successfully",
  "materials": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "bucket_path": "reference-materials/user-id/uuid.pdf",
      "file_name": "document1.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "teacher_id": "user-id",
      "createdAt": "2026-03-28T10:00:00Z",
      "updatedAt": "2026-03-28T10:00:00Z",
      "signed_url": "https://supabase-url/signed/..." // 1-hour expiry
    }
  ]
}
```

#### Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 401 | Authorization header missing | No auth token provided |
| 403 | Forbidden | User is not a TEACHER |

---

### Delete Reference Material

**DELETE** `/reference-materials/:id`

Remove a single reference material. Also deletes any associations to generated assessments.

#### Request

No body required.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Reference material ID |

#### Example

```bash
curl -X DELETE http://localhost:5000/api/reference-materials/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer TOKEN"
```

#### Response (200 OK)

```json
{
  "message": "Reference material deleted successfully"
}
```

#### Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 401 | Authorization header missing | No auth token provided |
| 403 | Forbidden | User is not a TEACHER, or does not own this material |
| 404 | Reference material not found | Invalid ID |

---

## Assessment Generation

### Generate Assessment

**POST** `/generated-assessments/generate`

Call the microservice to generate an assessment based on specified criteria, with optional RAG context from reference materials.

#### Request

- **Content-Type:** `application/json`

#### Request Body

```json
{
  "subject": "Mathematics",
  "assessmentType": "quiz",
  "difficulty": "easy",
  "questionTypeCounts": {
    "mcq": 5,
    "short_text": 3,
    "essay": 2,
    "coding": 0,
    "math": 0
  },
  "instructions": "Answer all questions carefully",
  "referenceMaterialIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | ✓ | Topic (e.g., "Biology", "Python") |
| `assessmentType` | string | ✓ | One of: `quiz`, `assignment`, `exam` |
| `difficulty` | string | ✓ | One of: `easy`, `medium`, `hard` |
| `questionTypeCounts` | object | ✓ | Map of question types to counts (sum must be > 0) |
| `instructions` | string | ✗ | Additional generation instructions |
| `referenceMaterialIds` | array | ✗ | UUIDs of reference materials for RAG |

#### Example

```bash
curl -X POST http://localhost:5000/api/generated-assessments/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Biology",
    "assessmentType": "quiz",
    "difficulty": "medium",
    "questionTypeCounts": {
      "mcq": 10,
      "short_text": 5
    },
    "referenceMaterialIds": []
  }'
```

#### Response (201 Created)

```json
{
  "message": "Assessment generated successfully",
  "generatedAssessment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "teacherId": "user-id",
    "title": "Biology - medium quiz",
    "subject": "Biology",
    "assessmentType": "QUIZ",
    "difficulty": "medium",
    "instructions": null,
    "createdAt": "2026-03-28T10:00:00Z",
    "questions": [
      {
        "index": 1,
        "type": "mcq",
        "text": "What is the powerhouse of the cell?",
        "options": ["Nucleus", "Mitochondrion", "Ribosome", "Golgi Apparatus"],
        "expectedAnswer": "Mitochondrion",
        "marks": 1,
        "difficulty": "easy"
      },
      {
        "index": 2,
        "type": "short_text",
        "text": "Define photosynthesis",
        "options": [],
        "expectedAnswer": "Process by which plants convert light into chemical energy",
        "marks": 2,
        "difficulty": "medium"
      }
    ]
  }
}
```

#### Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 400 | Subject (string) is required | Missing or invalid subject |
| 400 | Assessment type must be one of: ... | Invalid assessment type |
| 400 | Difficulty must be one of: ... | Invalid difficulty |
| 400 | questionTypeCounts object is required | Missing counts |
| 400 | Total question count must be > 0 | Sum of counts is 0 |
| 400 | One or more reference material IDs are invalid | Teacher doesn't own material |
| 401 | Authorization header missing | No auth token |
| 403 | Forbidden | User is not a TEACHER |
| 500 | Assessment generation service not configured | Env var missing |
| 503 | Failed to generate assessment | Microservice timeout/error |

---

## Generated Assessment Retrieval

### List Generated Assessments

**GET** `/generated-assessments`

Retrieve all generated assessments created by the authenticated teacher.

#### Request

No body required.

#### Query Parameters

None

#### Example

```bash
curl -X GET http://localhost:5000/api/generated-assessments \
  -H "Authorization: Bearer TOKEN"
```

#### Response (200 OK)

```json
{
  "message": "Generated assessments retrieved successfully",
  "assessments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "teacherId": "user-id",
      "title": "Biology - medium quiz",
      "subject": "Biology",
      "assessmentType": "QUIZ",
      "difficulty": "medium",
      "instructions": null,
      "questionCount": 15,
      "status": "draft",
      "createdAt": "2026-03-28T10:00:00Z",
      "updatedAt": "2026-03-28T10:00:00Z"
    }
  ]
}
```

#### Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 401 | Authorization header missing | No auth token |
| 403 | Forbidden | User is not a TEACHER |

---

### Get Generated Assessment

**GET** `/generated-assessments/:id`

Retrieve a specific generated assessment with full question details.

#### Request

No body required.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Generated assessment ID |

#### Example

```bash
curl -X GET http://localhost:5000/api/generated-assessments/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer TOKEN"
```

#### Response (200 OK)

```json
{
  "message": "Generated assessment retrieved successfully",
  "generatedAssessment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "teacherId": "user-id",
    "title": "Biology - medium quiz",
    "subject": "Biology",
    "assessmentType": "QUIZ",
    "difficulty": "medium",
    "instructions": null,
    "questionCount": 15,
    "status": "draft",
    "createdAt": "2026-03-28T10:00:00Z",
    "updatedAt": "2026-03-28T10:00:00Z",
    "questions": [
      {
        "index": 1,
        "type": "mcq",
        "text": "Question text",
        "options": ["A", "B", "C"],
        "expectedAnswer": "A",
        "marks": 1,
        "difficulty": "easy"
      }
    ],
    "referenceMaterialIds": ["550e8400-e29b-41d4-a716-446655440000"]
  }
}
```

#### Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 401 | Authorization header missing | No auth token |
| 403 | Forbidden | Teacher doesn't own this assessment |
| 404 | Generated assessment not found | Invalid ID |

---

## DOCX Export

### Export Assessment to DOCX

**GET** `/generated-assessments/:id/export.docx`

Download a generated assessment as a formatted Word document.

#### Request

No body required.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Generated assessment ID |

#### Example

```bash
curl -X GET http://localhost:5000/api/generated-assessments/550e8400-e29b-41d4-a716-446655440000/export.docx \
  -H "Authorization: Bearer TOKEN" \
  -o assessment.docx
```

#### Response (200 OK)

- **Content-Type:** `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Content-Disposition:** `attachment; filename="assessment.docx"`
- **Body:** Binary DOCX file

#### Error Responses

| Status | Message | Reason |
|--------|---------|--------|
| 401 | Authorization header missing | No auth token |
| 403 | Forbidden | Teacher doesn't own this assessment |
| 404 | Generated assessment not found | Invalid ID |
| 501 | DOCX export is not yet implemented | Phase 3 feature |

---

## Generation Contract (Backend ↔ Microservice)

### Microservice Request

When calling the microservice, the backend sends:

```json
{
  "subject": "string",
  "assessmentType": "quiz|assignment|exam",
  "difficulty": "easy|medium|hard",
  "questionTypeCounts": {
    "mcq": number,
    "short_text": number,
    "essay": number,
    "coding": number,
    "math": number
  },
  "instructions": "string (optional)",
  "referenceMaterials": [
    {
      "url": "https://signed-url-to-pdf",
      "fileName": "document.pdf (optional)"
    }
  ]
}
```

### Microservice Response

The microservice returns:

```json
{
  "questions": [
    {
      "questionText": "string",
      "questionType": "mcq|short_text|essay|coding|math",
      "options": ["A", "B", "C"] | [],
      "expectedAnswer": "string",
      "marks": number,
      "difficulty": "easy|medium|hard"
    }
  ],
  "warnings": ["optional", "warnings"],
  "profileUsed": "optional identifier"
}
```

The backend then normalizes this into the frontend response format.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ASSESSMENT_GENERATION_SERVICE_URL` | (required) | Base URL of assessment-generation microservice (e.g., `http://localhost:8000`) |
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `SUPABASE_URL` | (required) | Supabase project URL |
| `SUPABASE_KEY` | (required) | Supabase API key |

---

## Error Handling

All errors follow this format:

```json
{
  "message": "Human-readable error description"
}
```

Or in some cases:

```json
{
  "message": "Error message",
  "error": "Additional technical details (dev mode)"
}
```

---

## Rate Limiting

Currently not implemented. Future versions may add rate limiting per teacher.

---

## Security Considerations

1. **Authentication:** All endpoints require a valid Supabase token
2. **Authorization:** Teachers can only access/modify their own materials and assessments
3. **File Uploads:** Max 20MB per file; MIME type validated
4. **Signed URLs:** Generated with 1-hour expiry for Supabase storage access
5. **Question Data:** Stored as JSONB in Postgres; teachers have full read/write access to their own data

---

## Troubleshooting

### "Assessment generation service not configured"

**Cause:** `ASSESSMENT_GENERATION_SERVICE_URL` environment variable is not set.

**Fix:** Add to `.env`:
```
ASSESSMENT_GENERATION_SERVICE_URL=http://localhost:8000
```

### "One or more reference material IDs are invalid"

**Cause:** Reference material ID doesn't exist or belongs to a different teacher.

**Fix:** Verify IDs via `GET /reference-materials` and ensure you're using the correct ones.

### "Failed to generate assessment"

**Cause:** Microservice is down, timing out, or returning invalid JSON.

**Fix:**
1. Check microservice is running
2. Verify `ASSESSMENT_GENERATION_SERVICE_URL` is correct
3. Check microservice logs for errors

---

## Future Enhancements

- **Batch Generation:** Generate multiple assessments in one request
- **DOCX Export:** Full implementation with formatting and branding
- **Question Editing:** Allow teachers to edit/refine generated questions
- **Saved Profiles:** Save and reuse generation settings
- **Analytics:** Track generation usage and performance
