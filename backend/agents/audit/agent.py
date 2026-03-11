"""
AUDIT — Financial & Logistics Critique Agent
Validates proposed actions against budget, ROI, and capacity constraints.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from services.prompt_service import load_prompt
from config import settings
import json


async def audit_node(state: dict) -> dict:
    """
    AUDIT LangGraph node.
    Reviews all proposed actions for financial viability and logistics feasibility.
    """
    llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=0.0,
    )
    
    # Load dynamic prompt
    system_prompt = load_prompt("audit")

    proposed = state.get("proposed_actions", [])
    if not proposed:
        return {
            "audit_critique": "No proposed actions to review.",
            "critique_passed": True,
            "current_node": "audit_complete",
        }

    review_msg = f"""Review the following {len(proposed)} proposed actions for financial viability:

## PROPOSED ACTIONS
{json.dumps(proposed, indent=2, default=str)}

## CONTEXT
- SOMA Analysis: {state.get('soma_analysis', 'N/A')[:500]}
- PULSE Analysis: {state.get('pulse_analysis', 'N/A')[:500]}
- VIGIL Compliance Review: {state.get('vigil_critique', 'N/A')[:500]}

For each action:
1. Calculate ROI (value_protected / cost)
2. Assign HITL lane (GREEN under ₹2L, YELLOW ₹2L-₹5L, RED over ₹5L)
3. Provide PASS or FAIL verdict with financial reasoning
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

    # Determine if critique passed (look for FAIL verdicts)
    # Ensure critique is a string before calling .upper()
    critique_str = str(critique)
    has_failures = "FAIL" in critique_str.upper() and "PASS" not in critique_str.upper()
    critique_passed = not has_failures

    return {
        "audit_critique": critique,
        "critique_passed": critique_passed,
        "current_node": "audit_complete",
    }
