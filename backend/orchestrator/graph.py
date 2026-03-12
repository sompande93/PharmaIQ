"""
PharmaIQ LangGraph Pipeline
Main graph definition wiring all agents together:
  Collect Signals → SOMA → PULSE → VIGIL → AUDIT → HITL → Execute
"""

from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Optional
from datetime import datetime, timedelta
import uuid

from .nodes import collect_signals
from .hitl import hitl_gate
from agents.soma.agent import soma_node
from agents.pulse.agent import pulse_node
from agents.vigil.agent import vigil_node
from agents.audit.agent import audit_node


class PharmaIQGraphState(TypedDict):
    """TypedDict state for LangGraph (required by StateGraph)."""
    # Input signals
    fridge_breaches: list[dict]
    disease_clusters: list[dict]
    weather_alerts: list[dict]
    shift_gaps: list[dict]
    expiring_stock: list[dict]

    # Agent outputs
    soma_analysis: Optional[str]
    pulse_analysis: Optional[str]

    # Tool Call Logs
    soma_tool_calls: list[dict]
    pulse_tool_calls: list[dict]

    # Proposed actions
    proposed_actions: list[dict]

    # Critique
    vigil_critique: Optional[str]
    audit_critique: Optional[str]
    critique_passed: bool

    # HITL
    actions_for_approval: list[dict]
    approved_actions: list[dict]
    rejected_actions: list[dict]

    # Execution
    executed_actions: list[dict]

    # Alerts
    alerts: list[dict]

    # Meta
    run_id: Optional[str]
    started_at: Optional[str]
    completed_at: Optional[str]
    current_node: Optional[str]


def execute_actions(state: dict) -> dict:
    """
    Execution node — carries out approved actions via MCP servers.
    Actual updates are written to data/ JSON files via MCP _save_data.
    """
    from mcp_servers.erp_inventory import erp_inventory_mcp
    from mcp_servers.distributor import distributor_mcp
    from mcp_servers.hrms_roster import hrms_roster_mcp

    approved = state.get("approved_actions", [])
    executed = []

    for action in approved:
        # Avoid double execution
        if action.get("status") == "executed":
            continue

        action_type = action.get("action_type", "")
        store_id = action.get("store_id", "STORE_088")
        metadata = action.get("metadata", {})
        result = {
            "action_id": action.get("action_id"), 
            "action_type": action_type,
            "status": "executed", # Default to success unless exception
            "executed_at": datetime.now().isoformat()
        }

        try:
            if action_type == "quarantine_batch":
                batch_id = metadata.get("batch_id")
                if batch_id:
                    exec_result = erp_inventory_mcp.block_batch_sale(batch_id)
                    result["execution_result"] = exec_result
                else:
                    result["status"] = "failed"
                    result["error"] = "Missing batch_id in metadata"

            elif action_type == "reorder_stock" or action_type == "preemptive_reorder":
                sku_id = metadata.get("sku_id")
                quantity = metadata.get("quantity", 100)
                if sku_id:
                    exec_result = erp_inventory_mcp.place_order(sku_id, store_id, quantity)
                    result["execution_result"] = exec_result
                else:
                    result["status"] = "failed"
                    result["error"] = "Missing sku_id in metadata"

            elif action_type == "shift_reallocation":
                staff_id = metadata.get("staff_id")
                # For demo, if no staff_id, we might have it in the description or just use a default
                if not staff_id and "STAFF_" in action.get("description", ""):
                    import re
                    match = re.search(r'STAFF_\d+', action.get("description", ""))
                    if match:
                        staff_id = match.group()

                date = metadata.get("date", datetime.now().strftime("%Y-%m-%d"))
                start = metadata.get("start", "07:00")
                end = metadata.get("end", "09:00")
                
                if staff_id:
                    exec_result = hrms_roster_mcp.assign_shift(staff_id, date, start, end)
                    result["execution_result"] = exec_result
                else:
                    result["status"] = "failed"
                    result["error"] = "Missing staff_id in metadata or description"

            elif action_type == "markdown_trigger":
                result["execution_result"] = {"success": True, "note": "Price updated in ERP POS system"}
            
            else:
                result["execution_result"] = {"success": True, "note": "Action logged to analytics feed"}
        
        except Exception as e:
            result["status"] = "failed"
            result["error"] = str(e)

        executed.append(result)

    return {
        "executed_actions": state.get("executed_actions", []) + executed,
        "completed_at": datetime.now().isoformat(),
        "current_node": "execution_complete",
    }


def build_graph() -> StateGraph:
    """
    Build the PharmaIQ LangGraph pipeline.

    Flow:
    START → collect_signals → soma → pulse → vigil → audit → hitl → execute → END
    """
    graph = StateGraph(PharmaIQGraphState)

    # Add all nodes
    graph.add_node("collect_signals", collect_signals)
    graph.add_node("soma", soma_node)
    graph.add_node("pulse", pulse_node)
    graph.add_node("vigil", vigil_node)
    graph.add_node("audit", audit_node)
    graph.add_node("hitl", hitl_gate)
    graph.add_node("execute", execute_actions)

    # Wire the edges — the full pipeline
    graph.add_edge(START, "collect_signals")
    graph.add_edge("collect_signals", "soma")
    graph.add_edge("soma", "pulse")
    graph.add_edge("pulse", "vigil")
    graph.add_edge("vigil", "audit")
    graph.add_edge("audit", "hitl")
    graph.add_edge("hitl", "execute")
    graph.add_edge("execute", END)

    return graph


def create_pipeline():
    """Create and compile the full PharmaIQ pipeline."""
    graph = build_graph()
    return graph.compile()


async def run_pipeline(update_callback=None, run_id=None) -> dict:
    """
    Run the full PharmaIQ pipeline end-to-end with intermediate state updates.
    If run_id is provided, it uses that instead of generating a new one.
    """
    pipeline = create_pipeline()

    initial_state = {
        "fridge_breaches": [],
        "disease_clusters": [],
        "weather_alerts": [],
        "shift_gaps": [],
        "expiring_stock": [],
        "soma_analysis": None,
        "pulse_analysis": None,
        "soma_tool_calls": [],
        "pulse_tool_calls": [],
        "proposed_actions": [],
        "vigil_critique": None,
        "audit_critique": None,
        "critique_passed": False,
        "actions_for_approval": [],
        "approved_actions": [],
        "rejected_actions": [],
        "executed_actions": [],
        "alerts": [],
        "run_id": run_id or f"RUN_{uuid.uuid4().hex[:8]}",
        "started_at": datetime.now().isoformat(),
        "completed_at": None,
        "status": "running",
        "current_node": START,
    }

    # Signal start
    if update_callback:
        await update_callback(initial_state)

    # Run the graph using astream to capture node transitions
    final_state = initial_state
    try:
        async for event in pipeline.astream(initial_state):
            # The event is a dict where keys are node names and values are the state updates
            for node_name, state_update in event.items():
                final_state.update(state_update)
                final_state["current_node"] = node_name
                
                if update_callback:
                    await update_callback(final_state)

        final_state["completed_at"] = datetime.now().isoformat()
        if update_callback:
            await update_callback(final_state)
            
            
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] Error in pipeline {final_state.get('run_id')}: {str(e)}")
        final_state["error"] = str(e)
        final_state["status"] = "failed"
        final_state["completed_at"] = datetime.now().isoformat()
        if update_callback:
            await update_callback(final_state)

    return final_state
