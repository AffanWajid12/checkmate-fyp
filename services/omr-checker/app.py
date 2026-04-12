import os
import json
import tempfile
import subprocess
import shutil
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import traceback

app = Flask(__name__)
CORS(app)

# Path to the cloned OMRChecker directory
OMR_CHECKER_DIR = os.path.join(os.path.dirname(__file__), "OMRChecker")

def copy_referenced_files(template_dict, batch_dir):
    """
    Parse the template JSON and auto-copy any files referenced by preprocessors
    (e.g., omr_marker.jpg used by CropOnMarkers) into the batch directory.
    This searches all OMRChecker sample directories for matching files.
    """
    pre_processors = template_dict.get("preProcessors", [])
    for proc in pre_processors:
        options = proc.get("options", {})
        relative_path = options.get("relativePath")
        if relative_path:
            target_path = os.path.join(batch_dir, relative_path)
            if os.path.exists(target_path):
                continue  # Already present (e.g., uploaded by client)

            # Search for this file in OMRChecker samples directories
            samples_dir = os.path.join(OMR_CHECKER_DIR, "samples")
            found = False
            if os.path.isdir(samples_dir):
                for root, dirs, files in os.walk(samples_dir):
                    if relative_path in files:
                        source = os.path.join(root, relative_path)
                        shutil.copy2(source, target_path)
                        print(f"AUTO-COPIED: {relative_path} from {source}", flush=True)
                        found = True
                        break
            
            if not found:
                print(f"WARNING: Referenced file '{relative_path}' not found in OMRChecker samples", flush=True)


@app.route('/api/evaluate-single-omr', methods=['POST'])
def evaluate_single_omr():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    if 'template' not in request.form:
        return jsonify({"error": "Missing template JSON configuration"}), 400
    if 'evaluation' not in request.form:
        return jsonify({"error": "Missing evaluation JSON configuration"}), 400

    template_str = request.form['template']
    evaluation_str = request.form['evaluation']

    # Create temporary isolated directory for this specific API request
    temp_workspace = tempfile.mkdtemp()
    
    try:
        input_dir = os.path.join(temp_workspace, "inputs")
        batch_dir = os.path.join(input_dir, "batch")
        os.makedirs(batch_dir, exist_ok=True)
        
        output_dir = os.path.join(temp_workspace, "outputs")
        os.makedirs(output_dir, exist_ok=True)
        
        # Save all uploaded files (image + any supplementary files like markers)
        primary_image_name = "sheet.jpg"
        for key in request.files:
            file = request.files[key]
            safe_name = secure_filename(file.filename) or f"{key}.jpg"
            file_path = os.path.join(batch_dir, safe_name)
            file.save(file_path)
            print(f"SAVED: [{key}] -> {file_path} ({os.path.getsize(file_path)} bytes)", flush=True)
            if key == 'image':
                primary_image_name = safe_name
        
        # Save JSON configs
        template_path = os.path.join(batch_dir, "template.json")
        evaluation_path = os.path.join(batch_dir, "evaluation.json")
        
        with open(template_path, "w", encoding="utf-8") as f:
            f.write(template_str)
            
        with open(evaluation_path, "w", encoding="utf-8") as f:
            f.write(evaluation_str)

        # Auto-copy any referenced auxiliary files (e.g., omr_marker.jpg)
        try:
            template_dict = json.loads(template_str)
            copy_referenced_files(template_dict, batch_dir)
        except json.JSONDecodeError:
            pass  # Template will fail validation later anyway

        # List all files in batch_dir for debugging
        batch_files = os.listdir(batch_dir)
        print(f"BATCH DIR CONTENTS: {batch_files}", flush=True)

        # Invoke OMRChecker
        command = [
            "python", "main.py",
            "--inputDir", input_dir,
            "--outputDir", output_dir
        ]

        result = subprocess.run(
            command,
            cwd=OMR_CHECKER_DIR,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            return jsonify({
                "error": "OMRChecker evaluation failed",
                "stdout": result.stdout,
                "stderr": result.stderr
            }), 500

        # Read results
        # OMRChecker outputs to {outputDir}/batch/Results/Results_XXAM/PM.csv
        # The filename includes a timestamp, so we glob for any Results*.csv
        import glob
        results_pattern = os.path.join(output_dir, "**", "Results*.csv")
        results_files = glob.glob(results_pattern, recursive=True)
        print(f"RESULTS FILES FOUND: {results_files}", flush=True)
        
        if not results_files:
            return jsonify({
                "error": "Evaluation succeeded but Results.csv was not generated",
                "stdout": result.stdout,
                "stderr": result.stderr
            }), 500
        
        results_csv_path = results_files[0]
            
        df = pd.read_csv(results_csv_path)
        # pandas to_json properly handles NaN -> null, unlike to_dict
        raw_results = json.loads(df.to_json(orient='records'))
        
        if len(raw_results) == 0:
            return jsonify({
                "error": "Results.csv generated but it's empty",
                "logs": result.stdout
            }), 400
        
        sheet_result = raw_results[0]
        
        return jsonify({
            "status": "success",
            "filename": primary_image_name,
            "raw_omr_results": sheet_result,
            "logs": result.stdout 
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        # Mandatory zero persistence cleanup
        if os.path.exists(temp_workspace):
            try:
                shutil.rmtree(temp_workspace, ignore_errors=True)
            except Exception as e:
                print(f"Warning: Failed to cleanup temp workspace {temp_workspace}: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8543, debug=True)
