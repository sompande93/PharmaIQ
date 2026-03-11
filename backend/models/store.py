"""
PharmaIQ Pydantic Models — Store
"""

from pydantic import BaseModel
from typing import Optional
from enum import Enum


class StoreTier(str, Enum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"


class StoreStatus(str, Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    CLOSED = "closed"


class Store(BaseModel):
    store_id: str
    name: str
    city: str
    zone: str
    tier: StoreTier
    status: StoreStatus = StoreStatus.ACTIVE
    fridge_count: int
    staff_count: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    nearby_hospital: Optional[str] = None
    nearby_specialty: Optional[str] = None  # e.g., "dialysis_center", "pediatrics"
