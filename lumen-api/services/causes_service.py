import json
from pathlib import Path

_causes_path = Path(__file__).parent.parent / "causes.json"


def _normalize_country(name: str) -> str:
    return name.strip().casefold()


def _load_causes_lookup() -> dict:
    try:
        with open(_causes_path) as f:
            countries = json.load(f)["countries"]
        return {
            _normalize_country(entry["country"]): entry
            for entry in countries
            if entry.get("country")
        }
    except Exception:
        return {}


_CAUSES_LOOKUP = _load_causes_lookup()


def lookup_cause(country: str) -> dict | None:
    if not country:
        return None
    return _CAUSES_LOOKUP.get(_normalize_country(country))
