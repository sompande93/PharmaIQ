"""
PharmaIQ Backend Logic Verification (Mocked)
Verifies the LangGraph flow without calling the LLM API.
Tests: signals -> mock_soma -> mock_pulse -> VIGIL -> AUDIT -> HITL -> Execute
"""

import asyncio
import os
import sys
import json
import uuid
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestrator.graph import create_pipeline, PharmaIQGraphState
from orchestrator.nodes import collect_signals


# Mock SOMA node that returns pre-defined analysis and actions
async def mock_soma_node(state: dict) -> dict:
    print("🤖 Mocking SOMA agent response...")
    analysis = """
SITUATION: Critical fridge temperature breach in STORE_142. Staffing compliance risk in STORE_088.
RISK ASSESSMENT: HIGH. Vaccine integrity at risk.
PROPOSED ACTIONS:
1. QUARANTINE BATCH: Fridge 142_01 has breached 8C. Quarantine Batch BATCH_INS_2847.
   estimated_value: 154000
   estimated_cost: 0
   store_id: STORE_142
2. SHIFT REALLOCATION: STORE_088 has no pharmacist from 17:00 to 19:00. Assign Pharmacist Priya R.
   estimated_value: 45000
   estimated_cost: 2500
   store_id: STORE_088
"""
    # Simulate extraction
    from agents.soma.agent import _extract_proposed_actions
    proposed = _extract_proposed_actions(analysis, "soma_mock")
    
    return {
        "soma_analysis": analysis,
        "proposed_actions": state.get("proposed_actions", []) + proposed,
        "current_node": "soma_complete",
    }


# Mock PULSE node
async def mock_pulse_node(state: dict) -> dict:
    print("🤖 Mocking PULSE agent response...")
    analysis = """
SIGNAL SUMMARY: Dengue clusters detected in East Delhi. Correlations with monsoon humidity confirmed.
PROPOSED ACTIONS:
1. PREEMPTIVE REORDER: Increase Azithromycin and Paracetamol stock by 3x for STORE_201.
   estimated_value: 320000
   estimated_cost: 185000
   store_id: STORE_201
"""
    from agents.pulse.agent import _extract_proposed_actions
    proposed = _extract_proposed_actions(analysis, "pulse_mock")
    
    return {
        "pulse_analysis": analysis,
        "proposed_actions": state.get("proposed_actions", []) + proposed,
        "current_node": "pulse_complete",
    }


# Mock VIGIL node
async def mock_vigil_node(state: dict) -> dict:
    print("🤖 Mocking VIGIL compliance review...")
    critique = "VIGIL COMPLIANCE REVIEW: All actions PASS CDSCO and WHO cold chain protocols."
    return {
        "vigil_critique": critique,
        "current_node": "vigil_complete",
    }


# Mock AUDIT node
async def mock_audit_node(state: dict) -> dict:
    print("🤖 Mocking AUDIT financial review...")
    critique = "AUDIT FINANCIAL REVIEW: PASS. All actions have positive ROI. Quarantine value > cost."
    return {
        "audit_critique": critique,
        "critique_passed": True,
        "current_node": "audit_complete",
    }


async def run_mock_verification():
    """Run the graph with mocked agents to verify the full flow logic."""
    print("--- [MOCK VERIFICATION START] ---")
    
    from langgraph.graph import START, END, StateGraph
    from orchestrator.graph import PharmaIQGraphState
    from orchestrator.nodes import collect_signals
    from orchestrator.hitl import hitl_gate
    from orchestrator.graph import execute_actions

    # Build a test graph with mock nodes
    builder = StateGraph(PharmaIQGraphState)
    builder.add_node("signals", collect_signals)
    builder.add_node("soma", mock_soma_node)
    builder.add_node("pulse", mock_pulse_node)
    builder.add_node("vigil", mock_vigil_node)
    builder.add_node("audit", mock_audit_node)
    builder.add_node("hitl", hitl_gate)
    builder.add_node("execute", execute_actions)

    builder.add_edge(START, "signals")
    builder.add_edge("signals", "soma")
    builder.add_edge("soma", "pulse")
    builder.add_edge("pulse", "vigil")
    builder.add_edge("vigil", "audit")
    builder.add_edge("audit", "hitl")
    builder.add_edge("hitl", "execute")
    builder.add_edge("execute", END)

    pipeline = builder.compile()

    initial_state = {
        "proposed_actions": [],
        "approved_actions": [],
        "actions_for_approval": [],
        "executed_actions": [],
        "run_id": f"RUN_MOCK_{uuid.uuid4().hex[:6]}",
    }

    print("🚀 Executing mocked graph flow...")
    result = await pipeline.ainvoke(initial_state)

    print("\n--- [VERIFICATION RESULTS] ---")
    print(f"✅ Run ID: {result.get('run_id')}")
    print(f"✅ Signals Collected: {bool(result.get('fridge_breaches'))}")
    print(f"✅ SOMA Actions: {len([a for a in result.get('proposed_actions', []) if 'soma' in a.get('proposed_by', '')])}")
    print(f"✅ PULSE Actions: {len([a for a in result.get('proposed_actions', []) if 'pulse' in a.get('proposed_by', '')])}")
    
    print("\n--- [CRITIQUE RESULTS] ---")
    print(f"VIGIL Verdict: {result.get('vigil_critique')[:100]}...")
    print(f"AUDIT Verdict: {result.get('audit_critique')[:100]}...")
    print(f"Critique Passed: {result.get('critique_passed')}")

    print("\n--- [HITL LANE ASSIGNMENT] ---")
    pending = result.get("actions_for_approval", [])
    approved = result.get("approved_actions", [])
    
    print(f"🟢 AUTO-APPROVED (Green): {len(approved)}")
    for a in approved:
        print(f"  - {a.get('action_type')} ({a.get('store_id')})")

    print(f"🟡/🔴 NEEDS APPROVAL (Yellow/Red): {len(pending)}")
    for a in pending:
        print(f"  - {a.get('action_type')} [{a.get('lane').upper()}] ({a.get('store_id')})")

    print("\n--- [EXECUTION LAYER] ---")
    executed = result.get("executed_actions", [])
    print(f"🚀 Actions Executed: {len(executed)}")
    for e in executed:
        print(f"  - {e.get('action_type')} status: {e.get('status')}")

    print("\n--- [MOCK VERIFICATION SUCCESSFUL] ---")


if __name__ == "__main__":
    # Ensure config allows mock run even without API keys
    os.environ["GOOGLE_API_KEY"] = "MOCK_KEY"
    asyncio.run(run_mock_verification())
