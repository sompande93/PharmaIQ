"""
PharmaIQ API — Approval Routes (HITL)
Endpoints for managers to approve/reject pending actions.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

# Reference to pipeline runs store (shared with pipeline routes)
from api.routes.pipeline import load_runs, save_run


class ApprovalInput(BaseModel):
    decision: str  # "approved" or "rejected"
    notes: Optional[str] = ""
    approved_by: str = "ops_manager"


@router.get("/pending")
async def get_pending_approvals():
    """Get all actions awaiting human approval across all pipeline runs."""
    pending = []
    runs_data = load_runs()
    for run_id, data in runs_data.items():
        for action in data.get("actions_for_approval", []):
            pending.append({
                "run_id": run_id,
                **action,
            })
    return {"total_pending": len(pending), "pending_actions": pending}


@router.post("/{run_id}/{action_id}")
async def process_approval(run_id: str, action_id: str, approval: ApprovalInput):
    """Approve or reject a pending action."""
    runs_data = load_runs()
    if run_id not in runs_data:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    run_data = runs_data[run_id]
    pending = run_data.get("actions_for_approval", [])

    # Find the action
    target_action = None
    for action in pending:
        if action.get("action_id") == action_id:
            target_action = action
            break

    if not target_action:
        raise HTTPException(status_code=404, detail=f"Action {action_id} not found in pending")

    if approval.decision == "approved":
        target_action["status"] = "approved"
        target_action["approved_by"] = approval.approved_by
        target_action["approval_notes"] = approval.notes
        target_action["approved_at"] = datetime.now().isoformat()
        run_data.setdefault("approved_actions", []).append(target_action)
    else:
        target_action["status"] = "rejected"
        target_action["rejected_by"] = approval.approved_by
        target_action["rejection_reason"] = approval.notes
        target_action["rejected_at"] = datetime.now().isoformat()
        run_data.setdefault("rejected_actions", []).append(target_action)

    # Remove from pending
    run_data["actions_for_approval"] = [
        a for a in pending if a.get("action_id") != action_id
    ]

    # Persistent save
    save_run(run_id, run_data)

    return {
        "action_id": action_id,
        "decision": approval.decision,
        "message": f"Action {action_id} has been {approval.decision}",
    }
