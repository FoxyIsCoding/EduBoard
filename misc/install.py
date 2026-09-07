import subprocess
import os
import shutil
import time
import traceback
from pathlib import Path

# Ensure curses works properly on all tty consoles without manual export
if os.environ.get("TERM") in (None, "", "dumb", "linux"):
    os.environ["TERM"] = "xterm-256color"

from aengine import AnimationEngine
from logo import get_logo_text
import curses
import pwd

INSTALL_ERROR_LOG = os.path.expanduser("~/eduboard-install.log")

# System locale chosen during the wizard; commands inherit this so bash
# doesn't warn "LC_ALL: cannot change locale (en_US.UTF-8)" when the locale
# isn't generated. 'C.UTF-8' is always available on modern Debian/Ubuntu.
SYSTEM_LOCALE = os.environ.get("LC_ALL") or os.environ.get("LANG") or "C.UTF-8"


def write_install_error(context, exc):
    try:
        with open(INSTALL_ERROR_LOG, "a", encoding="utf-8") as handle:
            handle.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {context}\n")
            handle.write(
                "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
            )
            handle.write("\n")
        return INSTALL_ERROR_LOG
    except OSError:
        return None


def run_command(command, user=None, cwd=None, log_callback=None):
    env_vars = {
        "DEBIAN_FRONTEND": "noninteractive",
        "TERM": "xterm-256color",
        "LANG": SYSTEM_LOCALE,
        "LC_ALL": SYSTEM_LOCALE,
        "WAYLAND_DISPLAY": "wayland-0",
    }
    custom_env = os.environ.copy()
    custom_env.update(env_vars)
    directory = cwd if cwd else "."

    is_sudo = command.startswith("sudo") or " sudo " in command
    if user:
        escaped_command = command.replace("'", "'\\''")
        full_command = f"sudo -E -u {user} bash -c 'cd \"{directory}\" && {escaped_command}'"
    elif is_sudo:
        # Find the actual sudo token (there may be a piped command before it)
        # and insert -E only if the sudo invocation doesn't already use it.
        new_parts = []
        parts = command.split(" ")
        i = 0
        while i < len(parts):
            part = parts[i]
            if part == "sudo":
                j = i + 1
                if j < len(parts) and parts[j] == "-E":
                    new_parts.append(part)
                else:
                    new_parts.append("sudo -E")
            else:
                new_parts.append(part)
            i += 1
        full_command = " ".join(new_parts)
    else:
        exports = " ".join(f"{k}={v}" for k, v in env_vars.items())
        full_command = f"{exports} {command}"

    process = subprocess.run(
        full_command,
        shell=True,
        executable="/bin/bash",
        env=custom_env,
        capture_output=True,
        text=True,
    )

    if process.returncode != 0:
        error_msg = process.stderr.strip() if process.stderr else "Unknown error"
        if log_callback:
            log_callback(f"✗ Command failed: {error_msg}")
        raise subprocess.CalledProcessError(
            process.returncode,
            full_command,
            output=process.stdout,
            stderr=process.stderr,
        )

    if log_callback and process.stdout:
        output = process.stdout.strip()
        if output and len(output) < 200:
            log_callback(f" {output}")
    return process


def write_file(path, content, user=None, mode=0o644):
    path = Path(path)
    run_command(f"sudo mkdir -p {path.parent}")
    temp_path = f"/tmp/{path.name}.tmp"
    with open(temp_path, "w") as f:
        f.write(content)
    run_command(f"sudo mv {temp_path} {path}")
    if user:
        run_command(f"sudo chown {user}:{user} {path}")
    run_command(f"sudo chmod {mode:o} {path}")


def set_hostname(hostname, log_callback=None):
    try:
        if log_callback:
            log_callback(f"❯ Setting hostname to '{hostname}'")
        run_command(f"sudo hostnamectl set-hostname {hostname}")
        write_file("/etc/hostname", f"{hostname}\n")
        run_command(f"sudo sed -i 's/127.0.1.1.*/127.0.1.1\t{hostname}/g' /etc/hosts")
        if log_callback:
            log_callback(f"✔ Hostname set successfully")
        return True
    except Exception as e:
        if log_callback:
            log_callback(f"✖ Failed to set hostname: {str(e)}")
        return False


def repo_is_git(path, user):
    """Check whether path is a valid git work tree, as the given user.
    The installer may run as a non-root user, so os.path.exists() can't see
    a user-owned (700) directory — the check must run in the user's context."""
    try:
        run_command(f"sudo -u {user} git -C {path} rev-parse --is-inside-work-tree")
        return True
    except Exception:
        return False


def install_tailscale(auth_token, log_callback=None):
    """Install and authenticate Tailscale if an auth token is supplied"""
    if not auth_token or auth_token.strip() == "":
        if log_callback:
            log_callback(
                "ℹ No Tailscale auth token provided. Skipping Tailscale installation."
            )
        return False

    try:
        log_callback("❯ Installing Tailscale...")
        # Install Tailscale using official script
        run_command(
            "curl -fsSL https://tailscale.com/install.sh | sh",
            log_callback=log_callback,
        )

        # Enable and start the daemon
        run_command("sudo systemctl enable --now tailscaled", log_callback=log_callback)

        # Authenticate
        log_callback("❯ Authenticating Tailscale with provided auth key...")
        run_command(
            f"sudo tailscale up --authkey={auth_token.strip()} "
            f"--accept-routes --accept-dns=false --advertise-exit-node=false",
            log_callback=log_callback,
        )

        log_callback("✔ Tailscale installed and authenticated successfully!")
        return True
    except Exception as e:
        if log_callback:
            log_callback(f"✖ Tailscale setup failed: {str(e)}")
        return False


def configure_screen_idle(log_callback=None):
    if log_callback:
        log_callback("❯ Configuring display persistence (disabling system/kernel idle)...")

    # 1. Add consoleblank=0 to kernel cmdline (Raspberry Pi Ubuntu)
    for cmdline_path in ["/boot/firmware/cmdline.txt", "/boot/cmdline.txt"]:
        if os.path.exists(cmdline_path):
            try:
                with open(cmdline_path, "r", encoding="utf-8") as f:
                    content = f.read()
                if "consoleblank=0" not in content:
                    stripped = content.strip()
                    new_content = f"{stripped} consoleblank=0\n"
                    write_file(cmdline_path, new_content)
                    if log_callback:
                        log_callback(f"✔ Added consoleblank=0 to {cmdline_path}")
                else:
                    if log_callback:
                        log_callback(f"ℹ {cmdline_path} already has consoleblank=0")
            except Exception as e:
                if log_callback:
                    log_callback(f"⚠ Could not update {cmdline_path}: {e}")
            break

    # 2. Service to disable VT console blanking on boot
    vt_blank_service = """[Unit]
Description=Disable VT Console Blanking
After=local-fs.target

[Service]
Type=oneshot
ExecStart=/usr/bin/setterm -blank 0 -powerdown 0
StandardOutput=null
StandardError=null
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
"""
    write_file("/etc/systemd/system/disable-console-blanking.service", vt_blank_service)
    run_command(
        "sudo systemctl enable disable-console-blanking.service",
        log_callback=log_callback,
    )

    # 3. Mask sleep/suspend so Pi never enters low-power sleep
    run_command(
        "sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target",
        log_callback=log_callback,
    )
    if log_callback:
        log_callback("✔ Display persistence configured (idle/sleep disabled)")


def main(stdscr):
    # --- Animation Sequence ---
    engine = AnimationEngine(stdscr)
    engine.set_ascii(get_logo_text())
    engine.animate_ascii_move(duration=3, direction="up")
    engine.sleep(1)
    engine.animate_ascii_move(duration=3, direction="out")

    engine.log("◇ eduboard ❯ setup wizard initialized")
    engine.log("")

    # --- Configuration Wizard ---
    hostname = engine.ask("System Hostname", "tv1", hint="Device network hostname (e.g. tv-hall, eduboard-1)", max_length=16) or "tv1"
    username = engine.ask("Kiosk User Account", "kiosk", hint="Dedicated non-root Linux user for kiosk auto-login", max_length=32) or "kiosk"
    kiosk_password = engine.ask("Kiosk User Password", "123456", hint="Password for the local kiosk Linux login account", max_length=32) or "123456"
    board_password = engine.ask("EduBoard / EduPage Infoscreen Password", "", hint="Infoscreen password used by the board to log into EduPage", max_length=64) or ""

    # Regional & Localization
    keyboard_layout = engine.ask("Keyboard Layout", "cz", hint="Console & Sway keyboard layout code (e.g. cz, sk, us, de, uk)", max_length=12) or "cz"
    system_locale = engine.ask("System Locale / Language", "cs_CZ.UTF-8", hint="Linux system locale (e.g. cs_CZ.UTF-8, sk_SK.UTF-8, en_US.UTF-8)", max_length=24) or "cs_CZ.UTF-8"
    timezone = engine.ask("System Timezone", "Europe/Prague", hint="System timezone (e.g. Europe/Prague, Europe/Bratislava, UTC)", max_length=32) or "Europe/Prague"

    # Display & Presentation
    screen_rotation = engine.ask("Display Orientation", "normal", hint="Screen rotation: normal (landscape), 90 (portrait), 180, 270", max_length=10) or "normal"
    subdomain = engine.ask("School Subdomain", "school", hint="EduPage subdomain (e.g. gymnasium for gymnasium.edupage.org)", max_length=32) or "school"
    screen_id = engine.ask("Timetable Screen ID", "1", hint="EduPage timetable display screen ID number", max_length=6) or "1"
    events_screen_id = engine.ask("Events Screen ID", "5", hint="EduPage events presentation screen ID number", max_length=6) or "5"

    # Power & Operations
    enable_break_overlay = (
        engine.ask("Break-Only Standby Overlay (Y/n)", "Y", hint="Display black screen only during school breaks to preserve TV backlight", max_length=1).lower() != "n"
    )
    auto_reboot_time = engine.ask("Nightly Reboot Time (HH:MM / off)", "03:00", hint="Scheduled daily reboot to refresh browser (e.g. 03:00, or off)", max_length=8) or "03:00"
    use_light_theme = (
        engine.ask("Interface Theme (dark / light)", "dark", hint="UI theme palette: dark or light", max_length=5).lower() in ("light", "l")
    )
    website_url = (
        engine.ask("Kiosk Target URL", "http://localhost:8000", hint="Web server endpoint loaded by Firefox kiosk", max_length=128) or "http://localhost:8000"
    )

    # Tailscale & Diagnostics
    tailscale_token = (
        engine.ask("Tailscale Auth Key (optional)", "", hint="Pre-authenticated key to join your Tailscale mesh VPN, or leave blank to skip", max_length=64) or ""
    )
    debug_mode = (
        engine.ask("Verbose Debug Mode (y/N)", "N", hint="Show verbose diagnostics and system logs on boot", max_length=1).lower() == "y"
    )

    engine.log("◇ Configuration Summary")
    engine.log(f"  ● Hostname:        {hostname}")
    engine.log(f"  ● Kiosk User:      {username}")
    engine.log(f"  ● Keyboard Layout: {keyboard_layout}")
    engine.log(f"  ● System Locale:   {system_locale}")
    engine.log(f"  ● Timezone:        {timezone}")
    engine.log(f"  ● Display Mode:    {screen_rotation}")
    engine.log(f"  ● EduPage School:  {subdomain}")
    engine.log(f"  ● Screens:         Timetable #{screen_id}, Events #{events_screen_id}")
    engine.log(f"  ● Standby Overlay: {'Enabled (break-only)' if enable_break_overlay else 'Disabled'}")
    engine.log(f"  ● Nightly Reboot:  {auto_reboot_time}")
    engine.log(f"  ● Theme:           {'Light' if use_light_theme else 'Dark'}")
    engine.log(f"  ● Target URL:      {website_url}")
    if tailscale_token.strip():
        engine.log(f"  ● Tailscale VPN:   Configured")
    else:
        engine.log(f"  ● Tailscale VPN:   Skipped")
    engine.log("")

    home_dir = f"/home/{username}"
    repo_dir = f"{home_dir}/EduBoard"
    venv_dir = f"{home_dir}/venv"

    # --- 1/6 User Account Setup ---
    engine.log("◇ 1/6 System & Account Setup")
    set_hostname(hostname, engine.log)

    try:
        pwd.getpwnam(username)
        engine.log(f"ℹ User '{username}' already exists")
    except KeyError:
        run_command(
            f"sudo adduser --disabled-password --gecos '' {username}",
            log_callback=engine.log,
        )
        run_command(
            f"echo '{username}:{kiosk_password}' | sudo chpasswd",
        )
        run_command(
            f"echo '{username} ALL=(ALL) NOPASSWD: /usr/bin/chvt' | sudo tee /etc/sudoers.d/kiosk-chvt"
        )
        engine.log(f"✔ Created user account '{username}'")
    else:
        run_command(
            f"echo '{username}:{kiosk_password}' | sudo chpasswd",
        )
        engine.log(f"ℹ User '{username}' password updated")

    # Timezone configuration
    try:
        engine.log(f"❯ Configuring timezone ({timezone})...")
        run_command(f"sudo timedatectl set-timezone {timezone}", log_callback=engine.log)
        engine.log(f"✔ Timezone configured ({timezone})")
    except Exception as e:
        engine.log(f"⚠ Could not set timezone: {e}")

    # Locale configuration
    try:
        global SYSTEM_LOCALE
        SYSTEM_LOCALE = system_locale
        engine.log(f"❯ Configuring system locale ({system_locale})...")
        run_command(f"sudo locale-gen {system_locale} en_US.UTF-8", log_callback=engine.log)
        run_command(f"sudo update-locale LANG={system_locale}", log_callback=engine.log)
        write_file("/etc/default/locale", f"LANG={system_locale}\n")
        engine.log(f"✔ System locale configured ({system_locale})")
    except Exception as e:
        engine.log(f"⚠ Could not configure locale: {e}")

    # Console & System Keyboard Layout
    keyboard_conf = f"""XKBMODEL="pc105"
XKBLAYOUT="{keyboard_layout}"
XKBVARIANT=""
XKBOPTIONS=""
BACKSPACE="guess"
"""
    try:
        engine.log(f"❯ Configuring keyboard layout ({keyboard_layout})...")
        write_file("/etc/default/keyboard", keyboard_conf)
        engine.log(f"✔ System keyboard layout configured ({keyboard_layout})")
    except Exception as e:
        engine.log(f"⚠ Could not configure keyboard: {e}")

    # --- 2/6 Package Dependencies ---
    engine.log("")
    engine.log("◇ 2/6 System Dependencies")
    engine.log("ℹ Adding NodeSource repository (Node.js 22)...")
    run_command(
        "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -",
        log_callback=engine.log,
    )
    engine.log("ℹ Adding Mozilla Team PPA & configuring APT pin...")
    run_command(
        "sudo add-apt-repository -y ppa:mozillateam/ppa", log_callback=engine.log
    )
    # Ubuntu APT pinning to prevent snap stub redirect for firefox-esr
    mozilla_pinning = """Package: firefox*
Pin: release o=LP-PPA-mozillateam
Pin-Priority: 1001
"""
    write_file("/etc/apt/preferences.d/mozilla-firefox", mozilla_pinning)
    run_command("sudo apt update", log_callback=engine.log)

    packages = [
        "curl",
        "git",
        "python3-full",
        "python3-venv",
        "nodejs",
        "locales",
        "keyboard-configuration",
        "cron",
        "fonts-symbola",
        "fonts-noto-core",
        "fonts-dejavu",
        "fonts-wqy-microhei",
        "kmscon",
        "sway",
        "firefox-esr",
        "wlr-randr",
        "seatd",
        "swaybg",
        "swaylock",
        "ufw",
    ]
    package_list = " ".join(packages)
    engine.log(f"❯ Installing system packages (apt)...")
    run_command(f"sudo apt install -y {package_list}", log_callback=engine.log)
    engine.log("✔ Dependencies installed")

    run_command("sudo groupadd -r seat 2>/dev/null || true", log_callback=engine.log)
    run_command(
        f"sudo usermod -aG video,audio,input,tty,render,sudo,seat {username}",
        log_callback=engine.log,
    )
    engine.log(f"✔ Added user to video, audio, input, tty, render, seat groups")

    # --- 3/6 Display & System Idle Configuration ---
    engine.log("")
    engine.log("◇ 3/6 Display Persistence (Disable Screen Idle)")
    configure_screen_idle(engine.log)

    # Firefox policies for kiosk reliability
    firefox_policies = """{
  "policies": {
    "DisableAppUpdate": true,
    "DontCheckDefaultBrowser": true,
    "NoDefaultBookmarks": true,
    "OverrideFirstRunPage": "",
    "OverridePostUpdatePage": "",
    "ResumePreviousSession": false,
    "DisableProfileRefresh": true,
    "PromptForDownloadLocation": false
  }
}
"""
    write_file("/usr/lib/firefox-esr/distribution/policies.json", firefox_policies)
    write_file("/etc/firefox/policies/policies.json", firefox_policies)
    engine.log("✔ Firefox kiosk policies written")

    # --- 4/6 Application Setup ---
    engine.log("")
    engine.log("◇ 4/6 EduBoard Application Setup")
    if repo_is_git(repo_dir, username):
        engine.log("ℹ Repository already present, pulling latest...")
        run_command(
            f"sudo -u {username} git -C {repo_dir} pull",
            log_callback=engine.log,
        )
    else:
        # Remove any stale/incomplete directory (root-owned or broken) so the
        # clone never trips over "already exists and is not an empty directory"
        run_command(f"sudo rm -rf {repo_dir}")
        engine.log("❯ Cloning repository (FoxyIsCoding/EduBoard)...")
        run_command(
            f"sudo -u {username} git clone https://github.com/FoxyIsCoding/EduBoard.git {repo_dir}",
            log_callback=engine.log,
        )
        engine.log("✔ Repository cloned")

    env_content = f"""SCHOOL_SUBDOMAIN={subdomain}
SCREEN_ID={screen_id}
EVENTS_SCREEN_ID={events_screen_id}
PASSWORD={board_password}
WEBSITE_URL={website_url}
VITE_USE_LIGHT_THEME={str(use_light_theme).lower()}
VITE_ENABLE_BREAK_ONLY_OVERLAY={str(enable_break_overlay).lower()}
DEBUG={str(debug_mode).lower()}
"""
    write_file(f"{repo_dir}/.env", env_content, user=username)
    engine.log("✔ Environment configuration written (.env)")

    engine.log("❯ Creating Python virtual environment...")
    run_command(f"python3 -m venv {venv_dir}", user=username, log_callback=engine.log)
    run_command(f"sudo chown -R {username}:{username} {venv_dir}")
    run_command(
        f"{venv_dir}/bin/pip install -r {repo_dir}/requirements.txt",
        user=username,
        log_callback=engine.log,
    )
    engine.log("✔ Python virtual environment ready")

    engine.log("❯ Pre-building frontend production bundle...")
    # Ensure the frontend dir and a user-owned npm cache so npm doesn't trip
    # over root-owned cache/config files left by an earlier root install.
    run_command(f"sudo chown -R {username}:{username} {repo_dir}/frontend")
    npm_cache = f"{home_dir}/.npm-cache"
    run_command(f"sudo -u {username} mkdir -p {npm_cache}")
    run_command(f"sudo chown -R {username}:{username} {npm_cache}")
    run_command(
        "npm install --cache " + npm_cache,
        cwd=f"{repo_dir}/frontend",
        user=username,
        log_callback=engine.log,
    )
    run_command(
        "npm run build",
        cwd=f"{repo_dir}/frontend",
        user=username,
        log_callback=engine.log,
    )
    run_command(
        f"sudo chmod +x {repo_dir}/run.sh {repo_dir}/update.sh 2>/dev/null || true"
    )
    engine.log("✔ Frontend pre-built successfully")

    # --- 5/6 Systemd Service & Kiosk Configuration ---
    engine.log("")
    engine.log("◇ 5/6 Kiosk Services & Wayland Compositor")
    service_content = f"""[Unit]
Description=EduBoard Background Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User={username}
Group={username}
WorkingDirectory={repo_dir}
ExecStart=/bin/bash {repo_dir}/run.sh {venv_dir}
Restart=always
RestartSec=3
Environment="PATH={venv_dir}/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
Environment=PYTHONUNBUFFERED=1
Environment=WAYLAND_DISPLAY=wayland-0
Environment=XDG_RUNTIME_DIR=/run/user/%U

[Install]
WantedBy=multi-user.target
"""
    write_file("/etc/systemd/system/EduBoard.service", service_content)
    engine.log("✔ EduBoard systemd service created")

    kmscon_conf_content = f"""font-name=DejaVu Sans Mono, WenQuanYi Micro Hei Mono
font-size=14
term=xterm-256color
xkb-layout={keyboard_layout}
hwaccel
"""
    write_file("/etc/kmscon/kmscon.conf", kmscon_conf_content)
    engine.log("✔ KMSCON configuration written")

    sway_config_content = f"""
default_border none
default_floating_border none
hide_edge_borders both
gaps inner 0
bar {{
    swaybar_command :
}}
input * {{
    xkb_layout "{keyboard_layout}"
}}
output * {{
    dpms on
    transform {screen_rotation}
}}
exec sh -lc 'set -a; [ -f "{repo_dir}/.env" ] && . "{repo_dir}/.env"; set +a; exec firefox-esr --kiosk "${{WEBSITE_URL:-http://localhost:8000}}"'
for_window [app_id="firefox"] fullscreen global
bindsym Mod4+Shift+q kill
bindsym Ctrl+Alt+Delete exec swaymsg exit # emergency exit to tty
"""
    write_file(f"{home_dir}/.config/sway/config", sway_config_content, user=username)
    engine.log(f"✔ Sway kiosk config written (layout: {keyboard_layout}, rotation: {screen_rotation})")

    kmscon_bin = shutil.which("kmscon") or "/usr/bin/kmscon"
    for candidate in ["/usr/bin/kmscon", "/usr/libexec/kmscon/kmscon", "/usr/lib/kmscon/kmscon"]:
        if os.path.isfile(candidate):
            kmscon_bin = candidate
            break

    override_dir = "/etc/systemd/system/kmsconvt@tty1.service.d"
    override_content = f"""[Service]
ExecStart=
ExecStart={kmscon_bin} --vt tty1 --seats seat0 --configdir /etc/kmscon --term xterm-256color --login -- /bin/su -l {username} -c "exec {venv_dir}/bin/python {repo_dir}/misc/boot.py"
"""
    write_file(f"{override_dir}/override.conf", override_content)
    engine.log(f"✔ KMSCON configured for user '{username}' on tty1")

    # --- 6/6 Tailscale, Firewall & Finalization ---
    engine.log("")
    engine.log("◇ 6/6 Security & Finalization")
    tailscale_installed = install_tailscale(tailscale_token, engine.log)

    engine.log("❯ Configuring UFW firewall...")
    run_command("sudo ufw default deny incoming", log_callback=engine.log)
    run_command("sudo ufw default allow outgoing", log_callback=engine.log)
    run_command("sudo ufw allow 22/tcp comment 'SSH'", log_callback=engine.log)

    if tailscale_installed:
        run_command(
            "sudo ufw allow 41641/udp comment 'Tailscale'", log_callback=engine.log
        )

    run_command("echo 'y' | sudo ufw enable", log_callback=engine.log)
    run_command("sudo ufw reload", log_callback=engine.log)
    engine.log("✔ UFW firewall configured and enabled")

    # Disable conflicting services
    engine.log("ℹ Disabling conflicting terminal services...")
    run_command("sudo systemctl mask getty@tty1.service")
    run_command("sudo systemctl mask serial-getty@ttyS0.service")
    run_command("sudo systemctl mask serial-getty@hvc0.service")

    # Enable services
    run_command("sudo systemctl enable kmsconvt@tty1.service", log_callback=engine.log)
    engine.log("✔ Terminal services enabled")

    run_command("sudo systemctl daemon-reload")
    run_command("sudo systemctl enable EduBoard", log_callback=engine.log)
    run_command("sudo systemctl enable seatd", log_callback=engine.log)
    run_command(f"sudo loginctl enable-linger {username}", log_callback=engine.log)
    engine.log("✔ EduBoard background service & seatd enabled")

    # Nightly maintenance reboot
    if auto_reboot_time.lower() != "off" and ":" in auto_reboot_time:
        try:
            parts = auto_reboot_time.split(":")
            h = int(parts[0].strip())
            m = int(parts[1].strip())
            cron_line = f"{m} {h} * * * root /sbin/shutdown -r +1 'EduBoard nightly scheduled reboot' >/dev/null 2>&1\n"
            write_file("/etc/cron.d/eduboard-nightly-reboot", cron_line)
            run_command("sudo systemctl enable cron 2>/dev/null || true")
            engine.log(f"✔ Nightly maintenance reboot scheduled for {h:02d}:{m:02d}")
        except Exception as e:
            engine.log(f"⚠ Could not schedule nightly reboot: {e}")

    engine.log("")
    engine.log("✔ Installation complete! System will reboot in 3 seconds...")
    run_command("sleep 3 && sudo reboot")


if __name__ == "__main__":
    try:
        curses.wrapper(main)
    except Exception as exc:
        log_path = write_install_error("Fatal installer error", exc)
        if log_path:
            print(f"Installer failed. Details saved to {log_path}")
        else:
            print("Installer failed. Details could not be written to disk.")
        time.sleep(10)
