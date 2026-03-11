"""
PharmaIQ Pydantic Models — Action
"""

from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class ActionType(str, Enum):
    QUARANTINE_BATCH = "quarantine_batch"
    REORDER_STOCK = "reorder_stock"
    SHIFT_REALLOCATION = "shift_reallocation"
    MARKDOWN_TRIGGER = "markdown_trigger"
    SHELF_REMOVAL = "shelf_removal"
    NOTIFY_MANAGER = "notify_manager"


class ActionLane(str, Enum):
    GREEN = "green"    # Fully autonomous
    YELLOW = "yellow"  # System recommends, human approves
    RED = "red"        # Human leads, system advises


class ActionStatus(str, Enum):
    PROPOSED = "proposed"
    CRITIQUE_PASSED = "critique_passed"
    CRITIQUE_FAILED = "critique_failed"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTED = "executed"


class CritiqueResult(BaseModel):
    agent: str  # "vigil" or "audit"
    passed: bool
    reasoning: str
    checked_rules: list[str] = []


class Action(BaseModel):
    action_id: str
    action_type: ActionType
    lane: ActionLane
    status: ActionStatus = ActionStatus.PROPOSED
    proposed_by: str  # "soma" or "pulse"
    store_id: str
    title: str
    description: str
    estimated_value: float = 0.0  # ₹ value of the action
    estimated_cost: float = 0.0   # ₹ cost of executing
    roi: Optional[float] = None
    critique_results: list[CritiqueResult] = []
    timestamp: datetime = datetime.now()
    resolved_at: Optional[datetime] = None
    metadata: Optional[dict] = None
