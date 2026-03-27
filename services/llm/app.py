from flask import Flask, request, jsonify
from flask_cors import CORS
from llm_client import LLMClient
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize the centralized client
llm_client = LLMClient()

@app.route("/api/generate", methods=["POST"])
def generate_endpoint():
    """
    Centralized generation endpoint.
    Expects JSON:
    {
        "prompt": "The main user prompt",
        "system_prompt": "Optional system prompt",
        "model": "Optional override for model, defaults to env var"
    }
    """
    data = request.json
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing 'prompt' in request body."}), 400

    prompt = data["prompt"]
    system_prompt = data.get("system_prompt")
    model_override = data.get("model")

    try:
        response_text = llm_client.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            model_override=model_override
        )
        return jsonify({"response": response_text})
    except Exception as e:
        print(f"[LLM Service Error] {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "provider": llm_client.provider,
        "default_model": llm_client.default_model
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5003))
    print(f"Starting LLM Service on port {port} using provider: {llm_client.provider}")
    app.run(host="0.0.0.0", port=port, debug=False)
