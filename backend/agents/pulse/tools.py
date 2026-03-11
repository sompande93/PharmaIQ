"""
PULSE Agent — LangGraph tool definitions
Wraps MCP server calls as LangChain tools for epidemic forecasting and supply prediction.
"""

from langchain_core.tools import tool
from mcp_servers.health_data import health_data_mcp
from mcp_servers.weather import weather_mcp
from mcp_servers.erp_inventory import erp_inventory_mcp
from mcp_servers.sales_analytics import sales_analytics_mcp
from mcp_servers.distributor import distributor_mcp
import json


@tool
def get_disease_outbreaks() -> str:
    """Get all active disease outbreaks and watch-level alerts from IDSP surveillance data. Returns disease names, regions, case counts, and growth rates."""
    clusters = health_data_mcp.fetch_active_clusters()
    if not clusters:
        return "No active disease outbreaks or clusters detected."
    return json.dumps(clusters, indent=2)


@tool
def get_infection_rate(disease: str, region: str) -> str:
    """Get detailed infection rate and growth stats for a specific disease in a region. E.g. disease='dengue', region='east_delhi'."""
    result = health_data_mcp.get_infection_rate(disease, region)
    return json.dumps(result, indent=2)


@tool
def get_weather_forecast(region: str) -> str:
    """Get 14-day weather forecast for a region including rainfall, humidity, and mosquito/waterlogging risk. E.g. region='east_delhi'."""
    result = weather_mcp.get_forecast_14d(region)
    return json.dumps(result, indent=2)


@tool
def get_monsoon_alert(region: str) -> str:
    """Check if monsoon-level rainfall is expected in a region. Returns total rainfall, heavy rain days, and mosquito risk."""
    result = weather_mcp.get_monsoon_alert(region)
    return json.dumps(result, indent=2)


@tool
def get_demand_trend(store_id: str) -> str:
    """Get demand trend analysis for all SKUs at a store. Returns velocities, stock days, and risk levels."""
    result = sales_analytics_mcp.get_demand_trend(store_id)
    return json.dumps(result, indent=2, default=str)


@tool
def get_sku_velocity(sku_id: str, store_id: str) -> str:
    """Get current sales velocity for a specific SKU at a store. Returns daily/weekly velocity and days of stock remaining."""
    result = sales_analytics_mcp.get_sku_velocity(sku_id, store_id)
    return json.dumps(result, indent=2, default=str)


@tool
def check_distributor_stock(sku_id: str, quantity: int) -> str:
    """Check if a distributor has stock available for a reorder. Provide SKU ID and desired quantity."""
    result = distributor_mcp.check_stock_availability(sku_id, quantity)
    return json.dumps(result, indent=2, default=str)


@tool
def get_store_inventory_for_pulse(store_id: str) -> str:
    """Get inventory for a store to assess current stock levels against predicted demand."""
    items = erp_inventory_mcp.get_inventory(store_id=store_id)
    return json.dumps(items, indent=2)


# All tools for PULSE
PULSE_TOOLS = [
    get_disease_outbreaks,
    get_infection_rate,
    get_weather_forecast,
    get_monsoon_alert,
    get_demand_trend,
    get_sku_velocity,
    check_distributor_stock,
    get_store_inventory_for_pulse,
]
