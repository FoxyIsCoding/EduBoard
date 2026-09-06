#!/bin/bash
set -e

C_CYAN='\033[0;36m'
C_GREEN='\033[0;32m'
C_DIM='\033[2m'
C_BOLD='\033[1m'
C_RESET='\033[0m'

log_step() {
    printf "${C_DIM}[eduboard]${C_RESET} ${C_BOLD}❯${C_RESET} %s\n" "$1"
}

log_info() {
    printf "${C_DIM}[eduboard]${C_RESET} ${C_CYAN}ℹ${C_RESET} %s\n" "$1"
}

log_ok() {
    printf "${C_DIM}[eduboard]${C_RESET} ${C_GREEN}✔${C_RESET} %s\n" "$1"
}

log_step "Updating system package repositories and installing Python..."
sudo rm -rf /var/lib/apt/lists/*
sudo apt clean
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-full python3-pip git build-essential

TEMP_DIR="/tmp/eduboard_setup"
log_step "Fetching EduBoard installer to $TEMP_DIR..."

mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR" || exit

git init
if ! git remote | grep -q "origin"; then
    git remote add -f origin https://github.com/FoxyIsCoding/EduBoard.git
fi
git config core.sparseCheckout true

echo "requirements.txt" > .git/info/sparse-checkout
echo "misc/" >> .git/info/sparse-checkout

git pull origin main

log_step "Creating setup virtual environment..."
python3 -m venv "$TEMP_DIR/venv"

log_step "Installing setup requirements..."
"$TEMP_DIR/venv/bin/pip" install --upgrade pip
"$TEMP_DIR/venv/bin/pip" install -r requirements.txt
log_ok "Environment ready"

log_step "Launching EduBoard Setup Wizard..."
sudo "$TEMP_DIR/venv/bin/python3" misc/install.py