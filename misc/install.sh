#!/bin/bash
set -e

# 256-color / modern minimal palette
if [ -t 1 ] || [ -n "$TERM" ] && [ "$TERM" != "dumb" ]; then
    C_PURPLE='\033[38;5;141m'
    C_CYAN='\033[38;5;39m'
    C_MINT='\033[38;5;48m'
    C_AMBER='\033[38;5;214m'
    C_ROSE='\033[38;5;197m'
    C_DIM='\033[38;5;244m'
    C_BORDER='\033[38;5;239m'
    C_WHITE='\033[1;37m'
    C_BOLD='\033[1m'
    C_RESET='\033[0m'
else
    C_PURPLE=''
    C_CYAN=''
    C_MINT=''
    C_AMBER=''
    C_ROSE=''
    C_DIM=''
    C_BORDER=''
    C_WHITE=''
    C_BOLD=''
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
            color="$C_MINT"
            ;;
        warn)
            icon="⚠"
            color="$C_AMBER"
            ;;
        err)
            icon="✖"
            color="$C_ROSE"
            ;;
        step)
            icon="❯"
            color="$C_CYAN"
            ;;
        live)
            icon="●"
            color="$C_MINT"
            ;;
        *)
            icon="ℹ"
            color="$C_CYAN"
            ;;
    esac

    printf "  ${C_PURPLE}◇${C_RESET} %-14s ${color}${C_BOLD}%s${C_RESET} %s\n" "$category" "$icon" "$message"
}

printf "\n"
printf "${C_BORDER}╭─────────────────────────────────────────────────────────────╮${C_RESET}\n"
printf "${C_BORDER}│${C_RESET}  ${C_PURPLE}${C_BOLD}eduboard${C_RESET} ${C_DIM}❯${C_RESET} ${C_WHITE}installer bootstrap${C_RESET}                              ${C_BORDER}│${C_RESET}\n"
printf "${C_BORDER}│${C_RESET}  ${C_DIM}source:${C_RESET} ${C_CYAN}FoxyIsCoding/EduBoard${C_RESET}  ${C_DIM}target:${C_RESET} ${C_DIM}ubuntu / raspberry pi${C_RESET} ${C_BORDER}│${C_RESET}\n"
printf "${C_BORDER}╰─────────────────────────────────────────────────────────────╯${C_RESET}\n\n"

log_item "System" "step" "Refreshing package repositories..."
sudo rm -rf /var/lib/apt/lists/*
sudo apt clean
sudo apt update -qq && sudo apt upgrade -y -qq
sudo apt install -y -qq python3-full python3-pip python3-venv git build-essential
log_item "System" "ok" "Base dependencies installed"

TEMP_DIR="/tmp/eduboard_setup"
log_item "Installer" "step" "Fetching setup bundle to $TEMP_DIR..."

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
sudo "$TEMP_DIR/venv/bin/python3" misc/install.py