"""
SOMA Agent — LangGraph node implementation
Store Operations & Monitoring Agent
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from services.prompt_service import load_prompt
from .tools import SOMA_TOOLS
from config import settings
import json


def create_soma_agent():
    """Create the SOMA agent with Gemini and MCP tools."""
    llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=settings.LLM_TEMPERATURE,
    )
    return llm.bind_tools(SOMA_TOOLS)


def build_soma_input(state: dict) -> str:
    """Build the human message for SOMA based on current signals in state."""
    parts = ["Analyze the following signals and propose actions:\n"]

    if state.get("fridge_breaches"):
        parts.append("## FRIDGE TEMPERATURE BREACHES")
        parts.append(json.dumps(state["fridge_breaches"], indent=2))

    if state.get("shift_gaps"):
        parts.append("\n## STAFFING GAPS DETECTED")
        parts.append(json.dumps(state["shift_gaps"], indent=2))

    if state.get("expiring_stock"):
        parts.append("\n## NEAR-EXPIRY STOCK")
        parts.append(json.dumps(state["expiring_stock"], indent=2))

    if len(parts) == 1:
        parts.append("No active signals detected. Run a routine check using your tools to scan for fridge breaches, staffing gaps, and expiring stock.")

    parts.append("\n\nUse your tools to investigate each signal. For each issue found, propose specific actions with action_type, store_id, description, estimated_value, and estimated_cost.")

    return "\n".join(parts)


async def soma_node(state: dict) -> dict:
    """
    SOMA LangGraph node.
    Scans for internal operational issues and proposes actions.
    """
    agent = create_soma_agent()
    input_msg = build_soma_input(state)
    
    # Load dynamic prompt
    system_prompt = load_prompt("soma")

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=input_msg),
    ]

    # Run the agent with tool calling
    response = await agent.ainvoke(messages)

    # If the agent made tool calls, execute them and get final response
    if response.tool_calls:
        from langchain_core.messages import ToolMessage
        messages.append(response)

        for tool_call in response.tool_calls:
            # Find and execute the tool
            tool_map = {t.name: t for t in SOMA_TOOLS}
            tool_fn = tool_map.get(tool_call["name"])
            if tool_fn:
                result = tool_fn.invoke(tool_call["args"])
                messages.append(
                    ToolMessage(content=str(result), tool_call_id=tool_call["id"])
                )

        # Get the agent's final analysis after seeing tool results
        response = await agent.ainvoke(messages)

        # Handle second round of tool calls if needed
        if response.tool_calls:
            messages.append(response)
            for tool_call in response.tool_calls:
                tool_map = {t.name: t for t in SOMA_TOOLS}
                tool_fn = tool_map.get(tool_call["name"])
                if tool_fn:
                    result = tool_fn.invoke(tool_call["args"])
                    messages.append(
                        ToolMessage(content=str(result), tool_call_id=tool_call["id"])
                    )
            response = await agent.ainvoke(messages)

    # Extract the analysis
    if hasattr(response, "content"):
        content = response.content
        if isinstance(content, list):
            analysis = "\n".join([str(item.get("text", item)) if isinstance(item, dict) else str(item) for item in content])
        else:
            analysis = str(content)
    else:
        analysis = str(response)

    # Parse proposed actions from the analysis
    proposed = _extract_proposed_actions(analysis, "soma")

    return {
        "soma_analysis": analysis,
        "proposed_actions": state.get("proposed_actions", []) + proposed,
        "current_node": "soma_complete",
    }


def _extract_proposed_actions(analysis: str, agent_name: str) -> list[dict]:
    """Extract structured actions from agent analysis text."""
    actions = []
    import re
    import uuid

    # Try to find action blocks in the analysis
    if isinstance(analysis, list):
        analysis = "\n".join([str(item) for item in analysis])
    
    lines = str(analysis).split("\n")
    current_action = {}

    for line in lines:
        line_lower = line.lower().strip()

        # Detect action types
        if "quarantine" in line_lower:
            if current_action:
                actions.append(current_action)
            current_action = {
                "action_id": f"ACT_{uuid.uuid4().hex[:8]}",
                "action_type": "quarantine_batch",
                "proposed_by": agent_name,
                "description": line.strip("- *#"),
                "lane": "green",
            }
        elif "reorder" in line_lower or "order" in line_lower:
            if current_action:
                actions.append(current_action)
            current_action = {
                "action_id": f"ACT_{uuid.uuid4().hex[:8]}",
                "action_type": "reorder_stock",
                "proposed_by": agent_name,
                "description": line.strip("- *#"),
                "lane": "yellow",
            }
        elif "shift" in line_lower or "assign" in line_lower or "pharmacist" in line_lower:
            if current_action:
                actions.append(current_action)
            current_action = {
                "action_id": f"ACT_{uuid.uuid4().hex[:8]}",
                "action_type": "shift_reallocation",
                "proposed_by": agent_name,
                "description": line.strip("- *#"),
                "lane": "yellow",
            }
        elif "markdown" in line_lower or "discount" in line_lower:
            if current_action:
                actions.append(current_action)
            current_action = {
                "action_id": f"ACT_{uuid.uuid4().hex[:8]}",
                "action_type": "markdown_trigger",
                "proposed_by": agent_name,
                "description": line.strip("- *#"),
                "lane": "green",
            }
        elif "store_id" in line_lower and current_action:
            # Try to extract store_id
            match = re.search(r'STORE_\d+', line)
            if match:
                current_action["store_id"] = match.group()
        elif ("value" in line_lower or "cost" in line_lower) and current_action:
            # Try to extract numeric values
            nums = re.findall(r'[\d,]+\.?\d*', line)
            if nums:
                val = float(nums[0].replace(",", ""))
                if "cost" in line_lower:
                    current_action["estimated_cost"] = val
                else:
                    current_action["estimated_value"] = val

    if current_action:
        actions.append(current_action)

    # Ensure all actions have required fields
    for action in actions:
        action.setdefault("store_id", "STORE_142")
        action.setdefault("estimated_value", 0)
        action.setdefault("estimated_cost", 0)

    return actions
