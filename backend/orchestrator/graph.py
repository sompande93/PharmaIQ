"""
PharmaIQ LangGraph Pipeline
Main graph definition wiring all agents together:
  Collect Signals → SOMA → PULSE → VIGIL → AUDIT → HITL → Execute
"""

from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Optional
from datetime import datetime
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
    In production, this would write to real ERP/HRMS systems.
    For demo, it records what WOULD happen.
    """
    from mcp_servers.erp_inventory import erp_inventory_mcp
    from mcp_servers.distributor import distributor_mcp
    from mcp_servers.hrms_roster import hrms_roster_mcp

    approved = state.get("approved_actions", [])
    executed = []

    for action in approved:
        if action.get("status") in ("executed",):
            continue

        action_type = action.get("action_type", "")
        result = {"action_id": action.get("action_id"), "action_type": action_type}

        if action_type == "quarantine_batch":
            # Execute quarantine via ERP MCP
            batch_id = action.get("metadata", {}).get("batch_id", "BATCH_INS_2847")
            exec_result = erp_inventory_mcp.block_batch_sale(batch_id)
            result["execution_result"] = exec_result
            result["status"] = "executed"

        elif action_type == "reorder_stock":
            # Execute reorder via Distributor MCP
            exec_result = distributor_mcp.submit_priority_order(
                sku_id=action.get("metadata", {}).get("sku_id", "UNKNOWN"),
                store_id=action.get("store_id", "STORE_088"),
                quantity=action.get("metadata", {}).get("quantity", 100),
                priority="high"
            )
            result["execution_result"] = exec_result
            result["status"] = "executed"

        elif action_type == "shift_reallocation":
            result["execution_result"] = {
                "success": True,
                "action": "shift_assigned",
                "note": "Pharmacist notified via SMS and app push notification"
            }
            result["status"] = "executed"

        elif action_type == "markdown_trigger":
            result["execution_result"] = {
                "success": True,
                "action": "markdown_applied",
                "note": "Price updated in ERP POS system"
            }
            result["status"] = "executed"

        elif action_type == "notify_manager":
            result["execution_result"] = {
                "success": True,
                "action": "notification_sent",
                "channels": ["sms", "app_push", "email"]
            }
            result["status"] = "executed"

        else:
            result["execution_result"] = {"success": True, "note": "Action recorded"}
            result["status"] = "executed"

        result["executed_at"] = datetime.now().isoformat()
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


async def run_pipeline() -> dict:
    """Run the full PharmaIQ pipeline end-to-end."""
    pipeline = create_pipeline()

    initial_state = {
        "fridge_breaches": [],
        "disease_clusters": [],
        "weather_alerts": [],
        "shift_gaps": [],
        "expiring_stock": [],
        "soma_analysis": None,
        "pulse_analysis": None,
        "proposed_actions": [],
        "vigil_critique": None,
        "audit_critique": None,
        "critique_passed": False,
        "actions_for_approval": [],
        "approved_actions": [],
        "rejected_actions": [],
        "executed_actions": [],
        "alerts": [],
        "run_id": f"RUN_{uuid.uuid4().hex[:8]}",
        "started_at": None,
        "completed_at": None,
        "current_node": None,
    }

    # Run the graph
    result = await pipeline.ainvoke(initial_state)
    return result
