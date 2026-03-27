import os
import requests
import json
from dotenv import load_dotenv
from google import genai
load_dotenv()

class LLMClient:
    """
    Abstracts LLM API calls supporting multiple providers:
    - ollama
    - gemini
    - groq
    """
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "ollama").lower()
        
        # Default models based on provider
        if self.provider == "ollama":
            self.default_model = os.getenv("LLM_MODEL", "gemma3")
        elif self.provider == "gemini":
            self.client = genai.Client()
            self.default_model = "gemini-3.1-flash-lite-preview"
        elif self.provider == "groq":
            self.default_model = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
        else:
            self.default_model = os.getenv("LLM_MODEL", "unknown")

        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.groq_api_key = os.getenv("GROQ_API_KEY")

        if self.provider == "gemini" and not self.gemini_api_key:
            print("WARNING: Gemini API Key not found in environment!")
        if self.provider == "groq" and not self.groq_api_key:
            print("WARNING: Groq API Key not found in environment!")

    def generate(self, prompt, system_prompt=None, model_override=None):
        print(self.default_model)
        model = model_override if model_override else self.default_model

        if self.provider == "ollama":
            return self._call_ollama(prompt, system_prompt, model)
        elif self.provider == "gemini":
            response = self.client.models.generate_content(
                model="gemini-3.1-flash-lite-preview", contents=prompt
            )
            return response.text
        elif self.provider == "groq":
            return self._call_groq(prompt, system_prompt, model)
        else:
            raise ValueError(f"Unknown LLM_PROVIDER: {self.provider}")

    def _call_ollama(self, prompt, system_prompt, model):
        url = "http://localhost:11434/api/generate"
        
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"System: {system_prompt}\n\nHuman: {prompt}"

        payload = {
            "model": model,
            "prompt": full_prompt,
            "stream": False
        }

        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()
        return response.json().get("response", "")

  
    def _call_groq(self, prompt, system_prompt, model):
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2
        }

        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }

        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            return ""
