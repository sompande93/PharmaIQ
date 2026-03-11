"""
Sales Analytics MCP Server
Tracks SKU velocity, demand trends, and identifies slow-movers.
Tools: get_sku_velocity, get_demand_trend, get_slow_movers
"""

from .base import BaseMCPServer
from typing import Optional
from datetime import datetime, timedelta


class SalesAnalyticsMCP(BaseMCPServer):
    def __init__(self):
        super().__init__("inventory.json", "inventory")

    def get_sku_velocity(self, sku_id: str, store_id: Optional[str] = None) -> dict:
        """Get sales velocity for a specific SKU."""
        for item in self.data:
            if item["sku_id"] == sku_id:
                if store_id and item["store_id"] != store_id:
                    continue
                return {
                    "sku_id": sku_id,
                    "drug_name": item["drug_name"],
                    "store_id": item["store_id"],
                    "daily_velocity": item["daily_velocity"],
                    "weekly_velocity": item["daily_velocity"] * 7,
                    "current_stock": item["quantity"],
                    "days_of_stock": round(item["quantity"] / max(item["daily_velocity"], 1)),
                    "status": item["status"]
                }
        return {"error": f"SKU {sku_id} not found"}

    def get_demand_trend(self, store_id: str, category: Optional[str] = None) -> list[dict]:
        """Get demand trend analysis for a store."""
        items = [i for i in self.data if i["store_id"] == store_id]
        if category:
            items = [i for i in items if i["category"] == category]

        trends = []
        for item in items:
            days_of_stock = round(item["quantity"] / max(item["daily_velocity"], 1))
            risk = "critical" if days_of_stock < 7 else "low" if days_of_stock > 30 else "normal"
            trends.append({
                "sku_id": item["sku_id"],
                "drug_name": item["drug_name"],
                "daily_velocity": item["daily_velocity"],
                "current_stock": item["quantity"],
                "days_of_stock": days_of_stock,
                "stock_risk": risk
            })
        return sorted(trends, key=lambda x: x["days_of_stock"])

    def get_slow_movers(self, velocity_threshold: int = 5) -> list[dict]:
        """Identify SKUs with very low sales velocity (near-expiry risk)."""
        slow = []
        for item in self.data:
            if item["daily_velocity"] <= velocity_threshold and item["status"] == "active":
                days_until_expiry = (
                    datetime.strptime(item["expiry_date"], "%Y-%m-%d") - datetime.now()
                ).days
                if days_until_expiry <= 90:
                    slow.append({
                        "sku_id": item["sku_id"],
                        "drug_name": item["drug_name"],
                        "store_id": item["store_id"],
                        "daily_velocity": item["daily_velocity"],
                        "quantity": item["quantity"],
                        "days_until_expiry": days_until_expiry,
                        "projected_waste": max(0, item["quantity"] - (item["daily_velocity"] * days_until_expiry)),
                        "risk": "critical" if days_until_expiry < 30 else "high"
                    })
        return slow


# Singleton instance
sales_analytics_mcp = SalesAnalyticsMCP()
