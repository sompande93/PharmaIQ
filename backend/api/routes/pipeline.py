"""
PharmaIQ API — Pipeline Routes
Endpoints for running the agent pipeline and inspecting results.
"""

from fastapi import APIRouter, HTTPException
from orchestrator.graph import run_pipeline
from datetime import datetime

router = APIRouter(prefix="/api/pipeline", tags=["Pipeline"])

import os
import json

# Persistent store for pipeline results
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RUNS_FILE = os.path.join(BASE_DIR, "data", "runs.json")

def load_runs():
    if os.path.exists(RUNS_FILE):
        try:
            with open(RUNS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_run(run_id, data):
    try:
        runs = load_runs()
        runs[run_id] = data
        os.makedirs(os.path.dirname(RUNS_FILE), exist_ok=True)
        with open(RUNS_FILE, "w") as f:
            json.dump(runs, f, indent=2)
    except Exception:
        pass

@router.post("/run")
async def trigger_pipeline():
    """
    Trigger a full PharmaIQ pipeline run.
    Collects signals → SOMA → PULSE → VIGIL → AUDIT → HITL → Execute
    """
    try:
        result = await run_pipeline()

        run_id = result.get("run_id", f"RUN_{datetime.now().strftime('%H%M%S')}")
        save_run(run_id, result)

        # Build summary
        summary = {
            "run_id": run_id,
            "status": "complete",
            "started_at": result.get("started_at"),
            "completed_at": result.get("completed_at"),
            "signals_detected": {
                "fridge_breaches": len(result.get("fridge_breaches", [])),
                "disease_clusters": len(result.get("disease_clusters", [])),
                "weather_alerts": len(result.get("weather_alerts", [])),
                "shift_gaps": len(result.get("shift_gaps", [])),
                "expiring_stock": len(result.get("expiring_stock", [])),
            },
            "actions_proposed": len(result.get("proposed_actions", [])),
            "actions_auto_approved": len([
                a for a in result.get("approved_actions", [])
                if a.get("status") == "auto_approved"
            ]),
            "actions_awaiting_approval": len(result.get("actions_for_approval", [])),
            "actions_executed": len(result.get("executed_actions", [])),
            "soma_analysis_preview": (result.get("soma_analysis") or "")[:300],
            "pulse_analysis_preview": (result.get("pulse_analysis") or "")[:300],
        }
        return summary

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")


@router.get("/runs")
async def list_runs():
    """List all pipeline runs."""
    runs_data = load_runs()
    return {
        "total_runs": len(runs_data),
        "runs": [
            {
                "run_id": run_id,
                "started_at": data.get("started_at"),
                "completed_at": data.get("completed_at"),
                "status": "complete",
                "signals_detected": {
                    "fridge_breaches": len(data.get("fridge_breaches", [])),
                    "disease_clusters": len(data.get("disease_clusters", [])),
                    "weather_alerts": len(data.get("weather_alerts", [])),
                    "shift_gaps": len(data.get("shift_gaps", [])),
                    "expiring_stock": len(data.get("expiring_stock", [])),
                },
                "actions_proposed": len(data.get("proposed_actions", [])),
                "actions_auto_approved": len([
                    a for a in data.get("approved_actions", [])
                    if a.get("status") == "auto_approved"
                ]),
                "actions_awaiting_approval": len(data.get("actions_for_approval", [])),
                "actions_executed": len(data.get("executed_actions", [])),
                "soma_analysis_preview": (data.get("soma_analysis") or "")[:300],
                "pulse_analysis_preview": (data.get("pulse_analysis") or "")[:300],
            }
            for run_id, data in runs_data.items()
        ]
    }


@router.get("/runs/{run_id}")
async def get_run(run_id: str):
    """Get full details for a specific pipeline run."""
    runs_data = load_runs()
    if run_id not in runs_data:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    result = runs_data[run_id]
    return {
        "run_id": run_id,
        "started_at": result.get("started_at"),
        "completed_at": result.get("completed_at"),
        "signals": {
            "fridge_breaches": result.get("fridge_breaches", []),
            "disease_clusters": result.get("disease_clusters", []),
            "weather_alerts": result.get("weather_alerts", []),
            "shift_gaps": result.get("shift_gaps", []),
            "expiring_stock": result.get("expiring_stock", []),
        },
        "soma_analysis": result.get("soma_analysis"),
        "pulse_analysis": result.get("pulse_analysis"),
        "vigil_critique": result.get("vigil_critique"),
        "audit_critique": result.get("audit_critique"),
        "critique_passed": result.get("critique_passed"),
        "proposed_actions": result.get("proposed_actions", []),
        "approved_actions": result.get("approved_actions", []),
        "actions_for_approval": result.get("actions_for_approval", []),
        "rejected_actions": result.get("rejected_actions", []),
        "executed_actions": result.get("executed_actions", []),
    }
