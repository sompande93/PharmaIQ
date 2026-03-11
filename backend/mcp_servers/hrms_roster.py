"""
HRMS Roster MCP Server
Manages pharmacist shift schedules and compliance checks.
Tools: get_current_staff, get_shift_gaps, assign_shift, flag_compliance_gap
"""

from .base import BaseMCPServer
from typing import Optional
from datetime import datetime


class HRMSRosterMCP(BaseMCPServer):
    def __init__(self):
        super().__init__("staff_roster.json", "staff")

    def get_current_staff(self, store_id: str, date: Optional[str] = None) -> list[dict]:
        """Get all staff assigned to a store on a given date."""
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        staff = []
        for person in self.data:
            if person["store_id"] == store_id:
                for shift in person.get("shifts", []):
                    if shift["day"] == date:
                        staff.append({
                            "staff_id": person["staff_id"],
                            "name": person["name"],
                            "role": person["role"],
                            "is_registered_pharmacist": person["is_registered_pharmacist"],
                            "shift_start": shift["start"],
                            "shift_end": shift["end"]
                        })
        return staff

    def get_shift_gaps(self, store_id: str, date: Optional[str] = None) -> list[dict]:
        """
        Find time windows where no registered pharmacist is on duty.
        This is a Schedule H compliance violation risk.
        """
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")

        # Get all pharmacist shifts for this store on this date
        pharmacist_shifts = []
        for person in self.data:
            if person["store_id"] == store_id and person["is_registered_pharmacist"]:
                for shift in person.get("shifts", []):
                    if shift["day"] == date:
                        pharmacist_shifts.append({
                            "start": int(shift["start"].split(":")[0]),
                            "end": int(shift["end"].split(":")[0]),
                            "name": person["name"]
                        })

        # Check operating hours (7AM to 10PM) for uncovered windows
        gaps = []
        operating_start, operating_end = 7, 22
        for hour in range(operating_start, operating_end):
            covered = any(s["start"] <= hour < s["end"] for s in pharmacist_shifts)
            if not covered:
                # Check if this is a peak hour (higher risk)
                is_peak = any(start <= hour < end for start, end in [(7, 9), (17, 19)])
                gaps.append({
                    "hour": f"{hour:02d}:00",
                    "is_peak_hour": is_peak,
                    "risk_level": "critical" if is_peak else "high",
                    "violation": "Schedule H - No registered pharmacist on duty"
                })

        return {
            "store_id": store_id,
            "date": date,
            "gaps": gaps,
            "total_gap_hours": len(gaps),
            "has_compliance_risk": len(gaps) > 0
        }

    def assign_shift(self, staff_id: str, date: str, start: str, end: str) -> dict:
        """Assign or update a shift for a staff member."""
        staff = self.data
        for person in staff:
            if person["staff_id"] == staff_id:
                new_shift = {"day": date, "start": start, "end": end}
                person["shifts"].append(new_shift)
                self._save_data(staff)
                return {
                    "success": True,
                    "action": "shift_assigned",
                    "staff_id": staff_id,
                    "name": person["name"],
                    "date": date,
                    "start": start,
                    "end": end,
                    "timestamp": datetime.now().isoformat()
                }
        return {"success": False, "error": f"Staff {staff_id} not found"}

    def get_available_pharmacists(self, date: str, hour: int) -> list[dict]:
        """Find registered pharmacists not assigned to any shift at the given hour."""
        available = []
        for person in self.data:
            if not person["is_registered_pharmacist"]:
                continue
            is_busy = False
            for shift in person.get("shifts", []):
                if shift["day"] == date:
                    start = int(shift["start"].split(":")[0])
                    end = int(shift["end"].split(":")[0])
                    if start <= hour < end:
                        is_busy = True
                        break
            if not is_busy:
                available.append({
                    "staff_id": person["staff_id"],
                    "name": person["name"],
                    "store_id": person["store_id"]
                })
        return available


# Singleton instance
hrms_roster_mcp = HRMSRosterMCP()
