"""
ERP Inventory MCP Server
Manages inventory, batch quarantine, and order placement.
Tools: get_inventory, get_sku_by_fridge, block_batch_sale, place_order, get_expiring_stock
"""

from .base import BaseMCPServer
from typing import Optional
from datetime import datetime, timedelta


class ERPInventoryMCP(BaseMCPServer):
    def __init__(self):
        super().__init__("inventory.json", "inventory")

    def get_inventory(self, store_id: Optional[str] = None, category: Optional[str] = None) -> list[dict]:
        """Get inventory items, optionally filtered by store or category."""
        items = self.data
        if store_id:
            items = [i for i in items if i["store_id"] == store_id]
        if category:
            items = [i for i in items if i["category"] == category]
        return items

    def get_sku_by_fridge(self, fridge_id: str) -> list[dict]:
        """Get all SKUs stored in a specific fridge (for quarantine impact analysis)."""
        return [i for i in self.data if i.get("fridge_id") == fridge_id]

    def block_batch_sale(self, batch_id: str) -> dict:
        """Quarantine a batch — block it from being sold at POS."""
        items = self.data
        for item in items:
            if item["batch_id"] == batch_id:
                item["status"] = "quarantined"
                self._save_data(items)
                return {
                    "success": True,
                    "action": "quarantine",
                    "batch_id": batch_id,
                    "drug_name": item["drug_name"],
                    "quantity": item["quantity"],
                    "value_blocked": item["quantity"] * item["unit_price"],
                    "timestamp": datetime.now().isoformat()
                }
        return {"success": False, "error": f"Batch {batch_id} not found"}

    def place_order(self, sku_id: str, store_id: str, quantity: int) -> dict:
        """Place a reorder for a specific SKU to a store."""
        for item in self.data:
            if item["sku_id"] == sku_id and item["store_id"] == store_id:
                return {
                    "success": True,
                    "action": "reorder",
                    "sku_id": sku_id,
                    "drug_name": item["drug_name"],
                    "store_id": store_id,
                    "quantity_ordered": quantity,
                    "estimated_cost": quantity * item["unit_price"],
                    "estimated_delivery": "24-48 hours",
                    "timestamp": datetime.now().isoformat()
                }
        return {
            "success": True,
            "action": "reorder",
            "sku_id": sku_id,
            "store_id": store_id,
            "quantity_ordered": quantity,
            "estimated_delivery": "24-48 hours",
            "timestamp": datetime.now().isoformat()
        }

    def get_expiring_stock(self, days_threshold: int = 90) -> list[dict]:
        """Get all SKUs expiring within the given number of days."""
        cutoff = (datetime.now() + timedelta(days=days_threshold)).strftime("%Y-%m-%d")
        expiring = []
        for item in self.data:
            if item["expiry_date"] <= cutoff and item["status"] == "active":
                days_left = (datetime.strptime(item["expiry_date"], "%Y-%m-%d") - datetime.now()).days
                projected_sold = item["daily_velocity"] * days_left
                projected_waste = max(0, item["quantity"] - projected_sold)
                expiring.append({
                    **item,
                    "days_until_expiry": days_left,
                    "projected_sold": projected_sold,
                    "projected_waste": projected_waste,
                    "waste_value": projected_waste * item["unit_price"]
                })
        return expiring


# Singleton instance
erp_inventory_mcp = ERPInventoryMCP()
