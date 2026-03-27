"""
Simple test runner - just runs the test file
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import and run the test file
if __name__ == "__main__":
    import tests.test_utils
