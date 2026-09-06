#!/bin/bash
set -e

# Change directory to repo root
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

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

print_header() {
    local active_branch="$1"
    local current_hash="$2"
    local dirty_status="$3"

    printf "\n"
    printf "${C_BORDER}╭─────────────────────────────────────────────────────────────╮${C_RESET}\n"
    printf "${C_BORDER}│${C_RESET}  ${C_PURPLE}${C_BOLD}eduboard${C_RESET} ${C_DIM}❯${C_RESET} ${C_WHITE}updater & branch manager${C_RESET}                      ${C_BORDER}│${C_RESET}\n"
    printf "${C_BORDER}│${C_RESET}  ${C_DIM}branch:${C_RESET} ${C_CYAN}%-10s${C_RESET} ${C_DIM}commit:${C_RESET} ${C_CYAN}%-10s${C_RESET} ${C_DIM}status:${C_RESET} %-16b ${C_BORDER}│${C_RESET}\n" \
        "$active_branch" "$current_hash" "$dirty_status"
    printf "${C_BORDER}╰─────────────────────────────────────────────────────────────╯${C_RESET}\n\n"
}

print_summary() {
    local branch="$1"
    local old_c="$2"
    local new_c="$3"

    printf "\n"
    printf "${C_BORDER}╭─────────────────────────────────────────────────────────────╮${C_RESET}\n"
    printf "${C_BORDER}│${C_RESET}  ${C_MINT}${C_BOLD}✔ eduboard updated successfully${C_RESET}                            ${C_BORDER}│${C_RESET}\n"
    if [ "$old_c" = "$new_c" ]; then
        printf "${C_BORDER}│${C_RESET}  ${C_DIM}branch:${C_RESET} ${C_CYAN}%-10s${C_RESET} ${C_DIM}commit:${C_RESET} ${C_CYAN}%-10s (up to date)${C_RESET}       ${C_BORDER}│${C_RESET}\n" \
            "$branch" "$new_c"
    else
        printf "${C_BORDER}│${C_RESET}  ${C_DIM}branch:${C_RESET} ${C_CYAN}%-10s${C_RESET} ${C_DIM}version:${C_RESET} ${C_DIM}%s${C_RESET} ${C_BOLD}❯${C_RESET} ${C_MINT}%-10s${C_RESET}        ${C_BORDER}│${C_RESET}\n" \
            "$branch" "$old_c" "$new_c"
    fi
    printf "${C_BORDER}╰─────────────────────────────────────────────────────────────╯${C_RESET}\n\n"
}

# Verify Git environment
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    log_item "Git" "err" "Not inside a valid Git repository ($REPO_DIR)"
    exit 1
fi

# Locate Python virtual environment
find_venv() {
    local candidates=(
        "$VENV_ARG"
        "$VIRTUAL_ENV"
        "$REPO_DIR/venv"
        "$REPO_DIR/.venv"
        "/home/$USER/venv"
        "/home/kiosk/venv"
        "/home/$USER"
    )
    for c in "${candidates[@]}"; do
        if [ -n "$c" ] && [ -f "$c/bin/activate" ]; then
            echo "$c"
            return 0
        fi
    done
    return 1
}

# Fetch all remote refs quietly
fetch_remotes() {
    log_item "Network" "step" "Fetching latest branches & tags from remotes..."
    git fetch --all --prune --quiet 2>/dev/null || {
        log_item "Network" "warn" "Could not connect to remote (offline or unauthenticated)"
    }
}

# Handle dirty working directory
DID_STASH=0
handle_dirty() {
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_item "Repository" "warn" "Working directory has uncommitted local modifications"
        if [ "$AUTO_MODE" = "1" ]; then
            log_item "Repository" "step" "Auto-stashing local modifications..."
            git stash save "Auto-stash by EduBoard updater $(date +'%Y-%m-%d %H:%M:%S')" --quiet
            DID_STASH=1
        else
            printf "    ${C_PURPLE}1)${C_RESET} Auto-stash changes and proceed\n"
            printf "    ${C_PURPLE}2)${C_RESET} Discard local modifications (hard reset)\n"
            printf "    ${C_PURPLE}3)${C_RESET} Abort update\n"
            printf "  ${C_CYAN}❯${C_RESET} Choice [1-3] (default 1): "
            read -r dirty_choice
            case "$dirty_choice" in
                2)
                    git reset --hard HEAD --quiet
                    git clean -fd --quiet
                    log_item "Repository" "ok" "Local modifications discarded"
                    ;;
                3)
                    log_item "Update" "err" "Update aborted by user"
                    exit 1
                    ;;
                *)
                    git stash save "Auto-stash by EduBoard updater $(date +'%Y-%m-%d %H:%M:%S')" --quiet
                    DID_STASH=1
                    log_item "Repository" "ok" "Local changes saved to git stash"
                    ;;
            esac
        fi
    fi
}

restore_stash() {
    if [ "$DID_STASH" = "1" ]; then
        log_item "Repository" "step" "Restoring stashed local modifications..."
        if git stash pop --quiet 2>/dev/null; then
            log_item "Repository" "ok" "Local modifications restored cleanly"
        else
            log_item "Repository" "warn" "Local modifications preserved in git stash (manual pop may be required)"
        fi
    fi
}

# Get list of unique branch names
get_branches() {
    local local_branches
    local remote_branches
    local all_branches=()

    local_branches=$(git for-each-ref --format='%(refname:short)' refs/heads/)
    remote_branches=$(git for-each-ref --format='%(refname:short)' refs/remotes/ | grep -v 'HEAD' | sed 's|^[^/]*/||')

    while IFS= read -r b; do
        [ -n "$b" ] && all_branches+=("$b")
    done <<< "$local_branches"

    while IFS= read -r b; do
        if [ -n "$b" ]; then
            local exists=0
            for existing in "${all_branches[@]}"; do
                if [ "$existing" = "$b" ]; then
                    exists=1
                    break
                fi
            done
            [ "$exists" -eq 0 ] && all_branches+=("$b")
        fi
    done <<< "$remote_branches"

    printf "%s\n" "${all_branches[@]}"
}

# Switch to chosen branch
switch_branch() {
    local target="$1"
    local current
    current=$(git rev-parse --abbrev-ref HEAD)

    if [ "$target" = "$current" ]; then
        log_item "Branch" "ok" "Already on branch '$target'"
        return 0
    fi

    log_item "Branch" "step" "Switching branch ($current ❯ $target)..."
    
    if git show-ref --verify --quiet "refs/heads/$target"; then
        git checkout "$target" --quiet
    elif git show-ref --verify --quiet "refs/remotes/origin/$target"; then
        git checkout -B "$target" "origin/$target" --quiet
    else
        git checkout "$target" --quiet
    fi

    local new_branch
    new_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$new_branch" = "$target" ]; then
        log_item "Branch" "ok" "Switched to '$target'"
    else
        log_item "Branch" "err" "Failed to switch to '$target'"
        exit 1
    fi
}

# Interactive branch selector
select_branch_menu() {
    local current
    current=$(git rev-parse --abbrev-ref HEAD)
    local branches=()

    while IFS= read -r line; do
        [ -n "$line" ] && branches+=("$line")
    done < <(get_branches)

    printf "  ${C_PURPLE}◇${C_RESET} ${C_BOLD}Available branches:${C_RESET}\n"
    local idx=1
    for b in "${branches[@]}"; do
        if [ "$b" = "$current" ]; then
            printf "    ${C_CYAN}%2d)${C_RESET} ${C_BOLD}%-24s${C_RESET} ${C_MINT}[active]${C_RESET}\n" "$idx" "$b"
        else
            printf "    ${C_PURPLE}%2d)${C_RESET} %-24s\n" "$idx" "$b"
        fi
        ((idx++))
    done
    printf "    ${C_PURPLE}%2d)${C_RESET} Enter custom branch name\n" "$idx"
    printf "  ${C_CYAN}❯${C_RESET} Select branch [1-%d]: " "$idx"
    read -r b_choice

    if [[ "$b_choice" =~ ^[0-9]+$ ]] && [ "$b_choice" -ge 1 ] && [ "$b_choice" -lt "$idx" ]; then
        local picked="${branches[$((b_choice - 1))]}"
        switch_branch "$picked"
    elif [ "$b_choice" -eq "$idx" ]; then
        printf "  ${C_CYAN}❯${C_RESET} Enter branch name: "
        read -r custom_b
        if [ -n "$custom_b" ]; then
            switch_branch "$custom_b"
        fi
    else
        log_item "Branch" "warn" "Invalid selection, staying on '$current'"
    fi
}

# Pull latest commits
pull_updates() {
    local branch
    branch=$(git rev-parse --abbrev-ref HEAD)
    log_item "Sync" "step" "Pulling latest changes for '$branch'..."

    local remote="origin"
    if ! git remote | grep -q "^origin$"; then
        remote=$(git remote | head -n 1)
    fi

    if [ -n "$remote" ]; then
        if git pull --rebase --autostash "$remote" "$branch" --quiet 2>/dev/null; then
            log_item "Sync" "ok" "Git pull completed successfully"
        else
            log_item "Sync" "warn" "Git pull returned non-zero (working with current tree)"
        fi
    fi
}

# Update Python dependencies
update_python() {
    local venv_dir
    venv_dir=$(find_venv || true)

    if [ -n "$venv_dir" ] && [ -f "$venv_dir/bin/activate" ]; then
        log_item "Python" "step" "Upgrading Python dependencies ($venv_dir)..."
        "$venv_dir/bin/pip" install --upgrade pip --quiet
        "$venv_dir/bin/pip" install -r requirements.txt --quiet
        log_item "Python" "ok" "Python virtualenv dependencies up to date"
    else
        log_item "Python" "warn" "No virtualenv found (skipping pip upgrade)"
    fi
}

# Rebuild Frontend Assets
rebuild_frontend() {
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        log_item "Frontend" "step" "Compiling production assets (Vite / React)..."
        cd frontend
        if command -v npm >/dev/null 2>&1; then
            if [ ! -d "node_modules" ]; then
                log_item "Frontend" "step" "Installing node_modules..."
                npm install --silent --no-fund --no-audit
            fi
            npm run build >/dev/null 2>&1
            log_item "Frontend" "ok" "Production bundle rebuilt in dist/"
        else
            log_item "Frontend" "warn" "npm not found in PATH (cannot build frontend)"
        fi
        cd "$REPO_DIR"
    fi
}

# Restart Kiosk Systemd Service
restart_service() {
    local svc=""
    for s in "EduBoard.service" "eduboard.service"; do
        if systemctl is-active --quiet "$s" 2>/dev/null; then
            svc="$s"
            break
        fi
    done

    if [ -n "$svc" ]; then
        log_item "Service" "step" "Restarting active kiosk service ($svc)..."
        if sudo systemctl restart "$svc" 2>/dev/null; then
            log_item "Service" "ok" "$svc restarted and active"
        else
            log_item "Service" "warn" "Could not restart $svc (sudo permissions needed)"
        fi
    else
        log_item "Service" "ok" "No running EduBoard systemd service detected"
    fi
}

show_help() {
    printf "Usage: ./update.sh [OPTIONS]\n\n"
    printf "Options:\n"
    printf "  -b, --branch <name>     Switch to specified branch and update\n"
    printf "  -c, --current           Update current branch directly (non-interactive)\n"
    printf "      --build-only        Rebuild frontend and update Python without git pull\n"
    printf "      --restart           Restart EduBoard service after update\n"
    printf "      --venv <path>       Specify custom virtualenv directory\n"
    printf "  -h, --help              Display this help message\n\n"
    printf "Examples:\n"
    printf "  ./update.sh                    # Interactive dashboard\n"
    printf "  ./update.sh -c                 # Quick update current branch\n"
    printf "  ./update.sh -b dev             # Switch to 'dev' branch and update\n"
    printf "  ./update.sh -c --restart       # Update and restart service\n"
    exit 0
}

# --- CLI Arguments Parsing ---
TARGET_BRANCH=""
AUTO_MODE="0"
BUILD_ONLY="0"
RESTART_AFTER="0"
VENV_ARG=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -b|--branch)
            TARGET_BRANCH="$2"
            AUTO_MODE="1"
            shift 2
            ;;
        -c|--current)
            AUTO_MODE="1"
            shift
            ;;
        --build-only)
            BUILD_ONLY="1"
            AUTO_MODE="1"
            shift
            ;;
        --restart)
            RESTART_AFTER="1"
            shift
            ;;
        --venv)
            VENV_ARG="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            printf "Unknown argument: %s\n" "$1"
            show_help
            ;;
    esac
done

# Current Git state
START_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
START_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DIRTY_TAG="${C_MINT}clean${C_RESET}"
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    DIRTY_TAG="${C_AMBER}modified${C_RESET}"
fi

# Print Header Card
print_header "$START_BRANCH" "$START_COMMIT" "$DIRTY_TAG"

# Handle CLI flags
if [ "$BUILD_ONLY" = "1" ]; then
    update_python
    rebuild_frontend
    [ "$RESTART_AFTER" = "1" ] && restart_service
    print_summary "$START_BRANCH" "$START_COMMIT" "$START_COMMIT"
    exit 0
fi

if [ -n "$TARGET_BRANCH" ]; then
    fetch_remotes
    handle_dirty
    switch_branch "$TARGET_BRANCH"
    pull_updates
    update_python
    rebuild_frontend
    restore_stash
    [ "$RESTART_AFTER" = "1" ] && restart_service
    FINAL_COMMIT=$(git rev-parse --short HEAD)
    print_summary "$TARGET_BRANCH" "$START_COMMIT" "$FINAL_COMMIT"
    exit 0
fi

if [ "$AUTO_MODE" = "1" ]; then
    fetch_remotes
    handle_dirty
    pull_updates
    update_python
    rebuild_frontend
    restore_stash
    [ "$RESTART_AFTER" = "1" ] && restart_service
    FINAL_COMMIT=$(git rev-parse --short HEAD)
    print_summary "$START_BRANCH" "$START_COMMIT" "$FINAL_COMMIT"
    exit 0
fi

# --- Interactive Menu ---
fetch_remotes
printf "  ${C_PURPLE}◇${C_RESET} ${C_BOLD}Select an operation:${C_RESET}\n"
printf "    ${C_PURPLE}1)${C_RESET} Fast update current branch (${C_CYAN}%s${C_RESET})\n" "$START_BRANCH"
printf "    ${C_PURPLE}2)${C_RESET} Switch branch & update (select from list)\n"
printf "    ${C_PURPLE}3)${C_RESET} Rebuild frontend production bundle only\n"
printf "    ${C_PURPLE}4)${C_RESET} Update Python dependencies only\n"
printf "    ${C_PURPLE}5)${C_RESET} Restart EduBoard kiosk service\n"
printf "    ${C_PURPLE}6)${C_RESET} Exit\n"
printf "  ${C_CYAN}❯${C_RESET} Choice [1-6] (default 1): "
read -r menu_choice

case "$menu_choice" in
    2)
        handle_dirty
        select_branch_menu
        pull_updates
        update_python
        rebuild_frontend
        restore_stash
        restart_service
        FINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
        FINAL_COMMIT=$(git rev-parse --short HEAD)
        print_summary "$FINAL_BRANCH" "$START_COMMIT" "$FINAL_COMMIT"
        ;;
    3)
        rebuild_frontend
        print_summary "$START_BRANCH" "$START_COMMIT" "$START_COMMIT"
        ;;
    4)
        update_python
        print_summary "$START_BRANCH" "$START_COMMIT" "$START_COMMIT"
        ;;
    5)
        restart_service
        ;;
    6)
        log_item "Updater" "ok" "Exiting without changes"
        exit 0
        ;;
    *)
        handle_dirty
        pull_updates
        update_python
        rebuild_frontend
        restore_stash
        restart_service
        FINAL_COMMIT=$(git rev-parse --short HEAD)
        print_summary "$START_BRANCH" "$START_COMMIT" "$FINAL_COMMIT"
        ;;
esac
