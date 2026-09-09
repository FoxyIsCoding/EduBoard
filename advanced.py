import logging
import os
import secrets
import shutil
import subprocess
import time
from pathlib import Path
from typing import Dict, Optional

from fastapi import HTTPException

logger = logging.getLogger("EduBoard.Advanced")

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"
FRONTEND_DIR = BASE_DIR / "frontend"
SERVICE_NAME = os.getenv("EDUBOARD_SERVICE", "EduBoard.service")

SESSION_TTL_SECONDS = 30 * 60

# token -> {"expires": ts, "password": str}
# The kiosk sudo password is kept in-memory ONLY (never written to disk) and
# expires after SESSION_TTL_SECONDS. A fresh login is required afterwards.
_SESSIONS: Dict[str, Dict] = {}

# Which .env keys are secrets and must never be echoed back to the frontend.
_SECRET_KEYS = ("PASSWORD", "ADMIN_PIN", "TOKEN", "TOKEN_AUTH", "AUTHKEY", "SECRET")


def _run_sudo(password: str, command: str, timeout: int = 120) -> Dict:
    """Run `sudo -S` command capturing combined output. Returns dict(ok, code, output)."""
    if not password:
        return {"ok": False, "code": -1, "output": "Chybí sudo heslo."}
    try:
        proc = subprocess.run(
            f"sudo -S -p '' {command}",
            shell=True,
            input=password + "\n",
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        return {"ok": proc.returncode == 0, "code": proc.returncode, "output": (proc.stdout or "") + (proc.stderr or "")}
    except subprocess.TimeoutExpired:
        return {"ok": False, "code": -1, "output": "Příkaz přesáhl časový limit."}
    except Exception as exc:
        return {"ok": False, "code": -1, "output": f"Chyba: {exc}"}


def _run(command: str, timeout: int = 120, cwd: Optional[Path] = None) -> Dict:
    """Run a plain (non-sudo) command. Used for git/npm operations owned by kiosk user."""
    try:
        proc = subprocess.run(
            command,
            shell=True,
            text=True,
            capture_output=True,
            timeout=timeout,
            cwd=str(cwd) if cwd else None,
        )
        return {"ok": proc.returncode == 0, "code": proc.returncode, "output": (proc.stdout or "") + (proc.stderr or "")}
    except subprocess.TimeoutExpired:
        return {"ok": False, "code": -1, "output": "Příkaz přesáhl časový limit."}
    except Exception as exc:
        return {"ok": False, "code": -1, "output": f"Chyba: {exc}"}


def _schedule_sudo(password: str, command: str, delay: float = 1.5) -> None:
    """Run a sudo command shortly in a fully detached background process.

    Used for service restart/stop so the HTTP response is sent before the
    EduBoard server process is killed."""
    try:
        proc = subprocess.Popen(
            f"sudo -S -p '' sh -c 'sleep {delay}; {command}'",
            shell=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        proc.stdin.write(password.encode() + b"\n")
        proc.stdin.flush()
        proc.stdin.close()
    except Exception as exc:
        logger.warning(f"schedule_sudo failed: {exc}")


def _load_sessions_password(token: str) -> str:
    session = _SESSIONS.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="Neplatné nebo vypršelé sudo přihlášení.")
    if time.time() > session["expires"]:
        _SESSIONS.pop(token, None)
        raise HTTPException(status_code=401, detail="Přihlášení vypršelo, přihlaste se znovu.")
    return session["password"]


def verify_sudo_password(password: str) -> bool:
    result = _run_sudo(password, "true", timeout=10)
    return result["ok"]


def create_session(password: str) -> str:
    if not verify_sudo_password(password):
        raise HTTPException(status_code=401, detail="Chybné sudo heslo kiosk uživatele.")
    token = secrets.token_urlsafe(24)
    _SESSIONS[token] = {"expires": time.time() + SESSION_TTL_SECONDS, "password": password}
    return token


def drop_session(token: str) -> None:
    _SESSIONS.pop(token, None)


def session_expires(token: str) -> Optional[float]:
    """Return the session expiry timestamp, or None if missing/expired."""
    session = _SESSIONS.get(token)
    if not session:
        return None
    if time.time() > session["expires"]:
        _SESSIONS.pop(token, None)
        return None
    return session["expires"]


def require_token(token: Optional[str]) -> str:
    if not token:
        raise HTTPException(status_code=401, detail="Chybí sudo přihlášení.")
    return _load_sessions_password(token)


def _read_os_release() -> dict:
    data = {}
    try:
        for line in Path("/etc/os-release").read_text().splitlines():
            if "=" in line:
                key, _, value = line.partition("=")
                data[key] = value.strip().strip('"')
    except Exception:
        pass
    return {"id": data.get("ID", "linux"), "pretty": data.get("PRETTY_NAME", "Linux")}


def _read_meminfo() -> dict:
    mem = {}
    try:
        lines = Path("/proc/meminfo").read_text().splitlines()
        for line in lines:
            if line.startswith("MemTotal:"):
                mem["total_kb"] = int(line.split()[1])
            elif line.startswith("MemAvailable:"):
                mem["available_kb"] = int(line.split()[1])
    except Exception:
        pass
    return mem


def _read_cpu_temp() -> Optional[float]:
    for zone in sorted(Path("/sys/class/thermal").glob("thermal_zone*")):
        try:
            raw = int((zone / "temp").read_text().strip())
            return round(raw / 1000.0, 1)
        except Exception:
            continue
    return None


def system_status() -> dict:
    uptime = None
    try:
        uptime = float(Path("/proc/uptime").read_text().split()[0])
    except Exception:
        pass

    mem = _read_meminfo()
    osinfo = _read_os_release()

    ips = []
    try:
        out = subprocess.run("hostname -I", shell=True, text=True, capture_output=True, timeout=5)
        ips = out.stdout.strip().split()
    except Exception:
        pass

    disk = None
    try:
        out = subprocess.run(f"df -h {BASE_DIR}", shell=True, text=True, capture_output=True, timeout=5)
        if out.returncode == 0:
            parts = out.stdout.strip().splitlines()
            if len(parts) >= 2:
                cols = parts[1].split()
                disk = {"size": cols[1], "used": cols[2], "avail": cols[3], "pct": cols[4]}
    except Exception:
        pass

    load = None
    try:
        load = Path("/proc/loadavg").read_text().split()[:3]
    except Exception:
        pass

    git = git_status()

    return {
        "hostname": os.uname().nodename,
        "os": osinfo["pretty"] or osinfo["id"],
        "kernel": os.uname().release,
        "uptime_seconds": uptime,
        "cpu_temp": _read_cpu_temp(),
        "mem": {"total_kb": mem.get("total_kb"), "available_kb": mem.get("available_kb")},
        "disk": disk,
        "loadavg": load,
        "ips": ips,
        "service": SERVICE_NAME,
        "git": git,
        "audit": git.get("branch") or "",
        "region": "local-advanced",
    }


def git_status() -> dict:
    branch = "n/a"
    head = "n/a"
    upstream = "n/a"
    ahead = 0
    behind = 0
    dirty = False
    via = "n/a"

    r = _run("git rev-parse --abbrev-ref HEAD", timeout=10, cwd=BASE_DIR)
    if r["ok"]:
        branch = r["output"].strip() or "detached"

    r = _run("git rev-parse --short HEAD", timeout=10, cwd=BASE_DIR)
    if r["ok"]:
        head = r["output"].strip()

    r = _run("git status --porcelain", timeout=10, cwd=BASE_DIR)
    if r["ok"]:
        dirty = bool(r["output"].strip())

    r = _run("git rev-parse --abbrev-ref @{upstream}", timeout=10, cwd=BASE_DIR)
    if r["ok"]:
        upstream = r["output"].strip()

    r = _run("git rev-list --count @{upstream}..HEAD", timeout=10, cwd=BASE_DIR)
    if r["ok"]:
        try:
            ahead = int(r["output"].strip() or 0)
        except ValueError:
            ahead = 0

    r = _run("git rev-list --count HEAD..@{upstream}", timeout=10, cwd=BASE_DIR)
    if r["ok"]:
        try:
            behind = int(r["output"].strip() or 0)
        except ValueError:
            behind = 0

    r = _run("git remote get-url origin", timeout=10, cwd=BASE_DIR)
    if r["ok"]:
        via = r["output"].strip()

    return {
        "branch": branch,
        "head": head,
        "upstream": upstream,
        "ahead": ahead,
        "behind": behind,
        "dirty": dirty,
        "origin": via,
    }


def list_branches() -> dict:
    status = git_status()
    local = []
    try:
        r = _run("git branch --format=%(refname:short)", timeout=10, cwd=BASE_DIR)
        if r["ok"]:
            local = [b for b in r["output"].splitlines() if b.strip()]
    except Exception:
        pass

    remote = []
    try:
        r = _run("git branch -r --format=%(refname:short)", timeout=10, cwd=BASE_DIR)
        if r["ok"]:
            remote = [b for b in r["output"].splitlines() if b.strip() and not b.endswith("/HEAD")]
    except Exception:
        pass

    try:
        r = _run("git log --oneline -15", timeout=10, cwd=BASE_DIR)
        commits = [line for line in r["output"].splitlines() if line.strip()] if r["ok"] else []
    except Exception:
        commits = []

    return {"status": status, "local": local, "remote": remote, "commits": commits}


def run_update() -> dict:
    status = git_status()
    branch = status["branch"]
    log = []

    if status["dirty"]:
        # Stash local changes so the pull does not fail, then pop afterwards.
        r = _run("git stash push -m 'advanced-panel auto-stash'", timeout=30, cwd=BASE_DIR)
        log.append(("stash local changes", r["code"], r["output"]))

    r = _run("git fetch origin", timeout=120, cwd=BASE_DIR)
    log.append(("git fetch origin", r["code"], r["output"]))

    r = _run(f"git pull --ff-only origin {branch}", timeout=120, cwd=BASE_DIR)
    log.append((f"git pull origin {branch}", r["code"], r["output"]))

    r = _run(
        "git stash pop",
        timeout=30,
        cwd=BASE_DIR,
    )
    if r["code"] == 0:
        log.append(("restore local changes", 0, "stash popped"))

    build = _build_frontend()
    log.append(("frontend build", build["code"], build["output"]))

    ok = all(entry[1] == 0 for entry in log)

    return {"status": git_status(), "steps": log, "ok": ok, "buildOutput": build["output"]}


def switch_branch(branch: str) -> dict:
    log = []

    r = _run("git stash push -m 'advanced-panel auto-stash'", timeout=30, cwd=BASE_DIR)
    log.append(("stash local changes", r["code"], r["output"]))

    r = _run(f"git checkout {branch} || git switch {branch}", timeout=30, cwd=BASE_DIR)
    log.append((f"git checkout {branch}", r["code"], r["output"]))

    r = _run("git fetch origin", timeout=120, cwd=BASE_DIR)
    log.append(("git fetch origin", r["code"], r["output"]))

    r = _run(f"git pull --ff-only origin {branch}", timeout=120, cwd=BASE_DIR)
    log.append((f"git pull origin {branch}", r["code"], r["output"]))

    r = _run("git stash pop", timeout=30, cwd=BASE_DIR)
    if r["code"] == 0:
        log.append(("restore local changes", 0, "stash popped"))

    build = _build_frontend()
    log.append(("frontend build", build["code"], build["output"]))

    ok = all(entry[1] == 0 for entry in log)

    return {"status": git_status(), "steps": log, "ok": ok, "buildOutput": build["output"]}


def _build_frontend() -> dict:
    if not FRONTEND_DIR.is_dir():
        return {"ok": False, "code": -1, "output": "frontend/ adresář nenalezen."}
    node_modules = FRONTEND_DIR / "node_modules"
    install_cmd = "npm install --no-audit --no-fund" if node_modules.is_dir() else "npm ci --no-audit --no-fund"
    r = _run(f"cd frontend && {install_cmd} && npm run build", timeout=600, cwd=BASE_DIR)
    return r


def service_control(action: str, password: str) -> dict:
    action = action.strip().lower()
    if action not in ("restart", "stop", "start", "status"):
        raise HTTPException(status_code=400, detail="Akce musí být restart | stop | start | status")

    verify = verify_sudo_password(password)
    if not verify:
        raise HTTPException(status_code=401, detail="Chybné sudo heslo kiosk uživatele.")

    if action == "status":
        r = _run_sudo(password, f"systemctl is-active {SERVICE_NAME} ; systemctl show {SERVICE_NAME} -p ActiveState -p SubState -p ExecMainStartTimestamp", timeout=15)
        return {"ok": r["ok"], "action": action, "output": r["output"]}

    # Detached: response returns before this process is killed by the restart/stop.
    _schedule_sudo(password, f"systemctl {action} {SERVICE_NAME}", delay=0.5)
    return {"ok": True, "action": action, "output": f"systemctl {action} {SERVICE_NAME} naplánováno."}


def read_logs(lines: int = 200, password: str = None) -> dict:
    used = f"journalctl -u {SERVICE_NAME} --no-pager -n {int(lines)}"
    if password:
        r = _run_sudo(password, used, timeout=20)
    else:
        r = _run(used, timeout=20)
    return r


def read_env(masked_password: str) -> dict:
    if not ENV_FILE.is_file():
        return {"content": "", "keys": []}

    lines = []
    keys = []
    try:
        raw = ENV_FILE.read_text(encoding="utf-8")
        for line in raw.splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in line:
                lines.append(line)
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            keys.append(key)
            if key.upper() in _SECRET_KEYS:
                lines.append(f"{key}={_mask(masked_password)}" if value.strip() else f"{key}=")
            else:
                lines.append(line)
    except Exception as exc:
        return {"content": "", "keys": [], "error": str(exc)}
    return {"content": "\n".join(lines), "keys": keys}


def _mask(masked_password: str) -> str:
    sentinel = "••••••"
    return f'"{sentinel}"'


def is_secret_key(key: str) -> bool:
    return key.strip().upper() in _SECRET_KEYS


def write_env(content: str) -> dict:
    """Write .env content back to disk. Secret values that still contain the
    mask sentinel are left untouched (preserved from the current file)."""
    sentinel = "••••••"
    preserved = {}
    try:
        if ENV_FILE.is_file():
            for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
                if "=" in line and not line.strip().startswith("#"):
                    key, _, value = line.partition("=")
                    preserved[key.strip()] = value.strip()
    except Exception:
        preserved = {}

    out_lines = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in line:
            out_lines.append(line)
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        val = value.strip().strip('"').strip()
        if key in _SECRET_KEYS and (val == sentinel or not val):
            out_lines.append(f"{key}={preserved.get(key, '')}")
        else:
            out_lines.append(line)

    try:
        ENV_FILE.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
    except Exception as exc:
        return {"ok": False, "output": str(exc)}
    return {"ok": True, "output": ".env uložen."}


def sync_clock(password: str) -> dict:
    log = []
    steps = [
        ("enable NTP", "timedatectl set-ntp true"),
        ("restart timesyncd", "systemctl restart systemd-timesyncd"),
        ("sync hardware clock", "hwclock --systohc"),
    ]
    for label, cmd in steps:
        r = _run_sudo(password, cmd, timeout=20)
        log.append({"step": label, "code": r["code"], "output": r["output"]})
    ok = all(entry["code"] == 0 for entry in log)
    return {"ok": ok, "steps": log}