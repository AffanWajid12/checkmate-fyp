from .math_module_system_prompts import MATH_MODULE_SYSTEM_PROMPTS
from .json_parsing_system_prompts import JSON_MODULE_SYSTEM_PROMPTS
from  .user_prompts import MATH_USER_PROMPT_TEMPLATE, JSON_USER_PROMPT_TEMPLATE

SYSTEM_PROMPT_SOURCES = {
    "math": MATH_MODULE_SYSTEM_PROMPTS,
    "json": JSON_MODULE_SYSTEM_PROMPTS
}

USER_PROMPT_TEMPLATES = {
    "math": MATH_USER_PROMPT_TEMPLATE,
    "json": JSON_USER_PROMPT_TEMPLATE
}

def get_prompt(model: str, prompt_type: str) -> str:
    """
    Retrieve the correct system prompt based on model and type.

    Args:
        model (str): "math" or "json"
        prompt_type (str): "overall", "stepwise", or "subtle_errors"

    Returns:
        str: The matching system prompt text.

    Raises:
        KeyError: If the combination is invalid.
    """
    
    model = model.lower()
    prompt_type = prompt_type.lower()
    
    if model not in SYSTEM_PROMPT_SOURCES:
        raise KeyError(f"Unknown model '{model}'. Expected one of: {list(SYSTEM_PROMPT_SOURCES.keys())}")

    model_prompts = SYSTEM_PROMPT_SOURCES[model]

    if prompt_type not in model_prompts:
        raise KeyError(f"Unknown prompt type '{prompt_type}' for model '{model}'. Expected one of: {list(model_prompts.keys())}")

    return model_prompts[prompt_type]

def make_user_prompt(model: str, **kwargs) -> str:
    """
    Returns the formatted user prompt for the specified model.
    
    Args:
        model (str): Either 'math' or 'json'.
        **kwargs: Fields to interpolate in the template.
            - For 'math': rubric, question, model_solution, student_solution
            - For 'json': math_model_text

    Returns:
        str: Formatted user prompt.
    """
    
    model = model.lower()
    
    if model == "math":
        return MATH_USER_PROMPT_TEMPLATE.format(
            rubric=kwargs["rubric"],
            question=kwargs["question"],
            model_solution=kwargs["model_solution"],
            student_solution=kwargs["student_solution"]
        )
    elif model == "json":
        return JSON_USER_PROMPT_TEMPLATE.format(
            math_model_text=kwargs["math_model_text"]
        )
    else:
        raise ValueError(f"Unknown model '{model}'. Expected 'math' or 'json'.")