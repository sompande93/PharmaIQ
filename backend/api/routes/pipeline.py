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

        # Launch background task with the SAME run_id
        background_tasks.add_task(run_pipeline, update_callback=persistence_callback, run_id=run_id)

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
        "status": "failed" if data.get("error") else data.get("status", "complete"),
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
        "soma_tool_calls": data.get("soma_tool_calls", []),
        "pulse_tool_calls": data.get("pulse_tool_calls", []),
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
        "soma_tool_calls": result.get("soma_tool_calls", []),
        "pulse_tool_calls": result.get("pulse_tool_calls", []),
        "vigil_critique": result.get("vigil_critique"),
        "audit_critique": result.get("audit_critique"),
        "critique_passed": result.get("critique_passed"),
        "proposed_actions": result.get("proposed_actions", []),
        "approved_actions": result.get("approved_actions", []),
        "actions_for_approval": result.get("actions_for_approval", []),
        "rejected_actions": result.get("rejected_actions", []),
        "executed_actions": result.get("executed_actions", []),
    }


@router.get("/analytics")
async def get_analytics():
    """Compute cross-pipeline analytics from run history."""
    runs = load_runs()
    
    total_value_protected = 0.0
    total_cost = 0.0
    stockout_mitigation = 0.0
    
    actions_by_type = {}
    signals_by_cat = {
        "fridge": 0,
        "disease": 0,
        "weather": 0,
        "staffing": 0,
        "expiry": 0
    }
    
    for run_id, state in runs.items():
        # Sum signals from internal signal state if available, or summary counts
        sig_counts = state.get("signals_detected")
        if not sig_counts:
             # Fallback to len of individual lists if it's a full run state
             sig_counts = {
                "fridge_breaches": len(state.get("fridge_breaches", [])),
                "disease_clusters": len(state.get("disease_clusters", [])),
                "weather_alerts": len(state.get("weather_alerts", [])),
                "shift_gaps": len(state.get("shift_gaps", [])),
                "expiring_stock": len(state.get("expiring_stock", [])),
             }

        signals_by_cat["fridge"] += sig_counts.get("fridge_breaches", 0)
        signals_by_cat["disease"] += sig_counts.get("disease_clusters", 0)
        signals_by_cat["weather"] += sig_counts.get("weather_alerts", 0)
        signals_by_cat["staffing"] += sig_counts.get("shift_gaps", 0)
        signals_by_cat["expiry"] += sig_counts.get("expiring_stock", 0)
        
        # Sum financials from executed actions
        for action in state.get("executed_actions", []):
            val = action.get("estimated_value", 0)
            cost = action.get("estimated_cost", 0)
            total_value_protected += val
            total_cost += cost
            
            if action.get("action_type") == "reorder_stock":
                stockout_mitigation += val * 0.8 # Empirical estimate
                
            atype = action.get("action_type", "unknown")
            actions_by_type[atype] = actions_by_type.get(atype, 0) + 1
            
    # Calculate some derived ratios
    opex_efficiency = 90.0 # Default base
    if total_cost > 0:
        # Higher ROI = higher efficiency
        roi = total_value_protected / (total_cost + 1) # simple avoidance of div zero
        opex_efficiency = min(98.5, 85.0 + (roi * 2.0))

    return {
        "net_value_protected": total_value_protected,
        "total_cost": total_cost,
        "stockout_mitigation": stockout_mitigation,
        "opex_efficiency": opex_efficiency,
        "signals_by_category": signals_by_cat,
        "actions_by_type": actions_by_type,
        "total_runs": len(runs)
    }


@router.delete("/runs/{run_id}")
async def delete_run(run_id: str):
    """Delete a run from history."""
    runs = load_runs()
    if run_id in runs:
        del runs[run_id]
        with open(RUNS_FILE, "w") as f:
            json.dump(runs, f, indent=2)
        return {"status": "deleted", "run_id": run_id}
    raise HTTPException(status_code=404, detail="Run not found")


@router.post("/runs/{run_id}/stop")
async def stop_run(run_id: str):
    """Mark an active run as failed/stopped."""
    runs = load_runs()
    if run_id in runs:
        if runs[run_id].get("status") == "running":
            runs[run_id]["status"] = "failed"
            runs[run_id]["error"] = "Stopped by user"
            runs[run_id]["completed_at"] = datetime.now().isoformat()
            save_run(run_id, runs[run_id])
            return {"status": "stopped", "run_id": run_id}
        return {"status": "already_stopped", "run_id": run_id}
    raise HTTPException(status_code=404, detail="Run not found")


@router.post("/stop-all")
async def stop_all_runs():
    """Mark all active runs as failed/stopped."""
    runs = load_runs()
    stopped = []
    for rid, data in runs.items():
        if data.get("status") == "running":
            data["status"] = "failed"
            data["error"] = "Stopped by user (global stop)"
            data["completed_at"] = datetime.now().isoformat()
            save_run(rid, data)
            stopped.append(rid)
    return {"status": "bulk_stop_complete", "stopped_count": len(stopped), "stopped_ids": stopped}
