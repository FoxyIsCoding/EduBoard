#!/bin/bash
set -e

VENV_PATH="$1"

# ANSI styling (NPX / modern package manager style)
C_CYAN='\033[0;36m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_RED='\033[0;31m'
C_DIM='\033[2m'
C_BOLD='\033[1m'
C_RESET='\033[0m'

log_info() {
    printf "${C_DIM}[eduboard]${C_RESET} ${C_CYAN}ℹ${C_RESET} %s\n" "$1"
}

log_step() {
    printf "${C_DIM}[eduboard]${C_RESET} ${C_BOLD}❯${C_RESET} %s\n" "$1"
}

log_ok() {
    printf "${C_DIM}[eduboard]${C_RESET} ${C_GREEN}✔${C_RESET} %s\n" "$1"
}

log_warn() {
    printf "${C_DIM}[eduboard]${C_RESET} ${C_YELLOW}⚠${C_RESET} %s\n" "$1"
}

log_err() {
    printf "${C_DIM}[eduboard]${C_RESET} ${C_RED}✖${C_RESET} %s\n" "$1"
}

if [ -n "$VENV_PATH" ]; then
    if [ -f "$VENV_PATH/bin/activate" ]; then
        log_info "Activating Python virtual environment ($VENV_PATH)"
        source "$VENV_PATH/bin/activate"
    else
        log_err "Activation script not found in $VENV_PATH"
        exit 1
    fi
else
    log_info "Using system Python: $(which python3 2>/dev/null || echo python3)"
fi

log_step "Initializing EduBoard..."

# Attempt git pull only if online / git repo
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    log_info "Git HEAD at commit $COMMIT_HASH"
    log_info "Checking upstream updates..."
    if git pull --rebase --autostash >/dev/null 2>&1; then
        NEW_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "$COMMIT_HASH")
        if [ "$COMMIT_HASH" != "$NEW_HASH" ]; then
            log_ok "Updated successfully ($COMMIT_HASH -> $NEW_HASH)"
            export REBUILD=1
        else
            log_ok "Repository up to date ($COMMIT_HASH)"
        fi
    else
        log_warn "Git pull skipped (offline or branch dirty), continuing..."
    fi
fi

# Frontend build verification
if [ ! -d "frontend/dist" ] || [ ! -d "frontend/node_modules" ] || [ "$REBUILD" = "1" ]; then
    log_step "Building frontend production assets..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        log_info "Installing frontend dependencies (npm install)..."
        npm install --silent
    fi
    npm run build
    cd ..
    log_ok "Frontend production bundle ready"
else
    log_ok "Frontend bundle verified (dist/ present)"
fi

log_ok "Starting EduBoard service on http://localhost:8000"
python3 main.py

if [ -n "$VENV_PATH" ]; then
    deactivate
fi