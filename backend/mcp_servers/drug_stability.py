"""
Drug Stability MCP Server
WHO-compliant drug temperature tolerance reference data.
Tools: check_temp_tolerance, get_shelf_life, is_cold_chain_required
"""

from .base import BaseMCPServer


class DrugStabilityMCP(BaseMCPServer):
    def __init__(self):
        super().__init__("drug_stability.json", "drugs")

    def check_temp_tolerance(self, drug_id: str, current_temp: float, duration_hours: float) -> dict:
        """
        Check if a drug is still safe given temperature excursion.
        Returns safety verdict based on WHO protocols.
        """
        for drug in self.data:
            if drug["drug_id"] == drug_id:
                if not drug["requires_cold_chain"]:
                    return {
                        "drug_id": drug_id,
                        "drug_name": drug["name"],
                        "requires_cold_chain": False,
                        "is_safe": True,
                        "reason": "Drug does not require cold chain storage"
                    }

                # Determine max allowed excursion time at current temp
                if current_temp <= drug["storage_temp_max"]:
                    return {
                        "drug_id": drug_id,
                        "drug_name": drug["name"],
                        "is_safe": True,
                        "reason": f"Temperature {current_temp}C is within safe range ({drug['storage_temp_min']}-{drug['storage_temp_max']}C)"
                    }

                if current_temp <= 10.0:
                    max_hours = drug.get("max_excursion_hours_at_10c", 0)
                elif current_temp <= 12.0:
                    max_hours = drug.get("max_excursion_hours_at_12c", 0)
                else:
                    max_hours = 0

                is_safe = duration_hours < max_hours if max_hours else False

                return {
                    "drug_id": drug_id,
                    "drug_name": drug["name"],
                    "current_temp": current_temp,
                    "duration_hours": duration_hours,
                    "max_allowed_hours": max_hours,
                    "is_safe": is_safe,
                    "remaining_safe_hours": max(0, max_hours - duration_hours) if max_hours else 0,
                    "reason": f"{'Safe' if is_safe else 'AT RISK'}: {duration_hours}h at {current_temp}C (max allowed: {max_hours}h)",
                    "recommendation": "Continue monitoring" if is_safe else "QUARANTINE IMMEDIATELY"
                }

        return {"error": f"Drug {drug_id} not found in stability database"}

    def get_shelf_life(self, drug_id: str) -> dict:
        """Get storage requirements for a drug."""
        for drug in self.data:
            if drug["drug_id"] == drug_id:
                return {
                    "drug_id": drug_id,
                    "drug_name": drug["name"],
                    "storage_temp_min": drug["storage_temp_min"],
                    "storage_temp_max": drug["storage_temp_max"],
                    "critical_temp": drug["critical_temp"],
                    "requires_cold_chain": drug["requires_cold_chain"],
                    "schedule": drug["schedule"]
                }
        return {"error": f"Drug {drug_id} not found"}

    def is_cold_chain_required(self, drug_id: str) -> bool:
        """Quick check if a drug needs cold chain storage."""
        for drug in self.data:
            if drug["drug_id"] == drug_id:
                return drug["requires_cold_chain"]
        return False


# Singleton instance
drug_stability_mcp = DrugStabilityMCP()
