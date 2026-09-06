#!/usr/bin/env python3
import subprocess
import os
import sys
import time
import curses
import threading
from pathlib import Path
import httpx
from dotenv import load_dotenv
from aengine import AnimationEngine
from logo import get_logo_text

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

WEBSITE_URL = os.getenv("WEBSITE_URL", "http://localhost:8000")
DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")


def main(stdscr):
    engine = None

    try:
        engine = AnimationEngine(stdscr)

        if DEBUG:
            try:
                for cmd in [["fastfetch", "--logo", "none"], ["neofetch", "--stdout"], ["uname", "-a"]]:
                    try:
                        result = subprocess.run(cmd, capture_output=True, text=True)
                        if result.returncode == 0 and result.stdout.strip():
                            for line in result.stdout.splitlines():
                                if line.strip():
                                    engine.log(line)
                            break
                    except FileNotFoundError:
                        continue
            except Exception:
                pass

            engine.sleep(3)

        engine.clear_logs()
        engine.set_ascii(get_logo_text())
        engine.ensure_healthy()

        ready_event = threading.Event()

        def wait_for_website():
            try:
                engine.log(f"ℹ Probing backend at {WEBSITE_URL}...")
                start_time = time.time()
                timeout = 60

                while time.time() - start_time < timeout and not ready_event.is_set():
                    try:
                        resp = httpx.get(WEBSITE_URL, timeout=2)
                        if resp.status_code < 400:
                            engine.log(
                                f"✔ Backend ready ({WEBSITE_URL} status {resp.status_code})"
                            )
                            ready_event.set()
                            return
                    except (httpx.RequestError, ConnectionError):
                        pass

                    time.sleep(0.5)

                if not ready_event.is_set():
                    engine.log(
                        f"⚠ Timeout waiting for {WEBSITE_URL} (continuing anyway)"
                    )
                    ready_event.set()
            except Exception as exc:
                engine.log(f"✖ Startup check failed: {exc}")
                ready_event.set()

        threading.Thread(target=wait_for_website, daemon=True).start()

        while not ready_event.is_set():
            engine.animate_ascii_move(duration=3, direction="up")
            if ready_event.is_set():
                break
            engine.sleep(1)
            if ready_event.is_set():
                break
            engine.animate_ascii_move(duration=3, direction="out")

        engine.ensure_healthy()
        engine.log("❯ Switching to tty2...")
        subprocess.run(["sudo", "chvt", "2"])

        env = os.environ.copy()
        env.pop("WAYLAND_DISPLAY", None)
        env.update(
            {
                "WLR_BACKENDS": "drm",
                "XDG_RUNTIME_DIR": f"/run/user/{os.getuid()}",
                "LIBSEAT_BACKEND": "seatd",
                "WLR_LIBINPUT_NO_DEVICES": "1",
                "WLR_NO_HARDWARE_CURSORS": "1",
                "XDG_SESSION_TYPE": "wayland",
                "XDG_CURRENT_DESKTOP": "sway",
            }
        )

        # Start Sway
        engine.log("❯ Launching Sway kiosk...")
        try:
            subprocess.run("sway -d > ~/sway.log 2>&1", env=env, check=True, shell=True)
        except Exception as e:
            engine.log(f"✖ Failed to start Sway: {e}")
            engine.sleep(10)
    finally:
        if engine is not None:
            engine.stop()


if __name__ == "__main__":
    try:
        curses.wrapper(lambda stdscr: main(stdscr))
    except Exception as exc:
        print(f"Boot failed: {exc}")
        time.sleep(10)
