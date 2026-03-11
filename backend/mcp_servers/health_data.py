"""
Health Data MCP Server (IDSP)
Aggregates government disease surveillance data.
Tools: fetch_active_clusters, get_infection_rate, get_outbreak_zones
"""

from .base import BaseMCPServer
from typing import Optional


class HealthDataMCP(BaseMCPServer):
    def __init__(self):
        super().__init__("disease_data.json", "disease_reports")

    def fetch_active_clusters(self, region: Optional[str] = None) -> list[dict]:
        """Fetch disease clusters that are in 'outbreak' or 'watch' alert level."""
        reports = self.data
        if region:
            reports = [r for r in reports if r["region"] == region]
        return [
            {
                "report_id": r["report_id"],
                "disease": r["disease"],
                "region": r["region"],
                "confirmed_cases": r["confirmed_cases"],
                "growth_rate_pct": r["growth_rate_pct"],
                "trend": r["trend"],
                "alert_level": r["alert_level"],
                "affected_districts": r["affected_districts"],
                "reporting_date": r["reporting_date"]
            }
            for r in reports
            if r["alert_level"] in ("outbreak", "watch")
        ]

    def get_infection_rate(self, disease: str, region: str) -> dict:
        """Get infection rate and growth for a specific disease in a region."""
        for r in self.data:
            if r["disease"] == disease and r["region"] == region:
                return {
                    "disease": disease,
                    "region": region,
                    "confirmed_cases": r["confirmed_cases"],
                    "suspected_cases": r["suspected_cases"],
                    "previous_week": r["previous_week_cases"],
                    "growth_rate_pct": r["growth_rate_pct"],
                    "trend": r["trend"],
                    "alert_level": r["alert_level"]
                }
        return {"error": f"No data for {disease} in {region}"}

    def get_outbreak_zones(self) -> list[dict]:
        """Get all regions currently at 'outbreak' alert level."""
        return [
            {
                "report_id": r["report_id"],
                "disease": r["disease"],
                "region": r["region"],
                "cluster_name": r["region"].replace("_", " ").title(),
                "weekly_cases": r["confirmed_cases"],
                "growth_rate": r["growth_rate_pct"],
                "severity": r["alert_level"].upper(),
                "reported_at": r["reporting_date"],
                "affected_districts": r["affected_districts"]
            }
            for r in self.data
            if r["alert_level"] == "outbreak"
        ]


# Singleton instance
health_data_mcp = HealthDataMCP()
