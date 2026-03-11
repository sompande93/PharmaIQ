"""
VIGIL — Compliance & Safety Critique Agent
Validates proposed actions against regulatory and safety rules.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from services.prompt_service import load_prompt
from config import settings
import json


async def vigil_node(state: dict) -> dict:
    """
    VIGIL LangGraph node.
    Reviews all proposed actions for compliance and safety.
    """
    llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.0,  # Zero temperature for consistent safety checks
    )
    
    # Load dynamic prompt
    system_prompt = load_prompt("vigil")

    proposed = state.get("proposed_actions", [])
    if not proposed:
        return {
            "vigil_critique": "No proposed actions to review.",
            "current_node": "vigil_complete",
        }

    # Build the review request
    review_msg = f"""Review the following {len(proposed)} proposed actions for regulatory compliance and safety:

## PROPOSED ACTIONS
{json.dumps(proposed, indent=2, default=str)}

## CONTEXT
- SOMA Analysis: {state.get('soma_analysis', 'N/A')[:500]}
- PULSE Analysis: {state.get('pulse_analysis', 'N/A')[:500]}

For each action, validate against CDSCO rules, WHO cold chain protocols, Drugs Act, and labor laws.
Provide a PASS or FAIL verdict for each action with reasoning.
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=review_msg),
    ]

    response = await llm.ainvoke(messages)
    
    # Extract the critique content
    if hasattr(response, "content"):
        content = response.content
        if isinstance(content, list):
            critique = "\n".join([str(item.get("text", item)) if isinstance(item, dict) else str(item) for item in content])
        else:
            critique = str(content)
    else:
        critique = str(response)

    return {
        "vigil_critique": critique,
        "current_node": "vigil_complete",
    }
