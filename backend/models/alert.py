"""
PharmaIQ Pydantic Models — Alert
"""

from pydantic import BaseModel
from typing import Optional
from enum import Enum
from datetime import datetime


class AlertType(str, Enum):
    COLD_CHAIN_BREACH = "cold_chain_breach"
    EPIDEMIC_SPIKE = "epidemic_spike"
    STAFFING_GAP = "staffing_gap"
    NEAR_EXPIRY = "near_expiry"
    DRUG_RECALL = "drug_recall"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class Alert(BaseModel):
    alert_id: str
    alert_type: AlertType
    severity: AlertSeverity
    store_id: str
    title: str
    description: str
    source_agent: str  # "soma" or "pulse"
    timestamp: datetime
    status: AlertStatus = AlertStatus.ACTIVE
    metadata: Optional[dict] = None  # flexible payload (e.g., fridge_id, batch_id)
