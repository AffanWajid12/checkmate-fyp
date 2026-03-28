"""Simple test runner for the microservice test suite."""

import os
import sys
import unittest


if __name__ == "__main__":
    # Ensure service root is importable
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    suite = unittest.defaultTestLoader.discover("tests", pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
