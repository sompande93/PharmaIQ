"""
PharmaIQ API — Pipeline Routes
Endpoints for running the agent pipeline and inspecting results.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
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

async def persistence_callback(state: dict):
    """Callback to save intermediate graph state to disk."""
    run_id = state.get("run_id")
    if not run_id:
        return
    
    # Enrich state with derived fields for the list view
    enriched_state = state.copy()
    enriched_state["status"] = "complete" if state.get("completed_at") else "running"
    
    save_run(run_id, enriched_state)

@router.post("/run")
async def trigger_pipeline(background_tasks: BackgroundTasks):
    """
    Trigger a full PharmaIQ pipeline run in the background.
    """
    try:
        # Create a unique run_id immediately
        import uuid
        run_id = f"RUN_{uuid.uuid4().hex[:8]}"
        
        # Initial placeholder save
        initial_data = {
            "run_id": run_id,
            "status": "running",
            "started_at": datetime.now().isoformat(),
            "current_node": "START",
            "actions_proposed": 0,
            "actions_awaiting_approval": 0
        }
        save_run(run_id, initial_data)

        # Launch background task
        background_tasks.add_task(run_pipeline, update_callback=persistence_callback)

        return {
            "run_id": run_id,
            "status": "running",
            "message": "Pipeline analysis started in background"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start pipeline: {str(e)}")


def summarize_run(run_id, data):
    """Helper to create a consistent summary for list view."""
    return {
        "run_id": run_id,
        "started_at": data.get("started_at"),
        "completed_at": data.get("completed_at"),
        "status": data.get("status", "complete"),
        "current_node": data.get("current_node", "END"),
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

@router.get("/runs")
async def list_runs():
    """List all pipeline runs."""
    runs_data = load_runs()
    # Sort runs by started_at descending
    sorted_runs = sorted(
        runs_data.items(), 
        key=lambda x: x[1].get("started_at", ""), 
        reverse=True
    )
    return {
        "total_runs": len(runs_data),
        "runs": [summarize_run(run_id, data) for run_id, data in sorted_runs]
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
        "status": result.get("status", "complete"),
        "current_node": result.get("current_node", "END"),
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
