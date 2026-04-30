# Project Setup Guide

This guide provides step-by-step instructions to set up and run the Checkmate FYP project, including the Frontend, Backend, and AI Services.

---

## 1. Frontend Setup

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

## 2. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
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

## 3. Plagiarism Detection Service

1. Navigate to the `services/plagiarism-detection` directory:
   ```bash
   cd services/plagiarism-detection
   ```
2. Create a virtual environment (Python 3.11+ required):
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows:** `.\venv\Scripts\activate`
   - **Linux/Mac:** `source venv/bin/activate`
4. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
5. Run the service:
   ```bash
   python app.py
   ```

---

## 4. LLM Service

1. Navigate to the `services/llm` directory:
   ```bash
   cd services/llm
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows:** `.\venv\Scripts\activate`
   - **Linux/Mac:** `source venv/bin/activate`
4. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file in this directory and add the following:
   ```env
   LLM_PROVIDER=ollama
   LLM_MODEL=gemma3

   GEMINI_API_KEY=your_gemini_key_here
   GROQ_API_KEY=your_groq_key_here
   ```
6. **If using Ollama:** Ensure Ollama is running and pull/run the model:
   ```bash
   ollama run gemma3
   ```
7. Run the LLM server:
   ```bash
   python app.py
   ```

---

## 5. QA-Pairing Service

**Note:** This service requires **Python 3.11** specifically.

1. Navigate to the `services/qa-pairing` directory:
   ```bash
   cd services/qa-pairing
   ```
2. Create a virtual environment (Python 3.11 specifically):
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - **Windows:** `.\venv\Scripts\activate`
   - **Linux/Mac:** `source venv/bin/activate`
4. Install requirements:
   ```bash
   pip install -r requirements.txt
   
   ```
   Also run this line
   ```bash
   pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 --index-url https://download.pytorch.org/whl/cu121 --force-reinstall
   ```
5. Create a `.env` file in this directory and add the following:
   ```env
   LLM_SERVICE_URL="http://127.0.0.1:5003/api/generate"
   ```
6. Run the pairing service:
   ```bash
   python app.py
   ```

---

## Summary of Ports
- **Frontend:** Usually http://localhost:5173
- **Backend:** http://localhost:5000 (standard for Express)
- **QA-Pairing Service:** http://127.0.0.1:5002
- **LLM Service:** http://127.0.0.1:5003
