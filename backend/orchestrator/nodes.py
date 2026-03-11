"""
Signal Collector — Gathers all input signals from MCP servers to seed the pipeline.
This is the first node in the LangGraph — it populates the shared state.
"""

from mcp_servers.iot_fridge import iot_fridge_mcp
from mcp_servers.health_data import health_data_mcp
from mcp_servers.weather import weather_mcp
from mcp_servers.hrms_roster import hrms_roster_mcp
from mcp_servers.erp_inventory import erp_inventory_mcp
from datetime import datetime


def collect_signals(state: dict) -> dict:
    """
    Collect node: gathers all MCP signals into the shared state.
    This seeds the pipeline with real-time data from all sources.
    """
    # 1. Fridge breach alerts
    fridge_breaches = iot_fridge_mcp.get_breach_alerts()

    # 2. Disease outbreaks
    disease_clusters = health_data_mcp.fetch_active_clusters()

    # 3. Weather alerts for outbreak regions
    weather_alerts = []
    outbreak_regions = set()
    for cluster in disease_clusters:
        region = cluster.get("region")
        if region:
            outbreak_regions.add(region)
    for region in outbreak_regions:
        monsoon = weather_mcp.get_monsoon_alert(region)
        if not monsoon.get("error"):
            weather_alerts.append(monsoon)

    # 4. Staffing gaps (check next 2 days)
    shift_gaps = []
    today = datetime.now().strftime("%Y-%m-%d")
    tomorrow = (datetime.now().replace(day=datetime.now().day + 1)).strftime("%Y-%m-%d")
    for store_id in ["STORE_142", "STORE_088", "STORE_201", "STORE_055"]:
        for date in [today, tomorrow]:
            try:
                gaps = hrms_roster_mcp.get_shift_gaps(store_id, date)
                if gaps.get("has_compliance_risk"):
                    shift_gaps.append(gaps)
            except Exception:
                pass

    # 5. Expiring stock
    expiring_stock = erp_inventory_mcp.get_expiring_stock(90)

    return {
        "fridge_breaches": fridge_breaches,
        "disease_clusters": disease_clusters,
        "weather_alerts": weather_alerts,
        "shift_gaps": shift_gaps,
        "expiring_stock": expiring_stock,
        "current_node": "signals_collected",
        "started_at": datetime.now().isoformat(),
    }
