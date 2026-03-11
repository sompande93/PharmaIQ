"""
HITL Decision Gateway
Routes approved actions into Green, Yellow, and Red lanes based on thresholds.
"""

from config import settings
from datetime import datetime
import uuid


def hitl_gate(state: dict) -> dict:
    """
    HITL LangGraph node.
    Routes proposed actions into authorization lanes after critique.
    """
    proposed = state.get("proposed_actions", [])
    critique_passed = state.get("critique_passed", False)

    green_actions = []   # Auto-execute
    yellow_actions = []  # Needs manager approval
    red_actions = []     # Needs senior leadership

    for action in proposed:
        action_with_meta = {
            **action,
            "critique_passed": critique_passed,
            "vigil_summary": state.get("vigil_critique", "")[:200],
            "audit_summary": state.get("audit_critique", "")[:200],
            "routed_at": datetime.now().isoformat(),
        }

        lane = _determine_lane(action)
        action_with_meta["lane"] = lane

        if lane == "green":
            action_with_meta["status"] = "auto_approved"
            green_actions.append(action_with_meta)
        elif lane == "yellow":
            action_with_meta["status"] = "awaiting_approval"
            yellow_actions.append(action_with_meta)
        else:
            action_with_meta["status"] = "awaiting_senior_approval"
            red_actions.append(action_with_meta)

    # Green lane actions auto-execute
    auto_approved = green_actions

    # Yellow and Red go to approval queue
    needs_approval = yellow_actions + red_actions

    return {
        "approved_actions": state.get("approved_actions", []) + auto_approved,
        "actions_for_approval": state.get("actions_for_approval", []) + needs_approval,
        "current_node": "hitl_complete",
    }


def _determine_lane(action: dict) -> str:
    """Determine HITL lane based on action type, cost, and risk."""
    action_type = action.get("action_type", "")
    cost = action.get("estimated_cost", 0)
    metadata = action.get("metadata", {})
    quantity = metadata.get("quantity", 0)

    # Safety actions are always auto-approved (GREEN) if they are simple removals/markdowns
    # but ONLY if cost is low.
    if action_type in ["quarantine_batch", "markdown_trigger"] and cost < 10000:
        return "green"

    # Staffing changes ALWAYS need manager sign-off (YELLOW) in this version to demo HITL
    if action_type == "shift_reallocation":
        return "yellow"

    # High-quantity reorders or stock transfers always need review (YELLOW)
    if action_type == "reorder_stock" and (quantity > 100 or cost > 20000):
        return "yellow"

    if action_type == "stock_transfer":
        return "yellow"

    # Default routing based on cost
    if cost <= 5000:
        return "green"
    elif cost <= settings.YELLOW_LANE_MAX_VALUE:
        return "yellow"
    else:
        return "red"


def approve_action(state: dict, action_id: str, approved_by: str = "ops_manager", notes: str = "") -> dict:
    """Process a human approval for a pending action."""
    pending = state.get("actions_for_approval", [])
    approved = state.get("approved_actions", [])

    for action in pending:
        if action.get("action_id") == action_id:
            action["status"] = "approved"
            action["approved_by"] = approved_by
            action["approval_notes"] = notes
            action["approved_at"] = datetime.now().isoformat()
            approved.append(action)
            pending = [a for a in pending if a.get("action_id") != action_id]
            break

    return {
        "actions_for_approval": pending,
        "approved_actions": approved,
    }


def reject_action(state: dict, action_id: str, rejected_by: str = "ops_manager", reason: str = "") -> dict:
    """Process a human rejection for a pending action."""
    pending = state.get("actions_for_approval", [])
    rejected = state.get("rejected_actions", [])

    for action in pending:
        if action.get("action_id") == action_id:
            action["status"] = "rejected"
            action["rejected_by"] = rejected_by
            action["rejection_reason"] = reason
            action["rejected_at"] = datetime.now().isoformat()
            rejected.append(action)
            pending = [a for a in pending if a.get("action_id") != action_id]
            break

    return {
        "actions_for_approval": pending,
        "rejected_actions": rejected,
    }
