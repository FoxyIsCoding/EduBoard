#!/bin/bash
set -e

# Terminal setup - auto-detect terminal capabilities without manual export
export TERM="${TERM:-xterm-256color}"
[ "$TERM" = "dumb" ] && export TERM="xterm-256color"

# Minimal palette: predominantly monochrome with color ONLY on status
if [ -t 1 ] || [ -n "$TERM" ] && [ "$TERM" != "dumb" ]; then
    C_GREEN='\033[0;32m'
    C_YELLOW='\033[0;33m'
    C_RED='\033[0;31m'
    C_WHITE='\033[1;37m'
    C_DIM='\033[2m'
    C_RESET='\033[0m'
else
    C_GREEN=''
    C_YELLOW=''
    C_RED=''
    C_WHITE=''
    C_DIM=''
    C_RESET=''
fi

log_item() {
    local category="$1"
    local status_type="$2"
    local message="$3"
    local icon=""
    local color=""

    case "$status_type" in
        ok)
            icon="✔"
            color="$C_GREEN"
            ;;
        warn)
            icon="⚠"
            color="$C_YELLOW"
            ;;
        err)
            icon="✖"
            color="$C_RED"
            ;;
        step)
            icon="❯"
            color="$C_WHITE"
            ;;
        live)
            icon="●"
            color="$C_GREEN"
            ;;
        *)
            icon="ℹ"
            color="$C_WHITE"
            ;;
    esac

    printf "  ${C_DIM}◇${C_RESET} %-14s ${color}%s${C_RESET} %s\n" "$category" "$icon" "$message"
}

# Require or elevate sudo privileges
if [ "$EUID" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        sudo -v </dev/tty || { echo "Administrator / root privileges required."; exit 1; }
        SUDO="sudo"
    else
        echo "Root privileges required to install system packages and services."
        exit 1
    fi
else
    SUDO=""
fi

printf "\n"
printf "${C_DIM}╭─────────────────────────────────────────────────────────────╮${C_RESET}\n"
printf "${C_DIM}│${C_RESET}  ${C_WHITE}eduboard${C_RESET} ${C_DIM}❯ installer bootstrap${C_RESET}                              ${C_DIM}│${C_RESET}\n"
printf "${C_DIM}│${C_RESET}  ${C_DIM}source:${C_RESET} FoxyIsCoding/EduBoard  ${C_DIM}target:${C_RESET} ubuntu / rpi          ${C_DIM}│${C_RESET}\n"
printf "${C_DIM}╰─────────────────────────────────────────────────────────────╯${C_RESET}\n\n"

log_item "System" "step" "Refreshing package repositories..."
$SUDO rm -rf /var/lib/apt/lists/*
$SUDO apt clean
$SUDO env DEBIAN_FRONTEND=noninteractive apt update -qq && $SUDO env DEBIAN_FRONTEND=noninteractive apt upgrade -y -qq
$SUDO env DEBIAN_FRONTEND=noninteractive apt install -y -qq python3-full python3-pip python3-venv git build-essential
log_item "System" "ok" "Base dependencies installed"

TEMP_DIR="/tmp/eduboard_setup"
log_item "Installer" "step" "Fetching setup bundle to $TEMP_DIR..."

$SUDO rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR" || exit

git init -q
if ! git remote | grep -q "origin"; then
    git remote add -f origin https://github.com/FoxyIsCoding/EduBoard.git
fi
git config core.sparseCheckout true

echo "requirements.txt" > .git/info/sparse-checkout
echo "misc/" >> .git/info/sparse-checkout

git pull -q origin main

log_item "Environment" "step" "Preparing setup virtualenv..."
python3 -m venv "$TEMP_DIR/venv"
"$TEMP_DIR/venv/bin/pip" install --upgrade pip --quiet
"$TEMP_DIR/venv/bin/pip" install -r requirements.txt --quiet
log_item "Environment" "ok" "Installer environment ready"

log_item "Wizard" "live" "Launching EduBoard interactive setup..."
printf "\n"

# Attach /dev/tty so curses has direct keyboard input when piped from curl
if [ -e /dev/tty ]; then
    $SUDO TERM=xterm-256color "$TEMP_DIR/venv/bin/python3" misc/install.py </dev/tty
else
    $SUDO TERM=xterm-256color "$TEMP_DIR/venv/bin/python3" misc/install.py
fi