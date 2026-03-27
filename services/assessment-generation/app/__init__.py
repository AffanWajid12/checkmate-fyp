from flask import Flask
from flask_cors import CORS
from app.config import init_db
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Initialize MongoDB connection
    init_db()

    # Import blueprints (routes)
    from app.routes.assessment_routes import assessment_bp

    # Register blueprints
    app.register_blueprint(assessment_bp, url_prefix="/api/assessments")

    # Health check route
    @app.route("/")
    def home():
        return {"message": "CheckMate Assessment Generation API running."}

    return app
