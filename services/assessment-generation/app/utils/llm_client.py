import os
from typing import Optional

import requests


def query_llm(prompt: str, *, system_prompt: Optional[str] = None, model: Optional[str] = None, timeout_s: int = 120) -> str:
    """Call the repository's `services/llm` HTTP API and return raw text output."""
    base_url = (os.environ.get("LLM_SERVICE_URL") or "http://localhost:5003").rstrip("/")
    url = f"{base_url}/api/generate"
    payload = {"prompt": prompt}
    if system_prompt:
        payload["system_prompt"] = system_prompt
    if model:
        payload["model"] = model

    resp = requests.post(url, json=payload, timeout=timeout_s)
    try:
        data = resp.json()
    except Exception:
        resp.raise_for_status()
        raise

    if resp.status_code >= 400:
        raise ValueError(data.get("error") or "LLM service error")
    if "response" not in data:
        raise ValueError("LLM service returned no response")
    return data["response"]
