import json
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BLOCKED_FILE = BASE_DIR / "data" / "blocked_classes.json"


def _env_seed() -> set:
    """Seed the blocked set from the EDUBOARD_BLOCKED_CLASSES env var.

    Pseudo-classes like `ppo` are always blocked unless the admin explicitly
    unblocks them via the panel (which then persists to the data file and
    takes precedence over the env seed).
    """
    seed = {"ppo"}
    extra = os.getenv("EDUBOARD_BLOCKED_CLASSES", "")
    for item in extra.split(","):
        item = item.strip().lower()
        if item:
            seed.add(item)
    return seed


def _normalize(raw) -> set:
    out = set()
    for item in raw or []:
        item = str(item).strip().lower()
        if item:
            out.add(item)
    return out


def get_blocked() -> list:
    """Return the sorted list of blocked class IDs.

    The persisted file (created/changed from the admin panel) is the source of
    truth. Until the admin touches it, the env var seed is used so nothing
    changes behaviour on existing installs.
    """
    if BLOCKED_FILE.exists():
        try:
            with open(BLOCKED_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return sorted(_normalize(data if isinstance(data, list) else []))
        except Exception:
            pass
    return sorted(_env_seed())


def is_blocked(class_id) -> bool:
    return str(class_id or "").strip().lower() in set(get_blocked())


def save_blocked(ids) -> list:
    normalized = sorted(_normalize(ids))
    BLOCKED_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(BLOCKED_FILE, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)
    return normalized


def toggle_blocked(class_id) -> list:
    """Add or remove a class ID from the blocked set. Returns the new list."""
    lowered = str(class_id or "").strip().lower()
    current = set(get_blocked())
    if not lowered:
        return sorted(current)
    if lowered in current:
        current.discard(lowered)
    else:
        current.add(lowered)
    return save_blocked(current)