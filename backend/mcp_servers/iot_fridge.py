"""
IoT Fridge MCP Server
Monitors 960 refrigeration units across 320 stores.
Tools: get_live_temp, get_breach_alerts, get_temp_history, get_fridge_contents
"""

from .base import BaseMCPServer
from typing import Optional
from datetime import datetime


class IoTFridgeMCP(BaseMCPServer):
    def __init__(self):
        super().__init__("fridges.json", "fridges")

    def get_live_temp(self, fridge_id: str) -> dict:
        """Get current temperature reading for a specific fridge."""
        for fridge in self.data:
            if fridge["fridge_id"] == fridge_id:
                return {
                    "fridge_id": fridge_id,
                    "store_id": fridge["store_id"],
                    "current_temp": fridge["current_temp"],
                    "target_temp": fridge["target_temp"],
                    "status": fridge["status"],
                    "timestamp": datetime.now().isoformat()
                }
        return {"error": f"Fridge {fridge_id} not found"}

    def get_all_temps(self, store_id: Optional[str] = None) -> list[dict]:
        """Get temperature readings for all fridges, optionally filtered by store."""
        fridges = self.data
        if store_id:
            fridges = [f for f in fridges if f["store_id"] == store_id]
        return [
            {
                "fridge_id": f["fridge_id"],
                "store_id": f["store_id"],
                "current_temp": f["current_temp"],
                "status": f["status"]
            }
            for f in fridges
        ]

    def get_breach_alerts(self, threshold: float = 8.0) -> list[dict]:
        """Get all fridges currently exceeding temperature threshold."""
        breaches = []
        for fridge in self.data:
            if fridge["current_temp"] > threshold:
                breaches.append({
                    "fridge_id": fridge["fridge_id"],
                    "store_id": fridge["store_id"],
                    "current_temp": fridge["current_temp"],
                    "threshold": threshold,
                    "excess": round(fridge["current_temp"] - threshold, 1),
                    "contents": fridge["contents"],
                    "breach_history": fridge.get("breach_history", []),
                    "last_maintenance": fridge.get("last_maintenance"),
                    "severity": "critical" if fridge["current_temp"] > 10.0 else "high"
                })
        return breaches

    def get_fridge_contents(self, fridge_id: str) -> list[str]:
        """Get list of drugs stored in a specific fridge."""
        for fridge in self.data:
            if fridge["fridge_id"] == fridge_id:
                return fridge["contents"]
        return []


# Singleton instance
iot_fridge_mcp = IoTFridgeMCP()
