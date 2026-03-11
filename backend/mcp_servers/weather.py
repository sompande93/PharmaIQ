"""
Weather MCP Server
Provides 14-day forecasts, humidity indices, and monsoon alerts.
Tools: get_forecast_14d, get_humidity_index, get_monsoon_alert, get_mosquito_risk
"""

from .base import BaseMCPServer
from typing import Optional


class WeatherMCP(BaseMCPServer):
    def __init__(self):
        super().__init__("weather_data.json", "forecasts")

    def get_forecast_14d(self, region: str) -> dict:
        """Get 14-day weather forecast for a region."""
        for forecast in self.data:
            if forecast["region"] == region:
                return {
                    "region": region,
                    "forecast_date": forecast["forecast_date"],
                    "total_rainfall_mm": sum(
                        d["rainfall_mm"] for d in forecast["daily_forecasts"]
                    ),
                    "avg_humidity": round(
                        sum(d["humidity"] for d in forecast["daily_forecasts"])
                        / len(forecast["daily_forecasts"]),
                        1
                    ),
                    "rain_days": sum(
                        1 for d in forecast["daily_forecasts"]
                        if d["rainfall_mm"] > 5
                    ),
                    "mosquito_risk": forecast.get("mosquito_risk", "unknown"),
                    "waterlogging_risk": forecast.get("waterlogging_risk", "unknown"),
                    "daily_forecasts": forecast["daily_forecasts"]
                }
        return {"error": f"No forecast for {region}"}

    def get_humidity_index(self, region: str) -> dict:
        """Get average humidity and risk assessment for a region."""
        for forecast in self.data:
            if forecast["region"] == region:
                humidities = [d["humidity"] for d in forecast["daily_forecasts"]]
                avg = sum(humidities) / len(humidities)
                return {
                    "region": region,
                    "avg_humidity": round(avg, 1),
                    "max_humidity": max(humidities),
                    "risk_level": "very_high" if avg > 85 else "high" if avg > 75 else "moderate" if avg > 60 else "low"
                }
        return {"error": f"No data for {region}"}

    def get_monsoon_alert(self, region: str) -> dict:
        """Check if monsoon-level rainfall is expected."""
        for forecast in self.data:
            if forecast["region"] == region:
                total_rain = sum(d["rainfall_mm"] for d in forecast["daily_forecasts"])
                heavy_days = sum(1 for d in forecast["daily_forecasts"] if d["rainfall_mm"] > 20)
                return {
                    "region": region,
                    "is_monsoon_active": total_rain > 100 or heavy_days >= 3,
                    "total_rainfall_mm": total_rain,
                    "heavy_rain_days": heavy_days,
                    "mosquito_risk": forecast.get("mosquito_risk", "unknown")
                }
        return {"error": f"No data for {region}"}


# Singleton instance
weather_mcp = WeatherMCP()
