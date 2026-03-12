"""
PharmaIQ — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api.routes.pipeline import router as pipeline_router
from api.routes.approvals import router as approvals_router
from api.routes.stores import router as stores_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Autonomous Health Retail Intelligence — Multi-Agent Agentic System powered by LangGraph + Gemini",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(pipeline_router)
app.include_router(approvals_router)
app.include_router(stores_router)


@app.on_event("startup")
async def cleanup_stale_runs():
    """Mark any runs left in 'running' state from a previous server session as 'failed'."""
    from api.routes.pipeline import load_runs, save_run
    from datetime import datetime
    runs = load_runs()
    for run_id, data in runs.items():
        if data.get("status") == "running":
            data["status"] = "failed"
            data["completed_at"] = datetime.now().isoformat()
            data["error"] = "Server restarted before pipeline completed"
            data["current_node"] = data.get("current_node", "unknown")
            save_run(run_id, data)
    stale = [rid for rid, d in runs.items() if d.get("error") == "Server restarted before pipeline completed"]
    if stale:
        print(f"[STARTUP] Cleaned {len(stale)} stale runs: {stale}")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "agents": ["soma", "pulse", "vigil", "audit"],
        "mcp_servers": [
            "iot_fridge", "health_data", "weather",
            "erp_inventory", "hrms_roster", "drug_stability",
            "distributor", "sales_analytics"
        ],
        "endpoints": {
            "pipeline": "/api/pipeline/run",
            "approvals": "/api/approvals/pending",
            "stores": "/api/stores/",
            "docs": "/docs",
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
