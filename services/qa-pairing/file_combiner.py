import os
import tempfile
import fitz  # PyMuPDF
from PIL import Image

def chunk_string(text, chunk_size=4000):
    """Simple chunking to prevent too much text on one page."""
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

def convert_text_to_pdf(text_content, temp_dir):
    """Converts a long string to a temporary PDF using PyMuPDF."""
    doc = fitz.open()
    chunks = chunk_string(text_content, 3500)  # Safe approx limit for A4
    
    for chunk in chunks:
        page = doc.new_page(width=595, height=842) # A4 dimensions
        rect = fitz.Rect(50, 50, 545, 792)
        # insert_textbox handles basic wrapping
        page.insert_textbox(rect, chunk, fontsize=11, fontname="courier")
        
    out_path = tempfile.mktemp(suffix=".pdf", dir=temp_dir)
    doc.save(out_path)
    doc.close()
    return out_path

def convert_image_to_pdf(img_path, temp_dir):
    """Converts an image to a temporary PDF using PIL."""
    out_path = tempfile.mktemp(suffix=".pdf", dir=temp_dir)
    try:
        image = Image.open(img_path)
        # Convert to RGB if it's RGBA (PNG with transparency) or palette
        if image.mode in ("RGBA", "P", "LA"):
            image = image.convert("RGB")
        image.save(out_path, "PDF", resolution=100.0)
        return out_path
    except Exception as e:
        print(f"Error converting image to PDF: {str(e)}")
        # Fallback to PyMuPDF image insertion
        doc = fitz.open()
        img_doc = fitz.open(img_path)
        pdf_bytes = img_doc.convert_to_pdf()
        img_pdf = fitz.open("pdf", pdf_bytes)
        doc.insert_pdf(img_pdf)
        doc.save(out_path)
        doc.close()
        img_doc.close()
        img_pdf.close()
        return out_path

def combine_files_to_pdf(file_paths, output_pdf_path):
    """
    Takes a list of local file paths (various extensions)
    and combines them sequentially into one PDF.
    """
    merged_doc = fitz.open()
    temp_dir = tempfile.mkdtemp()
    
    TEXT_EXTENSIONS = {'.txt', '.py', '.cpp', '.c', '.h', '.java', '.js', '.html', '.css', '.json', '.md', '.csv'}
    IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tiff', '.webp'}
    
    temp_files = []
    
    try:
        for fpath in file_paths:
            ext = os.path.splitext(fpath)[1].lower()
            
            pdf_to_insert = None
            
            # File is already a PDF
            if ext == '.pdf':
                pdf_to_insert = fpath
                
            # File is an image
            elif ext in IMAGE_EXTENSIONS:
                pdf_to_insert = convert_image_to_pdf(fpath, temp_dir)
                temp_files.append(pdf_to_insert)
                
            # File is text or code
            elif ext in TEXT_EXTENSIONS:
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        text_content = f"--- Source File: {os.path.basename(fpath)} ---\n\n" + f.read()
                    pdf_to_insert = convert_text_to_pdf(text_content, temp_dir)
                    temp_files.append(pdf_to_insert)
                except Exception as e:
                    print(f"Failed to read text file {fpath}: {e}")
            
            # Unknown binary or unsupported
            else:
                # Try reading as text just in case, otherwise skip
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        text_content = f"--- Source File (Unknown Ext): {os.path.basename(fpath)} ---\n\n" + f.read()
                    pdf_to_insert = convert_text_to_pdf(text_content, temp_dir)
                    temp_files.append(pdf_to_insert)
                except UnicodeDecodeError:
                    print(f"Skipping unsupported binary file format: {fpath}")
            
            # Merge if we successfully got a PDF
            if pdf_to_insert and os.path.exists(pdf_to_insert):
                try:
                    doc_to_append = fitz.open(pdf_to_insert)
                    merged_doc.insert_pdf(doc_to_append)
                    doc_to_append.close()
                except Exception as e:
                    print(f"Failed to merge PDF from {fpath}: {e}")

        # Save final combined PDF
        if len(merged_doc) > 0:
            merged_doc.save(output_pdf_path)
            return True
        else:
            return False
            
    finally:
        merged_doc.close()
        for tf in temp_files:
            if os.path.exists(tf):
                os.remove(tf)
        if os.path.exists(temp_dir):
            os.rmdir(temp_dir)
