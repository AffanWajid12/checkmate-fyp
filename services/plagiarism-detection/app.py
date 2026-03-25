"""
Plagiarism & AI Detection Service — API-only Flask backend.
Receives files from the Node.js backend, compares them for similarity
using SentenceTransformers, and estimates AI-generated likelihood.
Runs on port 5001.
"""

import os
import tempfile
import fitz  # PyMuPDF
from docx import Document as DocxDocument
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer, util
import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel, AutoConfig, PreTrainedModel
import numpy as np
import re
from difflib import SequenceMatcher
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Desklib AI detector model wrapper (PreTrainedModel subclass)
class DesklibAIDetectionModel(PreTrainedModel):
    config_class = AutoConfig

    def __init__(self, config):
        super().__init__(config)
        self.model = AutoModel.from_config(config)
        self.classifier = nn.Linear(config.hidden_size, 1)
        self.init_weights()

    def forward(self, input_ids, attention_mask=None):
        outputs = self.model(input_ids, attention_mask=attention_mask)
        last_hidden = outputs[0]  # (batch, seq_len, hidden)
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(last_hidden.size()).float()
        sum_emb = torch.sum(last_hidden * input_mask_expanded, dim=1)
        sum_mask = torch.clamp(input_mask_expanded.sum(dim=1), min=1e-9)
        pooled = sum_emb / sum_mask
        logits = self.classifier(pooled)
        return {"logits": logits}

app = Flask(__name__)
CORS(app)

# ─── Model Loading (lazy singletons) ──────────────────────────────────────────

_similarity_model = None
_ai_tokenizer = None
_ai_model = None
_codebert_tokenizer = None
_codebert_model = None

def get_similarity_model():
    global _similarity_model
    if _similarity_model is None:
        print("[*] Loading similarity model (all-MiniLM-L6-v2)...")
        _similarity_model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[*] Similarity model loaded.")
    return _similarity_model

def get_codebert_model():
    global _codebert_tokenizer, _codebert_model
    if _codebert_model is None:
        print("[*] Loading CodeBERT for code similarity...")
        try:
            _codebert_tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
            _codebert_model = AutoModel.from_pretrained("microsoft/codebert-base").to(device)
            _codebert_model.eval()
            print("[*] CodeBERT loaded.")
        except Exception as e:
            print(f"[!] Warning: Could not load CodeBERT: {e}")
            _codebert_tokenizer, _codebert_model = None, None
    return _codebert_tokenizer, _codebert_model

def get_ai_detector():
    global _ai_tokenizer, _ai_model
    if _ai_model is None:
        print("[*] Loading AI text detector (desklib/ai-text-detector-v1.01)...")
        AI_MODEL_DIR = "desklib/ai-text-detector-v1.01"
        try:
            _ai_tokenizer = AutoTokenizer.from_pretrained(AI_MODEL_DIR)
            _ai_model = DesklibAIDetectionModel.from_pretrained(AI_MODEL_DIR).to(device)
            _ai_model.eval()
            print("[*] AI detector loaded.")
        except Exception as e:
            print(f"[!] Warning: Could not load Desklib AI detector: {e}")
            _ai_tokenizer, _ai_model = None, None
    return _ai_tokenizer, _ai_model


# ─── Text Extraction Helpers ──────────────────────────────────────────────────


def extract_text_from_pdf(file_bytes):
    """Extract text from a PDF file using PyMuPDF."""
    text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"[!] PDF extraction error: {e}")
    return text.strip()


def extract_text_from_docx(file_bytes):
    """Extract text from a .docx file using python-docx."""
    text = ""
    try:
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        doc = DocxDocument(tmp_path)
        text = "\n".join([p.text for p in doc.paragraphs])
        os.unlink(tmp_path)
    except Exception as e:
        print(f"[!] DOCX extraction error: {e}")
    return text.strip()


def extract_text_from_file(file_bytes, filename, mimetype):
    """
    Route to the correct extractor based on mimetype / extension.
    Falls back to raw UTF-8 decode for plain-text formats (.py, .txt, .c, etc.)
    """
    ext = os.path.splitext(filename)[1].lower()

    if mimetype == "application/pdf" or ext == ".pdf":
        return extract_text_from_pdf(file_bytes)

    if mimetype in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ) or ext in (".docx", ".doc"):
        return extract_text_from_docx(file_bytes)

    # Plain text / source code fallback
    try:
        return file_bytes.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


# ─── Analysis Helpers ─────────────────────────────────────────────────────────


def compute_similarity(texts, model):
    """
    Compute pairwise cosine similarities between a list of texts.
    Returns a matrix of shape (n, n).
    """
    if len(texts) < 2:
        return np.zeros((len(texts), len(texts)))
    embeddings = model.encode(texts, convert_to_tensor=True, show_progress_bar=False)
    sim_matrix = util.cos_sim(embeddings, embeddings).cpu().numpy()
    return sim_matrix


def classify_ai_likelihood(text, ai_tokenizer, ai_model):
    """
    Returns probability in [0.0, 100.0] that `text` is AI-generated using desklib model.
    """
    if not text or len(text.strip()) < 50:
        return {"ai_likelihood": 0, "ai_risk_level": "low"}

    if ai_tokenizer is None or ai_model is None:
        return {"ai_likelihood": 0, "ai_risk_level": "low"}

    try:
        encoded = ai_tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )
        for k in encoded:
            encoded[k] = encoded[k].to(device)

        with torch.no_grad():
            outputs = ai_model(input_ids=encoded["input_ids"], attention_mask=encoded["attention_mask"])
            logits = outputs["logits"]  # shape (batch, 1)
            prob = torch.sigmoid(logits).squeeze().item()  # in [0,1]
            
        ai_pct = round(prob * 100.0, 1)
        if ai_pct >= 60:
            risk = "high"
        elif ai_pct >= 30:
            risk = "medium"
        else:
            risk = "low"
            
        return {"ai_likelihood": ai_pct, "ai_risk_level": risk}
    except Exception as e:
        print(f"[!] AI detection error: {e}")
        return {"ai_likelihood": 0, "ai_risk_level": "low"}


# ─── Code Similarity Helpers ──────────────────────────────────────────────────

def normalize_multilang_code(code, ext=None):
    code = re.sub(r'/\*[\s\S]*?\*/', " ", code)
    code = re.sub(r'//.*', " ", code)
    code = re.sub(r'#.*', " ", code)
    code = re.sub(r'(\"\"\".*?\"\"\"|\'\'\'.*?\'\'\')', " <STR> ", code, flags=re.DOTALL)
    code = re.sub(r'(\".*?\"|\'.*?\')', " <STR> ", code)
    code = re.sub(r'\b\d+(\.\d+)?\b', " <NUM> ", code)
    code = re.sub(r'\s+', " ", code)
    return code.strip()

def lexical_similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def tfidf_char_similarity(a, b):
    try:
        v = TfidfVectorizer(analyzer="char_wb", ngram_range=(3,5))
        tf = v.fit_transform([a, b])
        return float(cosine_similarity(tf[0:1], tf[1:2])[0][0])
    except Exception:
        return 0.0

def jaccard_token_similarity(a, b):
    t1 = set(re.findall(r'\b[A-Za-z_][A-Za-z0-9_]*\b', a))
    t2 = set(re.findall(r'\b[A-Za-z_][A-Za-z0-9_]*\b', b))
    if not t1 or not t2:
        return 0.0
    return len(t1 & t2) / len(t1 | t2)

def compute_codebert_similarity(a, b, tokenizer, model):
    if tokenizer is None or model is None:
        return 0.0
    try:
        inputs = tokenizer([a, b], return_tensors="pt", truncation=True, padding=True, max_length=512)
        for k in inputs:
            inputs[k] = inputs[k].to(device)
        with torch.no_grad():
            out = model(**inputs).last_hidden_state.mean(dim=1)
        sim = F.cosine_similarity(out[0].unsqueeze(0), out[1].unsqueeze(0)).item()
        return float(max(0.0, sim))
    except Exception as e:
        print(f"[CodeBERT error] {e}")
        return 0.0

def compute_code_similarity(text1, text2, ext1, ext2, tokenizer, model):
    try:
        c1n = normalize_multilang_code(text1, ext1)
        c2n = normalize_multilang_code(text2, ext2)
        
        lex = lexical_similarity(c1n, c2n)
        tfidf = tfidf_char_similarity(c1n, c2n)
        jacc = jaccard_token_similarity(c1n, c2n)
        sem = compute_codebert_similarity(c1n, c2n, tokenizer, model)
        
        score = (0.2 * lex + 0.35 * tfidf + 0.35 * jacc + 0.1 * sem)
        return float(max(0.0, score))
    except Exception as e:
        print(f"[code_similarity error] {e}")
        return 0.0


def similarity_status(score):
    if score >= 0.7:
        return "high"
    elif score >= 0.4:
        return "medium"
    return "low"


# ─── Main API Endpoint ────────────────────────────────────────────────────────


@app.route("/api/check-plagiarism", methods=["POST"])
def check_plagiarism():
    """
    Expects multipart/form-data with:
      - files: one or more uploaded files
      - studentName_0, studentName_1, ...: student names for each file
    Returns a JSON report with AI detection + pairwise similarity.
    """
    files = request.files.getlist("files")
    if not files or len(files) == 0:
        return jsonify({"error": "No files provided."}), 400

    # Load models
    sim_model = get_similarity_model()
    ai_tokenizer, ai_model = get_ai_detector()
    cb_tokenizer, cb_model = get_codebert_model()

    # Extract text from all files
    file_data = []
    for idx, f in enumerate(files):
        raw = f.read()
        text = extract_text_from_file(raw, f.filename, f.content_type)
        ext = os.path.splitext(f.filename)[1].lower()
        student_name = request.form.get(f"studentName_{idx}", "Unknown")
        file_data.append({
            "filename": f.filename,
            "ext": ext,
            "studentName": student_name,
            "text": text,
        })

    essay_exts = {".txt", ".md", ".docx", ".pdf"}

    # AI detection for each file
    ai_results = []
    for fd in file_data:
        if fd["ext"] not in essay_exts:
            ai_info = {"ai_likelihood": 0, "ai_risk_level": "low"}
        else:
            ai_info = classify_ai_likelihood(fd["text"], ai_tokenizer, ai_model)
        ai_results.append(ai_info)

    # Pairwise similarity
    texts = [fd["text"] for fd in file_data]
    sim_matrix = compute_similarity(texts, sim_model)

    for i in range(len(file_data)):
        for j in range(len(file_data)):
            if i == j: continue
            fd1 = file_data[i]
            fd2 = file_data[j]
            # If BOTH are non-essay (i.e. code), use code similarity metrics instead
            if fd1["ext"] not in essay_exts and fd2["ext"] not in essay_exts:
                score = compute_code_similarity(fd1["text"], fd2["text"], fd1["ext"], fd2["ext"], cb_tokenizer, cb_model)
                sim_matrix[i][j] = score

    # Build result dictionary keyed by studentName
    student_results = {}
    for i, fd in enumerate(file_data):
        student_name = fd["studentName"]
        if student_name not in student_results:
            student_results[student_name] = {
                "studentName": student_name,
                "files": []
            }

        similarities = []
        for j, other in enumerate(file_data):
            # Skip self-comparisons and comparisons within the same student's files
            if i == j or fd["studentName"] == other["studentName"]:
                continue
            raw_score = float(sim_matrix[i][j])
            clamped_score = max(0.0, raw_score)
            score = round(clamped_score * 100, 1)
            similarities.append({
                "compared_with": other["filename"],
                "compared_with_student": other["studentName"],
                "compared_with_file": other["filename"],
                "similarity": score,
                "status": similarity_status(score / 100),
            })

        student_results[student_name]["files"].append({
            "originalFileName": fd["filename"],
            "ai_likelihood": ai_results[i]["ai_likelihood"],
            "ai_risk_level": ai_results[i]["ai_risk_level"],
            "similarities": sorted(similarities, key=lambda x: x["similarity"], reverse=True),
        })

    # Calculate student averages
    results = {}
    for student_name, data in student_results.items():
        files = data["files"]
        if not files:
            continue
            
        total_ai = sum(f["ai_likelihood"] for f in files)
        avg_ai = round(total_ai / len(files), 1)
        
        # Calculate average similarity across all files' comparisons
        all_sims = [sim["similarity"] for f in files for sim in f["similarities"]]
        avg_sim = round(sum(all_sims) / len(all_sims), 1) if all_sims else 0.0

        results[student_name] = {
            "studentName": student_name,
            "average_ai_likelihood": avg_ai,
            "average_similarity": avg_sim,
            "files": files
        }

    return jsonify({"results": results}), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "plagiarism-detection"}), 200


if __name__ == "__main__":
    print("=" * 60)
    print("  Plagiarism & AI Detection Service")
    print("  Listening on http://127.0.0.1:5001")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5001, debug=False)
