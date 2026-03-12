"""
PharmaIQ Configuration
Central configuration for all thresholds, API keys, and system settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # --- API ---
    APP_NAME: str = "PharmaIQ"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --- LLM ---
    GOOGLE_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-2.0-flash"
    LLM_TEMPERATURE: float = 0.1

    # --- Cold Chain Thresholds ---
    FRIDGE_TEMP_MIN: float = 2.0  # °C
    FRIDGE_TEMP_MAX: float = 8.0  # °C
    FRIDGE_CRITICAL_TEMP: float = 10.0  # °C — irreversible damage threshold

    # --- HITL Thresholds ---
    GREEN_LANE_MAX_VALUE: float = 200000  # ₹2L — auto-approve
    YELLOW_LANE_MAX_VALUE: float = 500000  # ₹5L — manager approval
    # Above ₹5L = RED LANE — requires senior leadership

    # --- Epidemic ---
    EPIDEMIC_CONFIDENCE_THRESHOLD: float = 0.75  # 75% confidence to trigger
    DEMAND_MULTIPLIER_AUTO_MAX: float = 2.5  # Auto-approve up to 2.5x
    DEMAND_MULTIPLIER_MANUAL_MAX: float = 3.0  # Manager approval up to 3x

    # --- Staffing ---
    SCHEDULE_H_REQUIRED: bool = True  # Must have pharmacist for Sch H drugs
    PEAK_HOURS: list = [(7, 9), (17, 19)]  # AM and PM rush windows

    # --- Near Expiry ---
    EXPIRY_WARNING_DAYS: int = 90  # Flag items expiring within 90 days
    EXPIRY_CRITICAL_DAYS: int = 30  # Critical: within 30 days
    MARKDOWN_THRESHOLD_VELOCITY_DROP: float = 0.5  # 50% velocity drop triggers markdown

    # --- LangChain Tracing ---
    LANGCHAIN_TRACING_V2: str = "true"
    LANGCHAIN_API_KEY: Optional[str] = None
    LANGCHAIN_PROJECT: str = "PharmaIQ-Orchestrator"

    # --- Data Paths ---
    DATA_DIR: str = "data"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
