"""
PharmaIQ Backend Verification Script
Tests the full agentic pipeline: MCPs -> SOMA -> PULSE -> VIGIL -> AUDIT -> HITL -> EXECUTE
"""

import asyncio
import os
import sys
import json
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestrator.graph import run_pipeline
from orchestrator.nodes import collect_signals


async def verify_mcps():
    """Verify that all MCP signals are being collected correctly."""
    print("\n--- [STEP 1: MCP Signal Collection Verification] ---")
    initial_state = {}
    signals = collect_signals(initial_state)
    
    print(f"✅ Fridge Breaches: {len(signals.get('fridge_breaches', []))}")
    print(f"✅ Disease Outbreaks: {len(signals.get('disease_clusters', []))}")
    print(f"✅ Weather Alerts: {len(signals.get('weather_alerts', []))}")
    print(f"✅ Staffing Gaps: {len(signals.get('shift_gaps', []))}")
    print(f"✅ Expiring Stock: {len(signals.get('expiring_stock', []))}")
    
    return signals


async def run_live_pipeline():
    """Run the live LangGraph pipeline using the Gemini API."""
    print("\n--- [STEP 2: Live Agent Pipeline Execution] ---")
    
    # Check for API Key
    load_dotenv()
    if not os.getenv("GOOGLE_API_KEY") or "your-gemini" in os.getenv("GOOGLE_API_KEY"):
        print("❌ Error: GOOGLE_API_KEY not found in .env or environment.")
        print("Please set your API key in /home/labuser/Documents/PharmaQ/backend/.env to test live agents.")
        return
    
    print("🚀 Starting full agent pipeline (this may take 30-60 seconds)...")
    try:
        result = await run_pipeline()
        
        print("\n--- [PIPELINE COMPLETE] ---")
        print(f"Run ID: {result.get('run_id')}")
        print(f"Status: COMPLETED at {result.get('completed_at')}")
        
        print("\n--- [SOMA Analysis] ---")
        print(result.get("soma_analysis", "No analysis generated"))
        
        print("\n--- [PULSE Analysis] ---")
        print(result.get("pulse_analysis", "No analysis generated"))
        
        print("\n--- [VIGIL compliance critique] ---")
        print(result.get("vigil_critique", "No critique generated")[:300] + "...")
        
        print("\n--- [AUDIT financial critique] ---")
        print(result.get("audit_critique", "No critique generated")[:300] + "...")
        
        print("\n--- [Action Summary] ---")
        print(f"Total Proposed: {len(result.get('proposed_actions', []))}")
        print(f"Awaiting Approval (HITL): {len(result.get('actions_for_approval', []))}")
        print(f"Auto-Approved (Green Lane): {len(result.get('approved_actions', []))}")
        print(f"Executed: {len(result.get('executed_actions', []))}")
        
        for i, action in enumerate(result.get('executed_actions', []), 1):
            print(f"  {i}. {action.get('action_type')} -> {action.get('status')}")

    except Exception as e:
        print(f"❌ Pipeline Failed: {str(e)}")


if __name__ == "__main__":
    print("PharmaIQ Backend Test Suite")
    print("===========================")
    
    # Run tests
    asyncio.run(verify_mcps())
    
    # Ask user to run live if they want
    print("\nReady for live agent testing.")
    print("Make sure you have added your GOOGLE_API_KEY to the .env file.")
    print("Then run: 'python test_backend.py --live'")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--live":
        asyncio.run(run_live_pipeline())
