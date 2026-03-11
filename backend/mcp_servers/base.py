"""
Base MCP Server — All MCP servers inherit from this.
Handles JSON data loading and provides a standard interface.
"""

import json
import os
from typing import Any


class BaseMCPServer:
    """Base class for all PharmaIQ MCP servers."""

    def __init__(self, data_file: str, data_key: str = None):
        """
        Args:
            data_file: Filename inside the data/ directory (e.g., 'fridges.json')
            data_key: Optional top-level key in JSON (e.g., 'fridges')
        """
        self.data_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "data", data_file
        )
        self.data_key = data_key
        self._data = None

    def _load_data(self) -> Any:
        """Load and cache data from JSON file. Reloads on every call for demo flexibility."""
        with open(self.data_path, "r") as f:
            raw = json.load(f)
        if self.data_key:
            return raw[self.data_key]
        return raw

    @property
    def data(self) -> Any:
        """Always reload from disk so manual edits during demo are picked up instantly."""
        return self._load_data()

    def _save_data(self, updated_data: Any):
        """Write updated data back to JSON file (for actions like quarantine)."""
        if self.data_key:
            with open(self.data_path, "r") as f:
                raw = json.load(f)
            raw[self.data_key] = updated_data
        else:
            raw = updated_data
        with open(self.data_path, "w") as f:
            json.dump(raw, f, indent=2, default=str)
