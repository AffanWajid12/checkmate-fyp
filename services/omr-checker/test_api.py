import requests
import json
import os

# Set paths to the sample files provided by OMRChecker
SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "OMRChecker", "samples", "sample1")
IMAGE_PATH = os.path.join(SAMPLE_DIR, "MobileCamera", "sheet1.jpg")
TEMPLATE_PATH = os.path.join(SAMPLE_DIR, "template.json")

# This is the dynamic Evaluation map Node.js would send for this specific sample sheet!
EVALUATION_JSON = {
  "source_type": "custom",
  "options": {
    "questions_in_order": [
      "q1..20"
    ],
    "answers_in_order": [
      # MCQ 1-4
      "A", "B", "C", "D",
      # Integer blocks 5-9 (two digit numbers expected)
      "12", "34", "56", "78", "90",
      # MCQ 10-13
      "A", "B", "C", "D",
      # MCQ 14-16
      "A", "B", "C",
      # MCQ 17-20
      "A", "B", "C", "D"
    ]
  },
  "marking_schemes": {
    "DEFAULT": {
      "correct": "1",
      "incorrect": "0",
      "unmarked": "0"
    }
  }
}

def test_omr_endpoint():
    print(f"Loading template from {TEMPLATE_PATH}")
    with open(TEMPLATE_PATH, "r") as tf:
        template_str = tf.read()

    print(f"Preparing image from {IMAGE_PATH}")
    
    # Only the image needs to be uploaded as a file.
    # The server auto-detects and copies auxiliary files like omr_marker.jpg
    # from the template's preprocessor references.
    files = {
        'image': ('sheet1.jpg', open(IMAGE_PATH, 'rb'), 'image/jpeg'),
    }
    
    data = {
        'template': template_str,
        'evaluation': json.dumps(EVALUATION_JSON)
    }

    url = 'http://127.0.0.1:8543/api/evaluate-single-omr'
    print(f"\nSending POST request to {url}...")
    
    response = requests.post(url, files=files, data=data)
    
    print("\n--- RESPONSE FROM SERVER ---")
    print(f"Status Code: {response.status_code}")
    
    try:
        json_resp = response.json()
        print(json.dumps(json_resp, indent=2))
    except Exception:
        print(response.text)

if __name__ == "__main__":
    test_omr_endpoint()
