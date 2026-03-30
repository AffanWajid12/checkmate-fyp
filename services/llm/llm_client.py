import os
import requests
import json
from dotenv import load_dotenv
from google import genai
from groq import Groq
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
        print("Provider: ",self.provider)
        # Default models based on provider
        if self.provider == "ollama":
            self.default_model = os.getenv("LLM_MODEL", "gemma3")
        elif self.provider == "gemini":
            self.client = genai.Client()
            self.default_model = "gemini-3.1-flash-lite-preview"
        elif self.provider == "groq":
            self.client = Groq(
                api_key=os.environ.get("GROQ_API_KEY"),
            )
            self.default_model = os.getenv("LLM_MODEL", "groq")
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
            config = None
            if system_prompt:
                from google.genai import types
                config = types.GenerateContentConfig(system_instruction=system_prompt)
            
            response = self.client.models.generate_content(
                model=model if model != "gemini" and model != "unknown" else "gemini-2.0-flash", 
                contents=prompt,
                config=config
            )
            return response.text
        elif self.provider == "groq":
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model="openai/gpt-oss-120b"
            )   
            return chat_completion.choices[0].message.content
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

 
