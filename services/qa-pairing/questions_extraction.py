import pdfplumber
import requests
import json
import os
import tempfile
from ocr_engine import OCREngine

def extract_text_from_pdf(pdf_path, is_scanned=False, ocr_engine=None):
    """
    Extracts text from a PDF file.
    Returns a list of strings, where each string is the text of a page.
    """
    pages_text = []

    if is_scanned:
        print("➡ Processing as scanned PDF...")
        if ocr_engine:
            ocr = ocr_engine
        else:
            print("⚠ No OCR Engine provided, initializing new instance...")
            ocr = OCREngine()

        # Try using PyMuPDF (fitz) first
        try:
            import fitz  # PyMuPDF
            print("  Using PyMuPDF (fitz) for rendering...")
            doc = fitz.open(pdf_path)

            for i, page in enumerate(doc):
                print(f"  Processing page {i+1}/{len(doc)}...")
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))

                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_img:
                    tmp_img.close()
                    tmp_img_path = tmp_img.name
                    pix.save(tmp_img_path)

                try:
                    result = ocr.process_image(tmp_img_path)
                    if "clean_text" in result and len(result["clean_text"]) >= 50:
                        pages_text.append(result["clean_text"])
                    else:
                        pages_text.append(result.get("clean_text", ""))
                finally:
                    if os.path.exists(tmp_img_path):
                        os.remove(tmp_img_path)

            doc.close()
            return pages_text

        except ImportError:
            print("  PyMuPDF (fitz) not found. Falling back to pdf2image...")
        except Exception as e:
            print(f"  PyMuPDF failed: {e}. Falling back to pdf2image...")

        # Fallback to pdf2image (requires poppler)
        try:
            from pdf2image import convert_from_path
            images = convert_from_path(pdf_path)

            for i, image in enumerate(images):
                print(f"  Processing page {i+1}/{len(images)}...")
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_img:
                    image.save(tmp_img.name, "JPEG")
                    tmp_img_path = tmp_img.name

                try:
                    result = ocr.process_image(tmp_img_path)
                    if "clean_text" in result:
                        pages_text.append(result["clean_text"])
                    else:
                        pages_text.append("")
                finally:
                    if os.path.exists(tmp_img_path):
                        os.remove(tmp_img_path)

        except Exception as e:
            print(f"Error in scanned PDF processing: {e}")
            return [f"Error processing scanned PDF: {str(e)}"]

    else:
        print("➡ Processing as digital PDF...")
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text(x_tolerance=1)
                    if page_text:
                        pages_text.append(page_text)
                    else:
                        pages_text.append("")
        except Exception as e:
            print(f"Error in digital PDF processing: {e}")
            return [f"Error processing digital PDF: {str(e)}"]

    return pages_text

import os
from dotenv import load_dotenv

load_dotenv()

LLM_SERVICE_URL = os.getenv("LLM_SERVICE_URL", "http://127.0.0.1:5003/api/generate")

def call_llm(prompt, system_prompt=None, model_override=None):
    print("Prompt Given to LLM: ", prompt[:500] + "..." if len(prompt) > 500 else prompt)
    try:
        payload = {"prompt": prompt}
        if system_prompt:
            payload["system_prompt"] = system_prompt
        if model_override:
            payload["model"] = model_override

        response = requests.post(
            LLM_SERVICE_URL,
            json=payload,
            timeout=300
        )

        if response.status_code == 200:
            result = response.json()
            return result.get("response", "")
        else:
            print(f"LLM API Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"LLM Connection Error: {e}")
        return None

def parse_json_response(response_text):
    try:
        clean_json = response_text.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:]
        if clean_json.startswith("```"):
            clean_json = clean_json[3:]
        if clean_json.endswith("```"):
            clean_json = clean_json[:-3]
        return json.loads(clean_json.strip())
    except json.JSONDecodeError:
        print("Failed to parse JSON:", response_text[:500])
        return None

def extract_questions(pdf_path, is_scanned=False, ocr_engine=None):
    """
    Extracts questions from a PDF using Ollama gemma3 model.
    Processes pages in batches and merges results.
    Returns a JSON array with extracted questions including answer_mode classification.
    """
    # 1. Extract text per page
    pages_text = extract_text_from_pdf(pdf_path, is_scanned, ocr_engine)

    if not pages_text or (len(pages_text) == 1 and pages_text[0].startswith("Error")):
        return {"error": "Failed to extract text", "details": pages_text[0] if pages_text else "No text found"}

    # 2. Process in chunks of 3 pages
    chunk_size = 3
    partial_results = []

    for i in range(0, len(pages_text), chunk_size):
        chunk = pages_text[i:i + chunk_size]
        chunk_text = "\n".join([f"--- Page {i+j+1} ---\n{text}" for j, text in enumerate(chunk)])

        print(f"➡ Processing batch {i//chunk_size + 1} (Pages {i+1}-{min(i+chunk_size, len(pages_text))})...")

        prompt = f"""
    You are an expert Educational Data Extractor. Your task is to extract questions from the provided raw text and output a highly structured JSON array.

    ### 🗂️ QUESTION TYPES (STRICT CLASSIFICATION)
    Classify each question into EXACTLY ONE of these types:
    1. "MCQ" (Multiple Choice Question): The question provides specific choices (e.g., A, B, C, D) for the student to select. 
       *Conflict Resolution*: If a question contains a blank line (____) BUT also provides choices below it, it is an MCQ, NOT a FillInBlank.
    2. "FillInBlank": The question contains a blank space or line to fill, and provides NO choices/options. Use "_______" for the blank in the text.
    3. "TextQuestion": Standard text-based, open-ended questions (short answer, essay, definition, etc.) with no explicit choices.

    ### 🧬 SUBPARTS & NO-DUPLICATION RULE (CRITICAL)
    - **DETECT GENUINE SUBPARTS**: Only create subparts if they are explicitly labeled in the text (e.g., "a)", "b)", "i.", "ii."). Nest them correctly in the "subparts" array.
    - **NO GHOST SUBPARTS (DO NOT DUPLICATE)**: If a question does not have explicitly labeled subparts, it is a single leaf node. Leave `subparts: []`. NEVER create a subpart that repeats the main question's text.

    ### ✍️ ANSWER MODES
    Classify the expected answer format for each leaf node (questions without subparts, or the final subparts themselves):
    - "text": Natural language answers (definitions, essays, history, explanations).
    - "math": Mathematical computation, equations, formulas, proofs, or numerical answers.
    - "coding": Writing code, pseudocode, programming logic, tracing program output, or algorithm design.

    ### 💰 MARKS EXTRACTION (CRITICAL)
    - **EXTRACT TOTAL MARKS**: For each leaf node (question or bottom-level subpart), extract the total marks allocated to it if mentioned in the text (e.g., "[5]", "(2 marks)", "10 pts"). 
    - **DEFAULT VALUE**: If no marks are explicitly mentioned, default `total_marks` to `1`.
    - **DATATYPE**: `total_marks` MUST be a number (integer or float). 

    ### 🛑 STRICT SCHEMA RULES
    1. **NO MIXING OPTIONS**: ONLY "MCQ" type questions are allowed to have an "options" key. 
    2. **OMISSION**: For "TextQuestion" and "FillInBlank", you MUST NOT include the "options" key at all.
    3. **EXACT TEXT**: Extract the text exactly as written. Do not summarize.
    4. **TOTAL MARKS**: Every question or subpart must have a `total_marks` field.
    5. **OLLAMA FORMAT**: Output ONLY valid JSON. No markdown blocks, no commentary.

    ### 📚 STRUCTURE EXAMPLE
    [
      {{
        "label": "Q1",
        "type": "MCQ",
        "text": "The time complexity of binary search is _______.",
        "answer_mode": "text",
        "total_marks": 2,
        "options": [
          {{ "label": "A", "text": "O(n)" }},
          {{ "label": "B", "text": "O(log n)" }}
        ],
        "subparts": []
      }},
      {{
        "label": "Q2",
        "type": "TextQuestion",
        "text": "Answer the following about sorting algorithms.",
        "total_marks": 10,
        "subparts": [
            {{
                "label": "a",
                "text": "Write a Python function to implement bubble sort.",
                "answer_mode": "coding",
                "total_marks": 5,
                "subparts": []
            }},
            {{
                "label": "b",
                "text": "What is the worst-case complexity of Quicksort?",
                "answer_mode": "text",
                "total_marks": 5,
                "subparts": []
            }}
        ]
      }}
    ]

    ### 🎯 TARGET DATA
    Text to extract:
    {chunk_text}
    """

        response = call_llm(prompt)
        if response:
            partial_results.append(response)

    # 3. Merge results
    print("➡ Merging results...")
    combined_json_text = "\n".join(partial_results)

    merge_prompt = f"""
    I have extracted questions from different pages of an exam paper.
    Combine them into a single valid JSON array.
    Ensure the order is preserved and duplicates are removed if any.
    Fix any malformed JSON objects.
    
    ### 🛑 STRICT SCHEMA RULES (DO NOT VIOLATE)
    1. **NO GHOST SUBPARTS**: Do NOT create or hallucinate new subparts during the merge. If a question has an empty `subparts: []` list, keep it empty. NEVER duplicate the question text into a subpart.
    2. **MANDATORY FIELDS**: Every question and leaf subpart MUST have an "answer_mode" field with value "text", "math", or "coding", and a "total_marks" field (number).
    3. **OPTIONS RULE**: Only "MCQ" type questions are allowed to have an "options" field. You MUST completely omit the "options" field for "TextQuestion" and "FillInBlank" types.
    4. **OLLAMA FORMAT**: Output ONLY valid JSON. No markdown blocks, no commentary.

    Input JSON fragments:
    {combined_json_text}

    Output strictly the final JSON array:
    """

    final_response = call_llm(merge_prompt)
    if final_response:
        parsed = parse_json_response(final_response)
        if parsed:
            return parsed
        else:
            return {"error": "Failed to parse final merged JSON", "raw_response": final_response}
    else:
        return {"error": "Failed to merge results"}
