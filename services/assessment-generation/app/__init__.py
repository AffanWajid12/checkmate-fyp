from flask import Flask
from flask_cors import CORS

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    # Optional dependency for local development.
    pass

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Import blueprints (routes)
    from app.routes.assessment_routes import generation_bp

    # Register blueprints
    app.register_blueprint(generation_bp)

    # Health check route
    @app.route("/")
    def home():
        return {"message": "CheckMate Assessment Generation API running."}

    return app
