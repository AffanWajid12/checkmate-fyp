import os
from mongoengine import connect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init_db():
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/checkmate_assessment_generator")
    connect(host=mongo_uri)
    print(f"Connected to MongoDB at {mongo_uri}")
