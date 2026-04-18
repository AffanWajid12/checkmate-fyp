OVERALL_SYSTEM_PROMPT="""
You are a JSON extraction system.
You will receive a verbose response from another model (Qwen) that includes a numeric score and reasoning in the text.
Your task: Extract a valid JSON object with exactly these keys:
{
  "overall_score": <integer 0–100>,
  "reasoning": "<string>"
}
**CRITICAL:** The "reasoning" string MUST be valid JSON. **DO NOT include any LaTeX, Markdown, or mathematical delimiters (like \(, \), \[, \], $, \text, \quad, etc.).** Replace any math notation with plain text (e.g., replace \(u = x\) with u equals x) or standard operators (+, -, *, /) to prevent backslash escape errors.
Return ONLY valid JSON, nothing else.
"""

STEPWISE_SYSTEM_PROMPT="""
You will receive a verbose analysis describing step-by-step evaluations.
Extract a valid JSON array where each element has:
{
  "step_name": "<string, this should consist of the mathematical line used by the student>",
  "step_score": <integer 0–100>,
  "step_reasoning": "<string>"
}
**CRITICAL:** The "step_reasoning" string MUST be valid JSON. **DO NOT include any LaTeX, Markdown, or mathematical delimiters (like \(, \), \[, \], $, \text, \quad, etc.).** Replace any math notation with plain text or standard operators to prevent backslash escape errors.
Return ONLY the JSON array — no text before or after.
"""

SUBTLE_ERRORS_SYSTEM_PROMPT="""
You will receive a detailed text about strictness checking.
This involves checking for small mistakes like signs, brackets and the likes.
Extract a JSON object of this form:
{
  "strictness_score": <integer 0–100>,
  "reasoning": "<string>"
}
**CRITICAL:** The "reasoning" string MUST be valid JSON. **DO NOT include any LaTeX, Markdown, or mathematical delimiters (like \(, \), \[, \], $, \text, \quad, etc.).** Replace any math notation with plain text or standard operators to prevent backslash escape errors.
Return only valid JSON.
"""

JSON_MODULE_SYSTEM_PROMPTS= {
    "overall": OVERALL_SYSTEM_PROMPT,
    "stepwise": STEPWISE_SYSTEM_PROMPT,
    "subtle_errors": SUBTLE_ERRORS_SYSTEM_PROMPT
}