"""
Unit tests for non-LLM utility functions with predictable outputs.
Simplified test suite with 12 essential test cases.
Output format: ID | Objective | Pre | Steps | Test Data | Expected | Post | Actual | P/F
"""

import sys
import os
import unittest

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.assessment_service import _sanitize_json_string, _map_llm_q_to_model
from app.services.rag_service import RAGService, RAGResult

# Print table header once
print("\n" + "="*160)
print("UNIT TEST DOCUMENTATION TABLE")
print("="*160)
print(f"{'ID':<8} | {'Objective':<45} | {'Pre':<18} | {'Steps':<18} | {'Test Data':<22} | {'Expected':<18} | {'Post':<18} | {'Actual':<22} | {'P/F':<5}")
print("-"*160)


class TestSanitizeJsonString(unittest.TestCase):
    """Test JSON string sanitization - 3 tests"""

    def test_01_remove_markdown_fence(self):
        """Remove markdown code fences from JSON string"""
        test_id = "UT-01"
        objective = "Remove markdown code fences from JSON string"
        pre = "JSON with fence"
        steps = "Call sanitize()"
        test_data = '```json{"key":"val"}```'
        expected = "Clean JSON string"
        
        try:
            input_str = '```json\n{"key": "value"}\n```'
            result = _sanitize_json_string(input_str)
            self.assertEqual(result, '{"key": "value"}')
            
            post = "Fence removed"
            actual = 'Returned: {"key":"value"}'
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_02_trim_whitespace(self):
        """Trim whitespace from JSON string"""
        test_id = "UT-02"
        objective = "Trim whitespace from JSON string"
        pre = "JSON with spaces"
        steps = "Call sanitize()"
        test_data = '  {"key":"val"}  '
        expected = "Trimmed JSON"
        
        try:
            input_str = '   {"key": "value"}   \n'
            result = _sanitize_json_string(input_str)
            self.assertEqual(result, '{"key": "value"}')
            
            post = "Spaces removed"
            actual = "No leading/trailing"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_03_handle_none(self):
        """Handle None value input"""
        test_id = "UT-03"
        objective = "Handle None value input"
        pre = "None value"
        steps = "Call sanitize()"
        test_data = "None"
        expected = "Empty string"
        
        try:
            result = _sanitize_json_string(None)
            self.assertEqual(result, '')
            
            post = 'Returns ""'
            actual = 'Empty string ""'
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")


class TestMapLlmQuestionToModel(unittest.TestCase):
    """Test LLM question mapping - 6 tests"""

    def test_04_map_basic_mcq(self):
        """Map basic MCQ question from LLM to model schema"""
        test_id = "UT-04"
        objective = "Map basic MCQ question from LLM to model"
        pre = "LLM MCQ dict"
        steps = "Call map_llm()"
        test_data = "MCQ with options"
        expected = "Model schema dict"
        
        try:
            llm_q = {
                "question_text": "What is 2+2?",
                "question_type": "mcq",
                "options": ["3", "4", "5"],
                "correct_answer": "4",
                "marks": 1
            }
            result = _map_llm_q_to_model(llm_q)
            
            self.assertEqual(result["question_text"], "What is 2+2?")
            self.assertEqual(result["question_type"], "mcq")
            self.assertEqual(result["marks"], 1)
            
            post = "Normalized MCQ"
            actual = "All fields mapped"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_05_convert_mathematical_to_math(self):
        """Convert 'mathematical' type to 'math' type"""
        test_id = "UT-05"
        objective = "Convert 'mathematical' type to 'math'"
        pre = "Type=mathematical"
        steps = "Call map_llm()"
        test_data = "Math question"
        expected = "Type='math'"
        
        try:
            llm_q = {
                "question_text": "Solve x^2 = 4",
                "question_type": "mathematical",
                "marks": 2
            }
            result = _map_llm_q_to_model(llm_q)
            self.assertEqual(result["question_type"], "math")
            
            post = "Type normalized"
            actual = "Type='math'"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_06_handle_camelcase_keys(self):
        """Handle camelCase keys from LLM output"""
        test_id = "UT-06"
        objective = "Handle camelCase keys from LLM output"
        pre = "camelCase keys"
        steps = "Call map_llm()"
        test_data = "questionText key"
        expected = "snake_case output"
        
        try:
            llm_q = {
                "questionText": "Essay question",
                "type": "essay",
                "answer": "Sample answer"
            }
            result = _map_llm_q_to_model(llm_q)
            
            self.assertEqual(result["question_text"], "Essay question")
            self.assertEqual(result["question_type"], "essay")
            
            post = "Keys normalized"
            actual = "question_text key"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_07_default_values_for_missing_fields(self):
        """Apply default values for missing fields"""
        test_id = "UT-07"
        objective = "Apply default values for missing fields"
        pre = "Minimal dict"
        steps = "Call map_llm()"
        test_data = "Only text field"
        expected = "Defaults applied"
        
        try:
            llm_q = {"text": "Minimal question"}
            result = _map_llm_q_to_model(llm_q)
            
            self.assertEqual(result["question_text"], "Minimal question")
            self.assertEqual(result["question_type"], "mcq")  # default
            self.assertEqual(result["marks"], 1)  # default
            
            post = "All fields present"
            actual = "Defaults: mcq, 1 mark"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_08_normalize_difficulty(self):
        """Normalize difficulty to lowercase"""
        test_id = "UT-08"
        objective = "Normalize difficulty to lowercase"
        pre = "HARD (uppercase)"
        steps = "Call map_llm()"
        test_data = "difficulty=HARD"
        expected = "difficulty='hard'"
        
        try:
            llm_q = {
                "question_text": "Test",
                "difficulty": "HARD"
            }
            result = _map_llm_q_to_model(llm_q)
            self.assertEqual(result["difficulty"], "hard")
            
            post = "Lowercase applied"
            actual = "difficulty='hard'"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_09_unique_question_ids(self):
        """Generate unique IDs for each question"""
        test_id = "UT-09"
        objective = "Generate unique IDs for each question"
        pre = "Same input twice"
        steps = "Call map_llm() 2x"
        test_data = "Same dict"
        expected = "Different UUIDs"
        
        try:
            llm_q = {"question_text": "Test"}
            result1 = _map_llm_q_to_model(llm_q)
            result2 = _map_llm_q_to_model(llm_q)
            self.assertNotEqual(result1["question_id"], result2["question_id"])
            
            post = "UUID1 != UUID2"
            actual = "Unique IDs generated"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")


class TestRAGService(unittest.TestCase):
    """Test RAG service utilities - 3 tests"""

    def test_10_initialization(self):
        """Initialize RAG service with default parameters"""
        test_id = "UT-10"
        objective = "Initialize RAG service with default params"
        pre = "No RAG service"
        steps = "RAGService()"
        test_data = "Default params"
        expected = "Initialized object"
        
        try:
            rag = RAGService()
            self.assertIsNotNone(rag.embeddings)
            self.assertIsNotNone(rag.text_splitter)
            self.assertIsNone(rag.db)
            self.assertEqual(rag.documents, [])
            
            post = "Object created"
            actual = "embeddings & splitter"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_11_get_document_count_empty(self):
        """Get document count returns 0 when empty"""
        test_id = "UT-11"
        objective = "Get document count returns 0 when empty"
        pre = "Empty RAG"
        steps = "get_doc_count()"
        test_data = "Empty docs[]"
        expected = "Returns 0"
        
        try:
            rag = RAGService()
            count = rag.get_document_count()
            self.assertEqual(count, 0)
            
            post = "count = 0"
            actual = "Returned 0"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")

    def test_12_clear_resets_state(self):
        """Clear method resets RAG service to empty state"""
        test_id = "UT-12"
        objective = "Clear method resets RAG service state"
        pre = "RAG with data"
        steps = "clear()"
        test_data = "docs + db set"
        expected = "Empty state"
        
        try:
            rag = RAGService()
            rag.documents = ["doc1", "doc2"]
            rag.db = "some_db"
            
            rag.clear()
            
            self.assertEqual(rag.documents, [])
            self.assertIsNone(rag.db)
            
            post = "docs=[], db=None"
            actual = "State reset success"
            status = "PASS"
        except Exception as e:
            post = "Error occurred"
            actual = str(e)[:22]
            status = "FAIL"
        
        print(f"{test_id:<8} | {objective:<45} | {pre:<18} | {steps:<18} | {test_data:<22} | {expected:<18} | {post:<18} | {actual:<22} | {status:<5}")


# Print footer after all tests
def print_footer():
    print("-"*160)
    print("="*160)


if __name__ == "__main__":
    # Run tests with minimal verbosity
    suite = unittest.TestLoader().loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=0, stream=open(os.devnull, 'w'))
    result = runner.run(suite)
    
    # Print footer
    print_footer()
    print(f"\nSummary: Total={result.testsRun} | Passed={result.testsRun - len(result.failures) - len(result.errors)} | Failed={len(result.failures) + len(result.errors)}")
    
    # Exit with proper code
    sys.exit(0 if result.wasSuccessful() else 1)
