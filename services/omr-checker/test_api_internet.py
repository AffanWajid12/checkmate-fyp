import requests
import json
import os
import tempfile

def fetch_from_internet():
    print("1. Fetching a real-world OMR exam sheet from the internet...")
    # Fetching a UPSC (Indian Civil Services) competitive exam mock sheet from GitHub
    image_url = "https://raw.githubusercontent.com/Udayraj123/OMRChecker/master/samples/community/UPSC-mock/answer_key.jpg"
    
    response = requests.get(image_url)
    if response.status_code != 200:
        print("Failed to download image.")
        return
        
    temp_dir = tempfile.mkdtemp()
    image_path = os.path.join(temp_dir, "internet_sheet.jpg")
    
    with open(image_path, "wb") as f:
        f.write(response.content)
    
    print("2. Generating the specific configuration JSON for this internet template...")
    # We must construct a completely custom template layout matching the exact pixel coordinates
    # of the bubbles in the downloaded picture!
    template_json = {
        "pageDimensions": [3168, 2448],
        "bubbleDimensions": [32, 32],
        "customLabels": {},
        "fieldBlocks": {
            "Q1-25": {
                "fieldType": "QTYPE_MCQ4",
                "fieldLabels": ["q1..25"],
                "bubblesGap": 48,
                "labelsGap": 92,
                "origin": [353, 502]
            },
            "Q26-50": {
                "fieldType": "QTYPE_MCQ4",
                "fieldLabels": ["q26..50"],
                "bubblesGap": 48,
                "labelsGap": 92,
                "origin": [911, 502]
            },
            "Q51-75": {
                "fieldType": "QTYPE_MCQ4",
                "fieldLabels": ["q51..75"],
                "bubblesGap": 48,
                "labelsGap": 92,
                "origin": [1467, 502]
            },
            "Q76-100": {
                "fieldType": "QTYPE_MCQ4",
                "fieldLabels": ["q76..100"],
                "bubblesGap": 48,
                "labelsGap": 92,
                "origin": [2026, 502]
            }
        },
        "preProcessors": [
            {
                "name": "CropPage",
                "options": {
                    "morphKernel": [10, 10]
                }
            }
        ]
    }

    # Constructing the evaluation JSON for grading
    # Let's say all correct answers are uniformly distributed for this mock!
    options = ["A", "B", "C", "D"]
    answers = []
    for i in range(100):
        answers.append(options[i % 4])

    evaluation_json = {
        "source_type": "custom",
        "options": {
            "questions_in_order": [
                "q1..100"
            ],
            "answers_in_order": answers
        },
        "marking_schemes": {
            "DEFAULT": {
                "correct": "4",
                "incorrect": "-1",
                "unmarked": "0"
            }
        }
    }

    print("3. Firing downloaded image and generated JSON directly into our Node-equivalent Service Endpoint...")
    files = {
        'image': open(image_path, 'rb')
    }
    data = {
        'template': json.dumps(template_json),
        'evaluation': json.dumps(evaluation_json)
    }

    url = 'http://127.0.0.1:8543/api/evaluate-single-omr'
    resp = requests.post(url, files=files, data=data)

    print("\n--- GRADING RESPONSE ---")
    if resp.status_code == 200:
        print(json.dumps(resp.json(), indent=2)[:1000] + "\n... (Truncated JSON response for readability)")
    else:
        print(resp.text)

if __name__ == "__main__":
    fetch_from_internet()
