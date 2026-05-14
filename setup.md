# Project Setup Guide

This guide provides step-by-step instructions to set up and run the Checkmate FYP project, including the Frontend, Mobile App, Backend, and AI Microservices.

---

## 1. Frontend Setup (React Web)

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 2. Mobile App Setup (React Native / Expo)

1. Navigate to the `checkmate-app` directory:
   ```bash
   cd checkmate-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```

---

## 3. Backend Setup (Node.js / Express)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and add the required environment variables (e.g., PostgreSQL database URL, JWT Secret, Supabase keys).
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 4. AI Microservices

The AI services require **Python 3.11**. You can start all of them simultaneously on Windows using the provided script at the root of the project:
```bash
.\start_python_services.bat
```

Alternatively, you can run them individually:

### 4.1 Plagiarism Detection Service (Port 5001)

1. Navigate to the `services/plagiarism-detection` directory:
   ```bash
   cd services/plagiarism-detection
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   ```
4. Run the service:
   ```bash
   python app.py
   ```

### 4.2 QA-Pairing Service (Port 5002)

1. Navigate to the `services/qa-pairing` directory:
   ```bash
   cd services/qa-pairing
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cu121 --force-reinstall
   ```
4. Create a `.env` file and add:
   ```env
   LLM_SERVICE_URL="http://127.0.0.1:5003/api/generate"
   ```
5. Run the service:
   ```bash
   python app.py
   ```

### 4.3 LLM Service (Port 5003)

1. Navigate to the `services/llm` directory:
   ```bash
   cd services/llm
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file and add:
   ```env
   LLM_PROVIDER=ollama
   LLM_MODEL=gemma3

   GEMINI_API_KEY=your_gemini_key_here
   GROQ_API_KEY=your_groq_key_here
   ```
5. Ensure Ollama is running and pull/run the model (`ollama run gemma3`).
6. Run the service:
   ```bash
   python app.py
   ```

### 4.4 Grading Service (Port 5004)

1. Navigate to the `services/grade-english-fyp` directory:
   ```bash
   cd services/grade-english-fyp
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the service:
   ```bash
   python app.py
   ```

### 4.5 Assessment Generation Service (Port 5005)

1. Navigate to the `services/assessment-generation` directory:
   ```bash
   cd services/assessment-generation
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the service:
   ```bash
   python run.py
   ```

---

## Summary of Default Ports

- **Frontend (Web):** http://localhost:5173
- **Mobile App:** Expo dev server usually runs on port 8081
- **Backend:** http://localhost:5000
- **Plagiarism Detection Service:** http://127.0.0.1:5001
- **QA-Pairing Service:** http://127.0.0.1:5002
- **LLM Service:** http://127.0.0.1:5003
- **Grading Service:** http://127.0.0.1:5004
- **Assessment Generation Service:** http://127.0.0.1:5005
