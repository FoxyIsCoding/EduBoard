# EduBoard

EduBoard is a fullscreen school board for TVs, kiosks, and hallway displays. It takes the data from an EduPage infoscreen and turns it into a cleaner view of today's timetable and school events. The board is capable of energy saving features like powering the screen off using `wlr-randr` and powering it on only during breaks.

If you just want to run it, the setup is simple: put your EduPage infoscreen details and `WEBSITE_URL` in `.env`, start the project with `./run.sh`, and open that URL. If you are starting from a fresh Ubuntu Server 24.04 install, there is also a one-command installer that sets up the kiosk machine automatically. Under the hood, the project uses a Python service to talk to EduPage and a React frontend to render the board in the browser.

## Screenshots

### Timetable View

<img width="2199" height="1088" alt="eduboard-fullpage" src="https://github.com/user-attachments/assets/5b7e0e54-3be2-4741-977d-b6046af11d98" />

### Events View

<img width="2199" height="1088" alt="eduboard2-fullpage" src="https://github.com/user-attachments/assets/a1ae087e-f491-4b2f-b6d7-8b4a6d7e38b7" />

## Quick Start

### 1. Create `.env`

Use the same keys as `.env.example`:

```env
SCHOOL_SUBDOMAIN=your-school
SCREEN_ID=1
PASSWORD=your-infoscreen-password
WEBSITE_URL=
```

### 2. Start the app

```bash
./run.sh
```

If you want `run.sh` to activate an existing virtual environment first:

```bash
./run.sh /path/to/venv
```

The helper script updates the repo, installs backend dependencies, builds the frontend, and starts the app on port `8000`.

### 3. Open the board

Visit the URL from `WEBSITE_URL`.

## Technical Overview

- backend: FastAPI + `httpx`
- frontend: React + Vite
- runtime: Python + Node.js
- kiosk setup: systemd + Sway + Firefox ESR + `wlr-randr`

## API

The board reads from three local endpoints:

- `GET /api/data` for lookup tables and infoscreen metadata
- `GET /api/timetable` for the current day's timetable
- `GET /api/events` for the current day's events

The built frontend is mounted at `/`.

## Kiosk Install

If you are starting with a fresh Ubuntu Server 24.04 install and want the machine to turn into an EduBoard kiosk automatically, run:

```bash
curl -sSL https://raw.githubusercontent.com/FoxyIsCoding/EduBoard/refs/heads/main/install.sh | bash
```

Or using your custom domain (if configured):
```bash
curl -sSL edupage.yourdomain.com/install.sh | bash
```

The installer will:

- install Python, Node.js, Sway, Firefox ESR, `wlr-randr`, `seatd`, and related packages
- clone the repository into the kiosk user's home directory
- write the `.env` file from the values entered in the setup wizard
- create a Python virtual environment and install backend dependencies
- configure Sway to launch Firefox ESR in kiosk mode against `WEBSITE_URL` from `.env`
- create and enable a systemd service for EduBoard
- optionally install and authenticate Tailscale
- configure a basic UFW firewall

## Updating & Branch Management

EduBoard includes an interactive updater and branch manager with a modern CLI interface:

```bash
./update.sh
```

### Options & Shortcuts

```bash
./update.sh -c              # Fast update current branch non-interactively
./update.sh -b <branch>     # Switch to branch and update (e.g. ./update.sh -b dev)
./update.sh --build-only    # Recompile Vite frontend assets & update pip
./update.sh -c --restart    # Update and reload the EduBoard systemd kiosk service
./update.sh -h              # Display help and usage options
```
