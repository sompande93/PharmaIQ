"""
Distributor MCP Server
Supply chain interface for checking stock and submitting priority orders.
Tools: check_stock_availability, submit_priority_order
"""

from .base import BaseMCPServer
from datetime import datetime
import random
import string


class DistributorMCP(BaseMCPServer):
    def __init__(self):
        # No seed file needed — this MCP simulates external distributor responses
        self._orders = []

    def check_stock_availability(self, sku_id: str, quantity: int) -> dict:
        """Check if a distributor has stock available for a given SKU."""
        # Simulate distributor stock availability
        available = True
        lead_time = "24-48 hours"

        # Dengue kits are high-demand during outbreaks, might have limited stock
        if sku_id == "DENGUE_KIT" and quantity > 500:
            available = False
            lead_time = "72-96 hours (backorder)"

        return {
            "sku_id": sku_id,
            "requested_quantity": quantity,
            "available": available,
            "available_quantity": quantity if available else int(quantity * 0.6),
            "lead_time": lead_time,
            "distributor": "PharmaDist National",
            "timestamp": datetime.now().isoformat()
        }

    def submit_priority_order(self, sku_id: str, store_id: str, quantity: int, priority: str = "normal") -> dict:
        """Submit a priority order to the distributor."""
        order_id = "ORD_" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))

        delivery_map = {
            "critical": "6-12 hours",
            "high": "12-24 hours",
            "normal": "24-48 hours"
        }

        order = {
            "order_id": order_id,
            "sku_id": sku_id,
            "store_id": store_id,
            "quantity": quantity,
            "priority": priority,
            "status": "confirmed",
            "estimated_delivery": delivery_map.get(priority, "24-48 hours"),
            "distributor": "PharmaDist National",
            "timestamp": datetime.now().isoformat()
        }

        self._orders.append(order)
        return {"success": True, **order}

    def get_pending_orders(self) -> list[dict]:
        """Get all pending orders."""
        return self._orders


# Singleton instance
distributor_mcp = DistributorMCP()
