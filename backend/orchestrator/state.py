"""
PharmaIQ Shared Enterprise State
This is the central state object that flows through the LangGraph.
All agents read from and write to this state.
"""

from typing import Optional, Annotated
from pydantic import BaseModel, Field
from datetime import datetime
import operator


def merge_lists(a: list, b: list) -> list:
    """Reducer: merge two lists without duplicates (by action_id or alert_id)."""
    seen = set()
    merged = []
    for item in a + b:
        key = item.get("action_id") or item.get("alert_id") or id(item)
        if key not in seen:
            seen.add(key)
            merged.append(item)
    return merged


class PharmaIQState(BaseModel):
    """
    Shared state that flows through the entire LangGraph pipeline.
    SOMA and PULSE write to it. VIGIL and AUDIT read from it.
    """

    # --- Input signals (populated at pipeline start) ---
    fridge_breaches: list[dict] = Field(default_factory=list)
    disease_clusters: list[dict] = Field(default_factory=list)
    weather_alerts: list[dict] = Field(default_factory=list)
    shift_gaps: list[dict] = Field(default_factory=list)
    expiring_stock: list[dict] = Field(default_factory=list)

    # --- Agent analysis results ---
    soma_analysis: Optional[str] = None
    pulse_analysis: Optional[str] = None

    # --- Proposed actions (from SOMA and PULSE) ---
    proposed_actions: list[dict] = Field(default_factory=list)

    # --- Critique results (from VIGIL and AUDIT) ---
    vigil_critique: Optional[str] = None
    audit_critique: Optional[str] = None
    critique_passed: bool = False

    # --- HITL decisions ---
    actions_for_approval: list[dict] = Field(default_factory=list)
    approved_actions: list[dict] = Field(default_factory=list)
    rejected_actions: list[dict] = Field(default_factory=list)

    # --- Execution results ---
    executed_actions: list[dict] = Field(default_factory=list)

    # --- Alerts generated ---
    alerts: list[dict] = Field(default_factory=list)

    # --- Metadata ---
    run_id: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    current_node: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
