import json
import unittest
from unittest.mock import patch

from app import create_app


class TestGenerateContract(unittest.TestCase):
    def setUp(self):
        app = create_app()
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_missing_subject_400(self):
        resp = self.client.post(
            "/generate",
            data=json.dumps({
                "assessmentType": "quiz",
                "difficulty": "easy",
                "questionTypeCounts": {"mcq": 1, "short_text": 0, "essay": 0, "coding": 0, "math": 0},
            }),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_sum_zero_422(self):
        resp = self.client.post(
            "/generate",
            data=json.dumps({
                "subject": "Algebra",
                "assessmentType": "quiz",
                "difficulty": "easy",
                "questionTypeCounts": {"mcq": 0, "short_text": 0, "essay": 0, "coding": 0, "math": 0},
            }),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 422)

    def test_invalid_reference_material_url_422(self):
        resp = self.client.post(
            "/generate",
            data=json.dumps({
                "subject": "Algebra",
                "assessmentType": "quiz",
                "difficulty": "easy",
                "questionTypeCounts": {"mcq": 1, "short_text": 0, "essay": 0, "coding": 0, "math": 0},
                "referenceMaterials": [{"url": "file:///tmp/a.pdf"}],
            }),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 422)

    def test_success_200_shape(self):
        fake_payload = {
            "questions": [
                {
                    "questionText": "What is 2+2?",
                    "questionType": "mcq",
                    "options": ["3", "4"],
                    "expectedAnswer": "4",
                    "marks": 1,
                    "difficulty": "easy",
                }
            ],
            "profileUsed": "quiz:easy",
        }

        with patch("app.controllers.assessment_controller.generate_assessment_payload", return_value=fake_payload):
            resp = self.client.post(
                "/generate",
                data=json.dumps({
                    "subject": "Math",
                    "assessmentType": "quiz",
                    "difficulty": "easy",
                    "questionTypeCounts": {"mcq": 1, "short_text": 0, "essay": 0, "coding": 0, "math": 0},
                }),
                content_type="application/json",
            )
            self.assertEqual(resp.status_code, 200)
            body = resp.get_json()
            self.assertIn("questions", body)
            self.assertIsInstance(body["questions"], list)
            self.assertIn("profileUsed", body)


if __name__ == "__main__":
    unittest.main()
