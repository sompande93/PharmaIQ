"""
Signal Collector — Gathers all input signals from MCP servers to seed the pipeline.
This is the first node in the LangGraph — it populates the shared state.
"""

from mcp_servers.iot_fridge import iot_fridge_mcp
from mcp_servers.health_data import health_data_mcp
from mcp_servers.weather import weather_mcp
from mcp_servers.hrms_roster import hrms_roster_mcp
from mcp_servers.erp_inventory import erp_inventory_mcp
from datetime import datetime, timedelta


def collect_signals(state: dict) -> dict:
    """
    Collect node: gathers all MCP signals into the shared state.
    """
    print(f"[{datetime.now().isoformat()}] --- Starting Signal Collection ---")
    
    # 1. Fridge breach alerts
    print(f"[{datetime.now().isoformat()}] Fetching Fridge Breaches...")
    try:
        fridge_breaches = iot_fridge_mcp.get_breach_alerts()
        print(f"[{datetime.now().isoformat()}] Received {len(fridge_breaches)} fridge breaches")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] ERROR fetching fridge breaches: {e}")
        fridge_breaches = []
    
    # 2. Disease outbreaks
    print(f"[{datetime.now().isoformat()}] Fetching Disease Clusters...")
    try:
        disease_clusters = health_data_mcp.fetch_active_clusters()
        print(f"[{datetime.now().isoformat()}] Received {len(disease_clusters)} disease clusters")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] ERROR fetching disease clusters: {e}")
        disease_clusters = []
    
    # 3. Weather alerts
    print(f"[{datetime.now().isoformat()}] Fetching Weather Alerts...")
    weather_alerts = []
    outbreak_regions = set()
    for cluster in disease_clusters:
        region = cluster.get("region")
        if region:
            outbreak_regions.add(region)
    for region in outbreak_regions:
        try:
            print(f"[{datetime.now().isoformat()}] Fetching weather for {region}...")
            monsoon = weather_mcp.get_monsoon_alert(region)
            if not monsoon.get("error"):
                weather_alerts.append(monsoon)
        except Exception as e:
            print(f"[{datetime.now().isoformat()}] ERROR fetching weather for {region}: {e}")
            
    # 4. Staffing gaps
    print(f"[{datetime.now().isoformat()}] Fetching Staffing Gaps...")
    shift_gaps = []
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    tomorrow_str = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    
    for store_id in ["STORE_142", "STORE_088", "STORE_201", "STORE_055"]:
        for d in [today_str, tomorrow_str]:
            try:
                print(f"[{datetime.now().isoformat()}] Fetching gaps for {store_id} on {d}...")
                gaps = hrms_roster_mcp.get_shift_gaps(store_id, d)
                if gaps.get("has_compliance_risk"):
                    shift_gaps.append(gaps)
            except Exception as e:
                print(f"[{datetime.now().isoformat()}] ERROR fetching gaps for {store_id} on {d}: {e}")
                
    # 5. Expiring stock
    print(f"[{datetime.now().isoformat()}] Fetching Expiring Stock...")
    try:
        expiring_stock = erp_inventory_mcp.get_expiring_stock(90)
        print(f"[{datetime.now().isoformat()}] Received {len(expiring_stock)} expiring stock items")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] ERROR fetching expiring stock: {e}")
        expiring_stock = []
        
    print(f"[{datetime.now().isoformat()}] --- Signal Collection Complete ---")
    
    return {
        "fridge_breaches": fridge_breaches,
        "disease_clusters": disease_clusters,
        "weather_alerts": weather_alerts,
        "shift_gaps": shift_gaps,
        "expiring_stock": expiring_stock,
        "current_node": "signals_collected",
        "started_at": datetime.now().isoformat(),
    }
