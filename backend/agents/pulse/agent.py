"""
PULSE Agent — LangGraph node implementation
Predictive Unit for Life-sciences & Supply Ecosystems
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from services.prompt_service import load_prompt
from .tools import PULSE_TOOLS
from config import settings
import json


def create_pulse_agent():
    """Create the PULSE agent with Gemini and MCP tools."""
    llm = ChatGoogleGenerativeAI(
        model=settings.LLM_MODEL,
        google_api_key=settings.GOOGLE_API_KEY,
        temperature=settings.LLM_TEMPERATURE,
    )
    return llm.bind_tools(PULSE_TOOLS)


def build_pulse_input(state: dict) -> str:
    """Build the human message for PULSE based on current signals in state."""
    parts = ["Analyze the following external signals and predict demand impacts:\n"]

    if state.get("disease_clusters"):
        parts.append("## DISEASE SURVEILLANCE ALERTS")
        parts.append(json.dumps(state["disease_clusters"], indent=2))

    if state.get("weather_alerts"):
        parts.append("\n## WEATHER ALERTS")
        parts.append(json.dumps(state["weather_alerts"], indent=2))

    # Include SOMA's findings for cross-agent coordination
    if state.get("soma_analysis"):
        parts.append("\n## SOMA AGENT FINDINGS (for cross-agent coordination)")
        parts.append(state["soma_analysis"][:1000])  # Truncate if very long

    if len(parts) == 1:
        parts.append("No pre-loaded signals. Use your tools to scan for disease outbreaks, weather risks, and demand anomalies across all regions.")

    parts.append("\n\nUse your tools to investigate each signal. Correlate disease data with weather patterns. Propose specific reorder actions with quantities, costs, and projected revenue protection.")

    return "\n".join(parts)


async def pulse_node(state: dict) -> dict:
    """
    PULSE LangGraph node.
    Predicts demand spikes from external signals and proposes preemptive reorders.
    """
    agent = create_pulse_agent()
    input_msg = build_pulse_input(state)
    
    # Load dynamic prompt
    system_prompt = load_prompt("pulse")

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=input_msg),
    ]

    # Run the agent with tool calling
    response = await agent.ainvoke(messages)

    # Execute tool calls and get final response
    if response.tool_calls:
        from langchain_core.messages import ToolMessage
        messages.append(response)

        for tool_call in response.tool_calls:
            tool_map = {t.name: t for t in PULSE_TOOLS}
            tool_fn = tool_map.get(tool_call["name"])
            if tool_fn:
                result = tool_fn.invoke(tool_call["args"])
                messages.append(
                    ToolMessage(content=str(result), tool_call_id=tool_call["id"])
                )

        response = await agent.ainvoke(messages)

        # Handle second round of tool calls if needed
        if response.tool_calls:
            messages.append(response)
            for tool_call in response.tool_calls:
                tool_map = {t.name: t for t in PULSE_TOOLS}
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

    # Parse proposed actions
    proposed = _extract_proposed_actions(analysis, "pulse")

    return {
        "pulse_analysis": analysis,
        "proposed_actions": state.get("proposed_actions", []) + proposed,
        "current_node": "pulse_complete",
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

        if "reorder" in line_lower or "order" in line_lower or "stock" in line_lower:
            if current_action:
                actions.append(current_action)
            current_action = {
                "action_id": f"ACT_{uuid.uuid4().hex[:8]}",
                "action_type": "reorder_stock",
                "proposed_by": agent_name,
                "description": line.strip("- *#"),
                "lane": "yellow",
                "metadata": {}
            }
        elif "notify" in line_lower or "alert" in line_lower:
            if current_action:
                actions.append(current_action)
            current_action = {
                "action_id": f"ACT_{uuid.uuid4().hex[:8]}",
                "action_type": "notify_manager",
                "proposed_by": agent_name,
                "description": line.strip("- *#"),
                "lane": "green",
                "metadata": {}
            }
        
        # Extract metadata
        if current_action:
            if "store_id" in line_lower or "store_" in line_lower:
                match = re.search(r'STORE_\d+', line)
                if match:
                    current_action["store_id"] = match.group()
            
            if "sku_id" in line_lower or "sku_" in line_lower:
                match = re.search(r'[A-Z0-9_]+_\d+', line)
                if match:
                    current_action["metadata"]["sku_id"] = match.group()
            
            if "quantity" in line_lower:
                nums = re.findall(r'\d+', line)
                if nums:
                    current_action["metadata"]["quantity"] = int(nums[0])

            if ("value" in line_lower or "cost" in line_lower or "₹" in line):
                nums = re.findall(r'[\d,]+\.?\d*', line)
                if nums:
                    val = float(nums[0].replace(",", ""))
                    if "cost" in line_lower:
                        current_action["estimated_cost"] = val
                    else:
                        current_action["estimated_value"] = val

    if current_action:
        actions.append(current_action)

    for action in actions:
        action.setdefault("store_id", "STORE_088")
        action.setdefault("estimated_value", 0)
        action.setdefault("estimated_cost", 0)
        action.setdefault("metadata", {})

    return actions
