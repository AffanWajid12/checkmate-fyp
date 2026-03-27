#!/usr/bin/env python3
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import os
import json
from ocr_engine import OCREngine
from questions_extraction import extract_questions, extract_text_from_pdf
from qa_pairing import pair_questions_and_answers
from file_combiner import combine_files_to_pdf

app = Flask(__name__)
CORS(app)

# Initialize OCR Engine
ocr_engine = OCREngine()


@app.route("/extract-questions", methods=["POST"])
def extract_questions_endpoint():
    """
    Extracts questions from uploaded PDF file(s).
    Accepts: multipart/form-data with 'file' or 'files' field(s) and optional 'is_scanned' flag.
    Returns: JSON array of extracted questions with type and answer_mode classification.
    """
    # Support both single file and multiple files
    files = request.files.getlist("files") or []
    if "file" in request.files:
        files.append(request.files["file"])

    if not files:
        return jsonify({"error": "No file(s) uploaded"}), 400

    is_scanned = request.form.get("is_scanned", "no").lower() == "yes"

    all_questions = []

    for pdf_file in files:
        if pdf_file.filename == "":
            continue

        # Save PDF temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            pdf_file.save(tmp.name)
            pdf_path = tmp.name

        try:
            result = extract_questions(pdf_path, is_scanned=is_scanned, ocr_engine=ocr_engine)

            if isinstance(result, list):
                all_questions.extend(result)
            elif isinstance(result, dict) and "error" in result:
                return jsonify(result), 500
            else:
                all_questions.append(result)

        except Exception as e:
            return jsonify({"error": str(e)}), 500

        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    return jsonify(all_questions)


@app.route("/pair-answers", methods=["POST"])
def pair_answers_endpoint():
    """
    Pairs student answers with questions.
    Accepts: multipart/form-data with 'files' (student PDFs) and 'questions' (JSON string).
    Returns: JSON array of paired results per file.
    """
    if "files" not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    questions_str = request.form.get("questions")
    if not questions_str:
        return jsonify({"error": "No questions JSON provided"}), 400

    try:
        questions_json = json.loads(questions_str)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid questions JSON"}), 400

    is_scanned = request.form.get("is_scanned", "yes").lower() == "yes"

    files = request.files.getlist("files")
    results = []

    for file in files:
        if file.filename == "":
            continue

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            file.save(tmp.name)
            pdf_path = tmp.name

        try:
            print(f"Processing {file.filename}...")
            pages_text = extract_text_from_pdf(pdf_path, is_scanned=is_scanned, ocr_engine=ocr_engine)
            full_text = "\n".join(pages_text)

            paired_result = pair_questions_and_answers(questions_json, full_text)

            results.append({
                "filename": file.filename,
                "result": paired_result
            })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e)
            })

        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    return jsonify(results)

@app.route("/combine-to-pdf", methods=["POST"])
def combine_to_pdf_endpoint():
    """
    Receives multiple files of various types (images, text, pdfs, code) and combines them into one PDF.
    Accepts: multipart/form-data with 'files'.
    Returns: The combined PDF file.
    """
    if "files" not in request.files:
        return jsonify({"error": "No files uploaded"}), 400
        
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "Empty files list"}), 400

    # Ensure output_dir exists safely
    output_dir = tempfile.mkdtemp()
    file_paths = []
    
    for file in files:
        if file.filename == "":
            continue
        ext = os.path.splitext(file.filename)[1].lower()
        if not ext: ext = ".txt" # default to text
        
        fd, temp_path = tempfile.mkstemp(suffix=ext, dir=output_dir)
        os.close(fd)
        file.save(temp_path)
        file_paths.append(temp_path)
        
    output_pdf_path = os.path.join(output_dir, "combined_submission.pdf")
    
    try:
        success = combine_files_to_pdf(file_paths, output_pdf_path)
        if success and os.path.exists(output_pdf_path):
            return send_file(
                output_pdf_path,
                as_attachment=True,
                download_name="combined_submission.pdf",
                mimetype="application/pdf"
            )
        else:
            return jsonify({"error": "Failed to combine files into PDF."}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return "QA-Pairing OCR Server Running"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
