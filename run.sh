#!/bin/bash
set -e

VENV_PATH="$1"

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

# Resolve Git metadata
BRANCH_NAME="unknown"
COMMIT_HASH="unknown"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")
    COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
fi

# Minimalist Monochrome Card Header
printf "\n"
printf "${C_DIM}╭─────────────────────────────────────────────────────────────╮${C_RESET}\n"
printf "${C_DIM}│${C_RESET}  ${C_WHITE}eduboard${C_RESET} ${C_DIM}❯ kiosk runtime${C_RESET}                                   ${C_DIM}│${C_RESET}\n"
printf "${C_DIM}│${C_RESET}  ${C_DIM}branch:${C_RESET} %-10s  ${C_DIM}commit:${C_RESET} %-10s  ${C_DIM}target:${C_RESET} localhost:8000 ${C_DIM}│${C_RESET}\n" "$BRANCH_NAME" "$COMMIT_HASH"
printf "${C_DIM}╰─────────────────────────────────────────────────────────────╯${C_RESET}\n\n"

# Local Testing Mode (Frontend-only, dummy data, screen schedule disabled)
if [ "$1" = "local" ] || [ "$1" = "--local" ] || [ "$1" = "mock" ] || [ "$1" = "--mock" ] || [ "$LOCAL_MODE" = "1" ] || [ "$EDUBOARD_LOCAL_MODE" = "1" ]; then
    printf "\n"
    printf "${C_DIM}╭─────────────────────────────────────────────────────────────╮${C_RESET}\n"
    printf "${C_DIM}│${C_RESET}  ${C_WHITE}eduboard${C_RESET} ${C_DIM}❯ local ui testing mode${C_RESET}                                ${C_DIM}│${C_RESET}\n"
    printf "${C_DIM}│${C_RESET}  ${C_DIM}target:${C_RESET} http://localhost:8000  ${C_DIM}data:${C_RESET} mock  ${C_DIM}screen:${C_RESET} always-on  ${C_DIM}│${C_RESET}\n"
    printf "${C_DIM}╰─────────────────────────────────────────────────────────────╯${C_RESET}\n\n"

    log_item "Local Mode" "step" "Preparing frontend environment..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        log_item "Local Mode" "step" "Installing npm dependencies..."
        npm install --silent --no-fund --no-audit
    fi
    log_item "Local Mode" "ok" "Frontend environment ready"
    log_item "Local Mode" "ok" "Display turning-off schedule & overlay: DISABLED"
    log_item "Local Mode" "ok" "Realistic dummy data active (timetable, events, substitutions)"
    log_item "Local Mode" "live" "Launching frontend on http://localhost:8000"
    printf "\n"
    export VITE_LOCAL_MODE="true"
    exec npx vite --host 0.0.0.0 --port 8000 --mode local
fi

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
    log_item "Frontend" "step" "Building production assets..."
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