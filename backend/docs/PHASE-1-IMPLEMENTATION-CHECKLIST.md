
# Phase 1 Implementation Checklist

**Phase:** Backend-first implementation (schema + endpoints + storage)  
**Status:** In Progress  
**Last Updated:** 2026-03-28

## Overview

Phase 1 focuses on backend compatibility: adding database schema for generated assessments and reference materials, creating Express endpoints, and establishing the microservice communication contract.

---

## 1.1 Schema Changes ✅ COMPLETED

### Database Models
- ✅ `generated_assessments` table
  - ✅ id (uuid, primary key)
  - ✅ teacher_id → users.id
  - ✅ title (optional, derived from subject/type/difficulty)
  - ✅ subject (string)
  - ✅ assessment_type (enum: QUIZ, ASSIGNMENT, EXAM)
  - ✅ difficulty (string: easy, medium, hard)
  - ✅ instructions (optional text)
  - ✅ question_count (integer)
  - ✅ question_payload (JSONB - stores normalized microservice response)
  - ✅ status (optional: draft/final)
  - ✅ timestamps (createdAt, updatedAt)

- ✅ `reference_materials` table
  - ✅ id (uuid, primary key)
  - ✅ teacher_id → users.id
  - ✅ bucket_path (storage path in Supabase)
  - ✅ file_name (string)
  - ✅ file_size (integer)
  - ✅ mime_type (string)
  - ✅ timestamps (createdAt, updatedAt)
  - ✅ course_id (optional, NOT IN SCHEMA - to be added if needed)

- ✅ `generated_assessment_reference_materials` join table
  - ✅ id (uuid, primary key)
  - ✅ generated_assessment_id → generated_assessments.id
  - ✅ reference_material_id → reference_materials.id
  - ✅ unique constraint on (generated_assessment_id, reference_material_id)

### Prisma Configuration
- ✅ Models defined in `backend/prisma/schema.prisma`
- ✅ Relations configured between users, generated_assessments, reference_materials
- ⏳ Migrations created (migrations/ folder should exist)

---

## 1.2 Backend Endpoints (Express) ⏳ IN PROGRESS

### Reference Materials Management

#### POST /api/reference-materials
- ⏳ **Controller:** `uploadReferenceMaterials()`
  - Accept multipart form data with `files[]`
  - Use existing `uploadMultiple` middleware
  - Upload each file to Supabase Storage bucket `source-materials`
  - Create `reference_materials` rows in database
  - Return list of created materials with IDs

- ⏳ **Route:** Defined in `referenceMaterialsRoutes.js`
- ⏳ **Tests:** Not yet created

#### GET /api/reference-materials
- ⏳ **Controller:** `listReferenceMaterials()`
  - List teacher's uploaded reference materials
  - Optional filter by `courseId` query parameter
  - Return materials with metadata (id, fileName, fileSize, mimeType, createdAt)

- ⏳ **Route:** Defined in `referenceMaterielsRoutes.js`
- ⏳ **Tests:** Not yet created

#### DELETE /api/reference-materials/:id (Optional)
- ⏳ **Controller:** `deleteReferenceMaterial()`
  - Delete reference material from database
  - Delete file from Supabase Storage
  - Verify teacher ownership

- ⏳ **Route:** Not yet created
- ⏳ **Tests:** Not yet created

### Assessment Generation

#### POST /api/assessments/generate
- ⏳ **Controller:** `generateAssessment()`
  - Validate request against `validateGenerateAssessmentRequest()`
  - Resolve `referenceMaterialIds` → database records → bucket paths
  - Generate signed URLs (1-hour expiration) for each reference material
  - Build microservice request payload with signed URLs
  - Call `callGenerationService()` from `assessmentGenerationClient.js`
  - Validate microservice response against `validateMicroserviceResponse()`
  - Normalize microservice response using `normalizeMicroserviceResponse()`
  - Create `generated_assessments` record with question_payload
  - Create join records in `generated_assessment_reference_materials`
  - Return normalized assessment to frontend

- ⏳ **Route:** Defined in `assessmentGenerationRoutes.js`
- ⏳ **Error Handling:**
  - 400 Bad Request: validation errors
  - 401 Unauthorized: not authenticated
  - 403 Forbidden: not a teacher / material not owned by teacher
  - 404 Not Found: reference material not found
  - 502 Bad Gateway: microservice error
  - 504 Gateway Timeout: microservice timeout

- ⏳ **Tests:** Not yet created

#### GET /api/generated-assessments
- ⏳ **Controller:** `listGeneratedAssessments()`
  - List teacher's generated assessments
  - Return with metadata (id, subject, assessmentType, difficulty, questionCount, createdAt)
  - Optional pagination

- ⏳ **Route:** Defined in `assessmentGenerationRoutes.js`
- ⏳ **Tests:** Not yet created

#### GET /api/generated-assessments/:id
- ⏳ **Controller:** `getGeneratedAssessment()`
  - Retrieve specific generated assessment
  - Verify teacher ownership
  - Return full assessment with questions

- ⏳ **Route:** Defined in `assessmentGenerationRoutes.js`
- ⏳ **Tests:** Not yet created

#### GET /api/generated-assessments/:id/export.docx
- ⏳ **Controller:** `exportGeneratedAssessmentDOCX()`
  - Retrieve assessment from database
  - Generate DOCX file using stored `question_payload` (no LLM call)
  - Include: title block, instructions, question list, answer key section
  - Return file with `Content-Disposition: attachment; filename="..."`

- ⏳ **Route:** Not yet created
- ⏳ **Tests:** Not yet created

---

## 1.3 Backend-to-Microservice Call Plumbing ✅ COMPLETED

### Configuration

- ✅ **Environment Variables:**
  - `GENERATION_SERVICE_URL` - Flask microservice base URL
  - `GENERATION_REQUEST_TIMEOUT` - Request timeout in milliseconds (default: 60000)
  - `GENERATION_MAX_RETRIES` - Number of retry attempts (default: 1, no retries)

- ✅ **Default Values:**
  ```javascript
  GENERATION_SERVICE_URL = 'http://localhost:5001'
  GENERATION_REQUEST_TIMEOUT = 60000  // 60 seconds
  GENERATION_MAX_RETRIES = 1          // No retries (single attempt)
  ```

### Microservice Client

- ✅ **File:** `backend/src/utils/assessmentGenerationClient.js`

- ✅ **Functions:**
  - `callGenerationService(payload)` - Main function to call microservice
    - Creates axios client with timeout
    - Retries with exponential backoff on 5xx errors
    - Throws detailed errors for 4xx client faults
    - Logs all requests and responses
    - Returns microservice response.data

  - `normalizeMicroserviceResponse(response)` - Normalizes response format
    - Adds 1-based `index` to each question
    - Validates response has `questions` array
    - Returns normalized questions

- ✅ **Error Handling:**
  - Connection refused (ECONNREFUSED)
  - Timeout (ETIMEDOUT, ECONNABORTED)
  - 4xx errors (not retried)
  - 5xx errors (retried with exponential backoff)
  - Detailed error messages with context

- ✅ **Logging:**
  - Request/response logging with timestamps
  - Error logging with full context
  - Retry attempt logging

### Request/Response Validation

- ✅ **File:** `backend/src/utils/assessmentGenerationValidator.js`

- ✅ **Constants:**
  - `QUESTION_TYPES` - Valid question types
  - `ASSESSMENT_TYPES` - Valid assessment types
  - `DIFFICULTY_LEVELS` - Valid difficulty levels

- ✅ **Validation Functions:**
  - `validateGenerateAssessmentRequest(request)` - Frontend request validation
  - `validateMicroserviceRequest(request)` - Microservice request validation
  - `validateMicroserviceResponse(response, expectedCounts)` - Response validation
  - `validateGeneratedAssessmentResponse(assessment)` - Final response validation

- ✅ **Error Reporting:**
  - Returns `{ valid: boolean, errors: string[] }`
  - Detailed, user-friendly error messages
  - Validates all required fields and types
  - Validates sum constraints (e.g., total questions > 0)

---

## 1.4 Backend Request/Response Contract ✅ COMPLETED

### Frontend → Backend Request

**Endpoint:** `POST /api/assessments/generate`

**Required Fields:**
- ✅ `subject`: string (non-empty)
- ✅ `assessmentType`: 'quiz' | 'assignment' | 'exam'
- ✅ `difficulty`: 'easy' | 'medium' | 'hard'
- ✅ `questionTypeCounts`: object
  - ✅ `mcq`: number ≥ 0
  - ✅ `short_text`: number ≥ 0
  - ✅ `essay`: number ≥ 0
  - ✅ `coding`: number ≥ 0
  - ✅ `math`: number ≥ 0
  - ✅ Sum must be > 0

**Optional Fields:**
- ✅ `instructions`: string
- ✅ `referenceMaterialIds`: string[] (UUIDs)

### Backend → Microservice Request

**Endpoint:** `POST /generate`

**Required Fields:**
- ✅ Same as frontend request

**Optional Fields:**
- ✅ `instructions`: string
- ✅ `referenceMaterials`: array of
  - ✅ `url`: string (signed URL to PDF)
  - ✅ `fileName`: string (optional)

### Microservice → Backend Response

**Format:** JSON with `questions` array

**Required Fields:**
- ✅ `questions`: array of
  - ✅ `questionText`: string
  - ✅ `questionType`: 'mcq' | 'short_text' | 'essay' | 'coding' | 'math'
  - ✅ `options`: string[] (non-empty for MCQ, empty otherwise)
  - ✅ `expectedAnswer`: string
  - ✅ `marks`: number (positive)
  - ✅ `difficulty`: 'easy' | 'medium' | 'hard'

**Optional Fields:**
- ✅ `warnings`: string[]
- ✅ `profileUsed`: string

### Backend → Frontend Response

**Status:** 201 Created

**Required Fields:**
- ✅ `generatedAssessment`: object
  - ✅ `id`: string (UUID)
  - ✅ `teacherId`: string (UUID)
  - ✅ `subject`: string
  - ✅ `assessmentType`: string
  - ✅ `difficulty`: string
  - ✅ `instructions`: string | null
  - ✅ `createdAt`: ISO timestamp
  - ✅ `questions`: array of
    - ✅ `index`: number (1-based)
    - ✅ `type`: string
    - ✅ `text`: string (from `questionText`)
    - ✅ `options`: string[]
    - ✅ `expectedAnswer`: string
    - ✅ `marks`: number
    - ✅ `difficulty`: string

---

## Documentation

- ✅ **File:** `backend/docs/GENERATION-API-REFERENCE.md`
- ✅ Contents:
  - ✅ Complete request/response examples
  - ✅ Error codes and mappings
  - ✅ Validation rules
  - ✅ Environment configuration
  - ✅ Testing examples
  - ✅ Implementation status

---

## Next Steps (Phase 2 & Beyond)

### Phase 2: Microservice Refactor
- [ ] Update Flask microservice to accept signed URLs (not local paths)
- [ ] Implement prompt profiles for assessment type × difficulty
- [ ] Replace Groq client with calls to `services/llm`
- [ ] Remove MongoDB persistence from generation path
- [ ] Normalize response format to match contract

### Phase 3: Backend Finalization
- [ ] Implement all controller functions
- [ ] Add DOCX export functionality
- [ ] Add comprehensive error handling
- [ ] Add request logging and tracing

### Phase 4: Frontend Integration
- [ ] Create generation form UI
- [ ] Implement preview renderer
- [ ] Add DOCX export button
- [ ] Implement reference materials upload/selection

### Phase 5: Hardening
- [ ] Integration tests
- [ ] Load testing
- [ ] Security hardening
- [ ] Rate limiting
- [ ] Monitoring & alerting

---

## Files Modified/Created

### New Files Created
- ✅ `backend/src/utils/assessmentGenerationClient.js` - Microservice client
- ✅ `backend/src/utils/assessmentGenerationValidator.js` - Request/response validators
- ✅ `backend/docs/PHASE-1-IMPLEMENTATION-CHECKLIST.md` - This file

### Existing Files (Already in Schema)
- ✅ `backend/prisma/schema.prisma` - Models already defined
- ✅ `backend/docs/GENERATION-API-REFERENCE.md` - Updated with complete contract

### Files Needing Implementation
- ⏳ `backend/src/controllers/assessmentGenerationController.js` - Controllers
- ⏳ `backend/src/routes/assessmentGenerationRoutes.js` - Routes
- ⏳ `backend/src/routes/referenceMaterielsRoutes.js` - Routes

---

## Testing Checklist

### Unit Tests
- [ ] `validateGenerateAssessmentRequest()` with valid/invalid inputs
- [ ] `validateMicroserviceRequest()` with various scenarios
- [ ] `validateMicroserviceResponse()` with correct/incorrect response shapes
- [ ] `normalizeMicroserviceResponse()` with different question types

### Integration Tests
- [ ] POST /api/reference-materials - upload and list
- [ ] POST /api/assessments/generate - valid request
- [ ] POST /api/assessments/generate - invalid request (validation errors)
- [ ] POST /api/assessments/generate - reference material not found
- [ ] POST /api/assessments/generate - microservice unavailable (502)
- [ ] GET /api/generated-assessments - list assessments
- [ ] GET /api/generated-assessments/:id - retrieve specific assessment
- [ ] GET /api/generated-assessments/:id/export.docx - download DOCX

### Manual Testing
- [ ] Test with real microservice running
- [ ] Test with microservice down (error handling)
- [ ] Test with various questionTypeCounts combinations
- [ ] Test with reference materials (file upload + RAG)
- [ ] Test DOCX export functionality

---

## Notes

- The contract is intentionally simple and extensible
- All validation uses descriptive error messages for frontend to display
- Microservice timeout is generous (60s) to allow LLM generation time
- Signed URLs expire after 1 hour (Supabase default)
- No rate limiting yet, but framework in place for future implementation
- All timestamps in ISO 8601 format for consistency

---

## Contacts/References

- Integration Plan: `integration-plan.md`
- API Reference: `backend/docs/GENERATION-API-REFERENCE.md`
- Microservice Client: `backend/src/utils/assessmentGenerationClient.js`
- Validator: `backend/src/utils/assessmentGenerationValidator.js`
