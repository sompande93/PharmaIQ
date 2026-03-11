"""
Utility to load dynamic prompts from the prompts/ directory.
"""

import os
from functools import lru_cache


@lru_cache(maxsize=10)
def load_prompt(prompt_name: str) -> str:
    """Load a prompt from the prompts directory."""
    prompt_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "prompts", f"{prompt_name}.txt"
    )
    if not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Prompt file not found at {prompt_path}")
    
    with open(prompt_path, "r") as f:
        return f.read().strip()
