"""
SOMA Agent — LangGraph tool definitions
Wraps MCP server calls as LangChain tools so Gemini can invoke them.
"""

from langchain_core.tools import tool
from mcp_servers.iot_fridge import iot_fridge_mcp
from mcp_servers.erp_inventory import erp_inventory_mcp
from mcp_servers.hrms_roster import hrms_roster_mcp
from mcp_servers.drug_stability import drug_stability_mcp
from mcp_servers.sales_analytics import sales_analytics_mcp
import json


@tool
def get_fridge_breach_alerts() -> str:
    """Get all fridges currently exceeding the 8°C temperature threshold. Returns fridge IDs, temperatures, contents, and severity."""
    breaches = iot_fridge_mcp.get_breach_alerts()
    if not breaches:
        return "No temperature breaches detected. All fridges within safe range."
    return json.dumps(breaches, indent=2)


@tool
def get_fridge_temperature(fridge_id: str) -> str:
    """Get the live temperature reading for a specific fridge. Provide the fridge_id like 'FRIDGE_142_03'."""
    result = iot_fridge_mcp.get_live_temp(fridge_id)
    return json.dumps(result, indent=2)


@tool
def check_drug_safety(drug_id: str, current_temp: float, duration_hours: float) -> str:
    """Check if a drug is still safe given a temperature excursion. Provide drug_id (e.g. 'insulin_novolog'), current temp in Celsius, and duration of exposure in hours."""
    result = drug_stability_mcp.check_temp_tolerance(drug_id, current_temp, duration_hours)
    return json.dumps(result, indent=2)


@tool
def get_inventory_by_fridge(fridge_id: str) -> str:
    """Get all SKUs stored in a specific fridge to assess quarantine impact. Returns drug names, quantities, batch IDs, and values."""
    items = erp_inventory_mcp.get_sku_by_fridge(fridge_id)
    return json.dumps(items, indent=2)


@tool
def get_store_inventory(store_id: str) -> str:
    """Get complete inventory for a store. Returns all SKUs with quantities, values, and expiry dates."""
    items = erp_inventory_mcp.get_inventory(store_id=store_id)
    return json.dumps(items, indent=2)


@tool
def get_shift_gaps(store_id: str, date: str) -> str:
    """Find hours when no registered pharmacist is on duty at a store. Date format: 'YYYY-MM-DD'. Returns gaps and compliance risk."""
    result = hrms_roster_mcp.get_shift_gaps(store_id, date)
    return json.dumps(result, indent=2)


@tool
def get_available_pharmacists(date: str, hour: int) -> str:
    """Find registered pharmacists available at a specific hour to fill gaps. Hour is 0-23."""
    result = hrms_roster_mcp.get_available_pharmacists(date, hour)
    return json.dumps(result, indent=2)


@tool
def get_expiring_stock(days_threshold: int = 90) -> str:
    """Get all SKUs expiring within the given number of days. Returns projected waste quantities and values."""
    result = erp_inventory_mcp.get_expiring_stock(days_threshold)
    return json.dumps(result, indent=2, default=str)


@tool
def get_slow_moving_skus() -> str:
    """Identify SKUs with low sales velocity that are at risk of expiring unsold."""
    result = sales_analytics_mcp.get_slow_movers()
    return json.dumps(result, indent=2, default=str)


# All tools for SOMA
SOMA_TOOLS = [
    get_fridge_breach_alerts,
    get_fridge_temperature,
    check_drug_safety,
    get_inventory_by_fridge,
    get_store_inventory,
    get_shift_gaps,
    get_available_pharmacists,
    get_expiring_stock,
    get_slow_moving_skus,
]
