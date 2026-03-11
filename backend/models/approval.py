"""
PharmaIQ Pydantic Models — Approval (HITL)
"""

from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class ApprovalDecision(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    OVERRIDE = "override"  # Manager overrides system recommendation


class ApprovalRequest(BaseModel):
    action_id: str
    lane: str  # "yellow" or "red"
    title: str
    description: str
    proposed_by: str
    store_id: str
    estimated_cost: float
    estimated_value: float
    roi: Optional[float] = None
    critique_summary: str
    urgency: str = "normal"  # "normal", "high", "critical"
    timestamp: datetime = datetime.now()


class ApprovalResponse(BaseModel):
    action_id: str
    decision: ApprovalDecision
    approved_by: str = "ops_manager"
    notes: Optional[str] = None
    timestamp: datetime = datetime.now()
