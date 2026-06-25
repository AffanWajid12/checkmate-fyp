# Checkmate 

> **An AI-Powered Automated Grading & Educational Management Platform**

Checkmate is a comprehensive educational platform designed to revolutionize the grading process and streamline classroom management. By leveraging Large Language Models (LLMs) and Retrieval-Augmented Generation (RAG), Checkmate automates the extraction of questions from exam papers, generates rubrics, maps unstructured student answers to structured schemas (QA-Pairing), and intelligently grades subjective submissions based on teacher-provided reference materials.

---

## Core Features


<table width="100%">
  <tr>
    <td width="50%" align="center">
      <b>Dashboard Overview</b><br/><br/>
      <img src="https://github.com/user-attachments/assets/0b31c481-126d-48c1-95e5-76ab52d3b74a" width="100%" alt="Dashboard" />
    </td>
    <td width="50%" align="center">
      <b>AI Evaluation & Grading</b><br/><br/>
      <img src="https://github.com/user-attachments/assets/433b7978-e487-4897-9232-831556d43eab" width="100%" alt="Grading Engine" />
    </td>
  </tr>
</table>



<p align="center">
  <img src="https://github.com/user-attachments/assets/a95c47a1-54f2-42b8-bda7-bd84cf06b911" width="280" alt="Mobile App View" />
</p>



<details>
  <summary><b>Click to expand full system screenshots (Gallery)</b></summary>
  <br/>
  
  <table width="100%">
    <tr>
      <td><img src="https://github.com/user-attachments/assets/326cc6b9-8a6f-4de6-9ca5-7338d7a406f4" width="100%" alt="Step 3" /></td>
      <td><img src="https://github.com/user-attachments/assets/e3576983-89c2-4663-88e0-08e087730845" width="100%" alt="Step 4" /></td>
    </tr>
    <tr>
      <td><img src="https://github.com/user-attachments/assets/db96188d-6117-481a-b08b-37ad8c6b9e01" width="100%" alt="Step 5" /></td>
      <td><img src="https://github.com/user-attachments/assets/06da003b-8e2b-45b9-be45-948d232baa53" width="100%" alt="Step 6" /></td>
    </tr>
    <tr>
      <td><img src="https://github.com/user-attachments/assets/9e913daf-531e-47a0-83e1-c18c1d1f161c" width="100%" alt="Step 7" /></td>
      <td><img src="https://github.com/user-attachments/assets/ed660d0e-9a87-4465-9970-117c7156e364" width="100%" alt="Step 8" /></td>
    </tr>
  </table>
  
  <p align="center">
    <img src="https://github.com/user-attachments/assets/8d867f4d-f781-492b-882a-1be5160b9472" width="80%" alt="Step 9" />
  </p>
</details>

- **Intelligent QA-Pairing**: Automatically extracts questions from uploaded PDFs/images and maps handwritten/typed student answers precisely to the corresponding sub-questions.
- **AI-Driven Grading Engine**: Evaluates student answers using RAG, comparing them against generated rubrics and teacher reference materials (PPTs, PDFs) to provide accurate, constructive feedback and scores.
- **Automated Rubric Generation**: Dynamically creates cell-by-cell grading matrices based on total marks, subject context, and custom strictness levels.
- **Plagiarism Detection**: Scans student submissions for academic dishonesty using local AI models.
- **Comprehensive LMS Portal**: Full Learning Management System capabilities including Course Management, Announcements, Attendance Tracking, Comments, and Detailed Assessment Analytics.
- **Role-Based Access Control**: Secure, dedicated portals for Students, Teachers, and Administrators.
- **Cross-Platform Availability**: Accessible via a modern React Web Portal and a dedicated React Native Mobile Application.

---

## Technology Stack

**Frontend & Mobile**
- **Web App**: React, Vite, Tailwind CSS (Modern, premium dynamic UI)
- **Mobile App**: React Native / Expo (`checkmate-app`)

**Backend Core**
- **Server**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Storage**: Supabase Storage (Secure file management for attachments/materials)
- **Testing**: Jest, Supertest

**AI & Python Microservices**
- **Environment**: Python 3.11+
- **Machine Learning**: PyTorch, Torchvision, FAISS (Vector Database), SentenceTransformers
- **LLM Integrations**: Local LLM Server (Ollama / `gemma3`), Groq API, Gemini API
- **Document Processing**: OCR Engines, PyPDF

---

## System Architecture & AI Workflow

Checkmate's automated grading pipeline works in 4 distinct phases:

1. **Extraction Phase**: Teacher uploads an exam PDF. The system uses OCR and LLMs to extract structured questions, subparts, and assigned points, organizing them into a strict nested JSON hierarchy.
2. **Rubric Generation**: Calculates dynamic mark ranges for "leaf" questions and batches LLM requests to generate cell-by-cell grading criteria.
3. **QA-Pairing Phase**: When a student submits their assignment, the OCR extracts all text. The LLM intelligently maps the unstructured student text strictly to the original question JSON skeleton without mutating the schema.
4. **AI Evaluation Phase**: Reference materials are chunked and embedded into a FAISS vector database. For each paired answer, the system retrieves relevant context (RAG) and the AI evaluates the response against the rubric, applying custom strictness multipliers to bound the final score.

---

## Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (Specifically **3.11** for AI microservices)
- **PostgreSQL** Database
- **Supabase** Account (for Object Storage)

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# The web app runs on http://localhost:5173
```

### 2. Backend Setup
Create a `.env` file in the `backend` directory with your PostgreSQL database URL, JWT secret, and Supabase credentials.
```bash
cd backend
npm install
npm run dev
# The backend API runs on http://localhost:5000
```

### 3. AI Microservices Setup
You can start the Python services using the provided batch script:
```bash
.\start_python_services.bat
```
*Or run them manually:*

**QA-Pairing Service (Port 5002)**
*Note: Requires Python 3.11*
```bash
cd services/qa-pairing
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cu121 --force-reinstall
python app.py
```

**LLM Service (Port 5003)**
Ensure you have a `.env` file configured with `LLM_PROVIDER`, `LLM_MODEL` (e.g., gemma3), and API keys if applicable. If using Ollama, ensure it is running (`ollama run gemma3`).
```bash
cd services/llm
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Plagiarism Detection Service**
```bash
cd services/plagiarism-detection
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
python app.py
```

---

## Testing & Reliability
The backend integrates a robust testing environment running isolated tests on a Dockerized PostgreSQL instance. The suite guarantees high reliability across:
- Authentication & Role Verification (Admin, Student, Teacher)
- Course & Enrollment Logic
- Announcement & Comment Workflows
- Assessment Submission & Grading Pipelines
- Reference Material Uploads (Supabase interactions)

---

## 📄 License & Credits
Developed as a comprehensive Final Year Project (FYP). 
Checkmate is designed to push the boundaries of automated educational tools, blending modern web technologies with advanced, locally hosted AI microservices.
