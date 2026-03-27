import os
from openai import OpenAI


def query_llm(prompt):
    """
    Query the Groq API using the OpenAI-compatible chat completions endpoint.
    
    Args:
        prompt: The prompt string to send to the LLM
        
    Returns:
        The LLM response text as a string
    """
    client = OpenAI(
        api_key=os.environ.get("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=4096,
    )
    
    # Extract the response content from the chat completion
    return response.choices[0].message.content
