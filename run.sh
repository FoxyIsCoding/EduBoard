#!/bin/bash
set -e

VENV_PATH="$1"

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

# Resolve Git metadata
BRANCH_NAME="unknown"
COMMIT_HASH="unknown"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")
    COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
fi

# Minimalist Card Header
printf "\n"
printf "${C_BORDER}╭─────────────────────────────────────────────────────────────╮${C_RESET}\n"
printf "${C_BORDER}│${C_RESET}  ${C_PURPLE}${C_BOLD}eduboard${C_RESET} ${C_DIM}❯${C_RESET} ${C_WHITE}kiosk runtime${C_RESET}                                   ${C_BORDER}│${C_RESET}\n"
printf "${C_BORDER}│${C_RESET}  ${C_DIM}branch:${C_RESET} ${C_CYAN}%-10s${C_RESET} ${C_DIM}commit:${C_RESET} ${C_CYAN}%-10s${C_RESET} ${C_DIM}target:${C_RESET} ${C_DIM}localhost:8000${C_RESET} ${C_BORDER}│${C_RESET}\n" "$BRANCH_NAME" "$COMMIT_HASH"
printf "${C_BORDER}╰─────────────────────────────────────────────────────────────╯${C_RESET}\n\n"

# 1. Environment Setup
if [ -n "$VENV_PATH" ]; then
    if [ -f "$VENV_PATH/bin/activate" ]; then
        source "$VENV_PATH/bin/activate"
        PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')" 2>/dev/null || echo "3")
        log_item "Environment" "ok" "Python $PY_VER (virtualenv: $(basename "$VENV_PATH"))"
    else
        log_item "Environment" "err" "Virtual environment missing: $VENV_PATH"
        exit 1
    fi
else
    PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')" 2>/dev/null || echo "3")
    log_item "Environment" "ok" "System Python $PY_VER ($(which python3 2>/dev/null || echo 'python3'))"
fi

# 2. Git Repository Sync
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git pull --rebase --autostash >/dev/null 2>&1; then
        NEW_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "$COMMIT_HASH")
        if [ "$COMMIT_HASH" != "$NEW_HASH" ]; then
            log_item "Repository" "ok" "Updated to $NEW_HASH (was $COMMIT_HASH)"
            export REBUILD=1
        else
            log_item "Repository" "ok" "Branch '$BRANCH_NAME' is up to date ($COMMIT_HASH)"
        fi
    else
        log_item "Repository" "warn" "Working offline or local changes present (skipped pull)"
    fi
fi

# 3. Frontend Bundle Verification
if [ ! -d "frontend/dist" ] || [ ! -d "frontend/node_modules" ] || [ "$REBUILD" = "1" ]; then
    log_item "Frontend" "step" "Building production bundle..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        log_item "Frontend" "step" "Installing dependencies (npm install)..."
        npm install --silent --no-fund --no-audit
    fi
    npm run build >/dev/null 2>&1
    cd ..
    log_item "Frontend" "ok" "Production assets compiled successfully (dist/)"
else
    log_item "Frontend" "ok" "Production assets verified (dist/ cached)"
fi

# 4. Service Launch
log_item "Server" "live" "Launching EduBoard engine on http://localhost:8000"
printf "\n"

python3 main.py

if [ -n "$VENV_PATH" ]; then
    deactivate 2>/dev/null || true
fi