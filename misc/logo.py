import subprocess
from pathlib import Path


def get_commit_hash(short: bool = True) -> str:
    try:
        repo_dir = Path(__file__).resolve().parent.parent
        res = subprocess.run(
            ["git", "rev-parse", "--short" if short else "HEAD"],
            cwd=repo_dir,
            capture_output=True,
            text=True,
            timeout=2,
        )
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception:
        pass
    return "dev"


def get_logo_text() -> str:
    commit_id = get_commit_hash(short=True)
    spaced_commit = " ".join(commit_id)
    return f"""
███████╗ ██████╗  ██╗   ██╗ ██████╗   ██████╗   █████╗  ██████╗  ██████╗ 
██╔════╝ ██╔══██╗ ██║   ██║ ██╔══██╗ ██╔═══██╗ ██╔══██╗ ██╔══██╗ ██╔══██╗
█████╗   ██║  ██║ ██║   ██║ ██████╔╝ ██║   ██║ ███████║ ██████╔╝ ██║  ██║
██╔══╝   ██║  ██║ ██║   ██║ ██╔══██╗ ██║   ██║ ██╔══██║ ██╔══██╗ ██║  ██║
███████╗ ██████╔╝ ╚██████╔╝ ██████╔╝ ╚██████╔╝ ██║  ██║ ██║  ██║ ██████╔╝
╚══════╝ ╚═════╝   ╚═════╝  ╚═════╝   ╚═════╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═════╝ 
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
C o m m i t :   {spaced_commit} ,   E n t e r p r i s e   v e r s i o n   f o r   Z S   S o k o l n i c e
"""


text = get_logo_text()