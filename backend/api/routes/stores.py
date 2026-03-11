"""
PharmaIQ API — Store & MCP data routes
Read-only endpoints for inspecting store status, fridge temps, inventory, etc.
"""

from fastapi import APIRouter
from mcp_servers import (
    iot_fridge_mcp,
    health_data_mcp,
    weather_mcp,
    erp_inventory_mcp,
    hrms_roster_mcp,
    sales_analytics_mcp,
)
from typing import Optional
import json

router = APIRouter(prefix="/api/stores", tags=["Stores"])


@router.get("/")
async def list_stores():
    """List all stores from seed data."""
    import os
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data", "stores.json")
    with open(data_path) as f:
        stores = json.load(f)
    return {"total": len(stores), "stores": stores}


@router.get("/fridges")
async def get_all_fridges(store_id: Optional[str] = None):
    """Get fridge temperatures across stores."""
    temps = iot_fridge_mcp.get_all_temps(store_id)
    breaches = iot_fridge_mcp.get_breach_alerts()
    return {
        "total_fridges": len(temps),
        "active_breaches": len(breaches),
        "fridges": temps,
        "breaches": breaches,
    }


@router.get("/inventory")
async def get_inventory(store_id: Optional[str] = None):
    """Get inventory with optional store filter."""
    items = erp_inventory_mcp.get_inventory(store_id=store_id)
    return {"total_skus": len(items), "inventory": items}


@router.get("/expiring")
async def get_expiring(days: int = 90):
    """Get stock expiring within N days."""
    items = erp_inventory_mcp.get_expiring_stock(days)
    return {"total_expiring": len(items), "expiring_stock": items}


@router.get("/disease-alerts")
async def get_disease_alerts(region: Optional[str] = None):
    """Get active disease clusters from IDSP."""
    clusters = health_data_mcp.fetch_active_clusters(region)
    outbreaks = health_data_mcp.get_outbreak_zones()
    return {
        "active_clusters": len(clusters),
        "outbreak_zones": len(outbreaks),
        "clusters": clusters,
        "outbreaks": outbreaks,
    }


@router.get("/weather/{region}")
async def get_weather(region: str):
    """Get 14-day weather forecast for a region."""
    forecast = weather_mcp.get_forecast_14d(region)
    monsoon = weather_mcp.get_monsoon_alert(region)
    return {"forecast": forecast, "monsoon_alert": monsoon}


@router.get("/staff-gaps")
async def get_staff_gaps(store_id: str, date: Optional[str] = None):
    """Get staffing compliance gaps for a store."""
    gaps = hrms_roster_mcp.get_shift_gaps(store_id, date)
    return gaps


@router.get("/demand/{store_id}")
async def get_demand(store_id: str):
    """Get demand trends for a store."""
    trends = sales_analytics_mcp.get_demand_trend(store_id)
    return {"store_id": store_id, "trends": trends}
