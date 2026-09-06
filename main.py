import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("EduBoard")

# Load environment
load_dotenv(Path(__file__).resolve().parent / ".env")


def get_current_school_year() -> int:
    """Determine current academic school year (EduPage format: start year)."""
    configured = os.getenv("SCHOOL_YEAR")
    if configured and configured.strip().isdigit():
        return int(configured.strip())
    now = datetime.now()
    return now.year if now.month >= 8 else now.year - 1


class EduBoard:
    def __init__(self):
        self.SCHOOL_SUBDOMAIN = os.getenv("SCHOOL_SUBDOMAIN", "").strip()
        self.SCREEN_ID = os.getenv("SCREEN_ID", "1").strip()
        self.EVENTS_SCREEN_ID = os.getenv("EVENTS_SCREEN_ID", self.SCREEN_ID or "5").strip()
        self.PASSWORD = os.getenv("PASSWORD", "").strip()
        self.cookies: Dict[str, str] = {}
        self.headers: Dict[str, str] = {}
        self.last_login_time: Optional[float] = None
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _is_cache_valid(self, key: str, ttl_seconds: int) -> bool:
        if key in self._cache:
            entry = self._cache[key]
            if time.time() - entry["time"] < ttl_seconds:
                return True
        return False

    def _set_cache(self, key: str, data: Any):
        self._cache[key] = {"data": data, "time": time.time()}

    def _get_cache(self, key: str) -> Optional[Any]:
        return self._cache.get(key, {}).get("data")

    def login(self) -> bool:
        """Authenticate with EduPage and obtain session cookies."""
        if not self.SCHOOL_SUBDOMAIN or not self.PASSWORD:
            logger.warning("SCHOOL_SUBDOMAIN or PASSWORD not set in .env")
            return False

        base_url = f"https://{self.SCHOOL_SUBDOMAIN}.edupage.org"
        screen_url = f"{base_url}/infoscreen/{self.SCREEN_ID or 1}"
        login_url = f"{base_url}/infoscreen/server/infoscreens.js?__func=infoscreenLogin"

        try:
            with httpx.Client(timeout=12.0, follow_redirects=True) as client:
                r = client.get(screen_url)
                phpsessid = r.cookies.get("PHPSESSID")
                self.cookies = {"PHPSESSID": phpsessid} if phpsessid else {}
                self.headers = {
                    "Referer": screen_url,
                    "Origin": base_url,
                    "User-Agent": "Mozilla/5.0 (EduBoard; Linux)",
                }

                r = client.post(
                    login_url,
                    json={"__args": [None, self.PASSWORD], "__gsh": "00000000"},
                    cookies=self.cookies,
                    headers=self.headers,
                )
                res_data = r.json()
                cookie = res_data.get("r", {}).get("cookie")
                if cookie:
                    self.cookies["nb_pwd_hash"] = cookie
                    self.last_login_time = time.time()
                    logger.info("EduPage authentication successful.")
                    return True
                else:
                    logger.error(f"EduPage login failed: {res_data}")
                    return False
        except Exception as exc:
            logger.error(f"Error connecting to EduPage during login: {exc}")
            return False

    def _post_edupage(self, url: str, payload: dict, retried: bool = False) -> Optional[dict]:
        """Make an authenticated POST request to EduPage with automatic re-login."""
        if "nb_pwd_hash" not in self.cookies:
            if not self.login() and not retried:
                return None

        try:
            with httpx.Client(timeout=15.0) as client:
                r = client.post(
                    url,
                    json=payload,
                    cookies=self.cookies,
                    headers=self.headers,
                )
                data = r.json()

                if "r" not in data or data.get("error"):
                    if not retried:
                        logger.warning("EduPage session possibly expired, retrying login...")
                        if self.login():
                            return self._post_edupage(url, payload, retried=True)
                    return data

                return data
        except Exception as exc:
            logger.error(f"EduPage POST request failed for {url}: {exc}")
            if not retried and ("ConnectError" in str(exc) or "timeout" in str(exc).lower()):
                time.sleep(1)
                return self._post_edupage(url, payload, retried=True)
            return None

    def fetchMainDBI(self) -> dict:
        cache_key = "maindbi"
        if self._is_cache_valid(cache_key, ttl_seconds=60):
            return self._get_cache(cache_key)

        school_year = get_current_school_year()
        url = f"https://{self.SCHOOL_SUBDOMAIN}.edupage.org/rpr/server/maindbi.js?__func=mainDBIAccessor"
        payload = {
            "__args": [
                None,
                school_year,
                {"vt_filter": {}},
                {
                    "op": "fetch",
                    "needed_part": {
                        "infoscreens": [
                            "name",
                            "header",
                            "type",
                            "enabled",
                            "substitution",
                            "timetable",
                            "events",
                            "canteen_menu",
                            "html",
                            "image",
                            "photoalbum",
                            "pdf",
                            "iframe",
                            "combined",
                            "timed",
                            "cycled",
                            "multiday",
                        ],
                        "global_settings": ["infoscreens"],
                        "classes": ["short"],
                        "subjects": ["short"],
                        "teachers": ["short"],
                        "classrooms": ["short"],
                        "periods": [
                            "starttime",
                            "endtime",
                            "short",
                            "name",
                            "firstname",
                            "lastname",
                            "callname",
                            "subname",
                            "code",
                            "period",
                        ],
                    },
                    "needed_combos": {},
                },
            ],
            "__gsh": "00000000",
        }

        res = self._post_edupage(url, payload)
        if not res or "r" not in res:
            cached = self._get_cache(cache_key)
            return cached if cached is not None else {"classes": {}, "subjects": {}, "teachers": {}, "classrooms": {}, "periods": {}, "infoscreens": {}}

        data = {}
        tables = res.get("r", {}).get("tables", [])
        for table in tables:
            t_id = table.get("id")
            if t_id in ["teachers", "subjects", "classrooms", "classes"]:
                data[t_id] = {
                    "name": table.get("def", {}).get("name", ""),
                    "item_name": table.get("def", {}).get("item_name", ""),
                    "icon": table.get("def", {}).get("icon", ""),
                    "data": {
                        row["id"]: row.get("short", "") for row in table.get("data_rows", [])
                    },
                }

            elif t_id == "periods":
                data["periods"] = {
                    "name": table.get("def", {}).get("name", ""),
                    "item_name": table.get("def", {}).get("item_name", ""),
                    "icon": table.get("def", {}).get("icon", ""),
                    "data": {
                        row["id"]: {
                            "name": row.get("name"),
                            "short": row.get("short"),
                            "period": row.get("period"),
                            "start": row.get("starttime"),
                            "end": row.get("endtime"),
                        }
                        for row in table.get("data_rows", [])
                    },
                }

            elif t_id == "infoscreens":
                infoscreens_data = []
                for row in table.get("data_rows", []):
                    infoscreen = {
                        "id": row.get("id"),
                        "enabled": row.get("enabled", False),
                        "name": row.get("name", ""),
                        "header": row.get("header", ""),
                        "type": row.get("type", ""),
                    }
                    for field in [
                        "iframe", "html", "image", "photoalbum", "pdf",
                        "timetable", "substitution", "events", "canteen_menu",
                        "combined", "timed", "cycled", "multiday",
                    ]:
                        if row.get(field) is not None:
                            infoscreen[field] = row.get(field)

                    infoscreens_data.append(infoscreen)

                data["infoscreens"] = {
                    "name": table.get("def", {}).get("name", ""),
                    "item_name": table.get("def", {}).get("item_name", ""),
                    "icon": table.get("def", {}).get("icon", ""),
                    "data": infoscreens_data,
                }

        self._set_cache(cache_key, data)
        return data

    def fetchInfoscreenEventsData(self) -> dict:
        cache_key = "events"
        if self._is_cache_valid(cache_key, ttl_seconds=30):
            return self._get_cache(cache_key)

        screen_id = self.EVENTS_SCREEN_ID or self.SCREEN_ID or "5"
        url = f"https://{self.SCHOOL_SUBDOMAIN}.edupage.org/infoscreen/server/infoscreens.js?__func=getInfoscreenEventsData"
        payload = {
            "__args": [None, str(screen_id), {"date": datetime.now().strftime("%Y-%m-%d")}],
            "__gsh": "00000000",
        }

        res = self._post_edupage(url, payload)
        if not res or "r" not in res:
            cached = self._get_cache(cache_key)
            return cached if cached is not None else {"classes": [{"id": "global", "ttitems": []}]}

        res_inner = res.get("r", {})
        parsed_data = {
            "classes": [
                {
                    "id": "global",
                    "ttitems": [dict(item) for item in res_inner.get("ttitems", [])],
                }
            ]
        }
        self._set_cache(cache_key, parsed_data)
        return parsed_data

    def fetchTimetableData(self) -> dict:
        cache_key = "timetable"
        if self._is_cache_valid(cache_key, ttl_seconds=30):
            return self._get_cache(cache_key)

        screen_id = self.SCREEN_ID or "1"
        url = f"https://{self.SCHOOL_SUBDOMAIN}.edupage.org/infoscreen/server/infoscreens.js?__func=getInfoscreenTimetableData"
        payload = {
            "__args": [None, str(screen_id), {"date": datetime.now().strftime("%Y-%m-%d")}],
            "__gsh": "00000000",
        }

        res = self._post_edupage(url, payload)
        if not res or "r" not in res:
            cached = self._get_cache(cache_key)
            return cached if cached is not None else {"classes": []}

        data = {"classes": []}
        for row in res.get("r", {}).get("rows", []):
            class_data = {"id": row.get("id"), "ttitems": []}
            for item in row.get("ttitems", []):
                class_data["ttitems"].append({k: v for k, v in item.items()})
            data["classes"].append(class_data)

        self._set_cache(cache_key, data)
        return data


# Instantiate service without blocking
edub = EduBoard()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform initial login in background without stalling startup
    async def try_startup_login():
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, edub.login)

    asyncio.create_task(try_startup_login())
    yield


app = FastAPI(title="EduBoard", lifespan=lifespan)

# Allow CORS for development or external kiosk tablets
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/data")
def get_all_data():
    return edub.fetchMainDBI()


@app.get("/api/events")
def get_events():
    return edub.fetchInfoscreenEventsData()


@app.get("/api/timetable")
def get_timetable():
    return edub.fetchTimetableData()


@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "authenticated": "nb_pwd_hash" in edub.cookies,
        "school": edub.SCHOOL_SUBDOMAIN,
        "screen_id": edub.SCREEN_ID,
        "academic_year": get_current_school_year(),
    }


# Frontend static files mounting
dist_dir = Path(__file__).resolve().parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")
else:
    @app.get("/")
    def frontend_fallback():
        return HTMLResponse(
            "<!DOCTYPE html><html><head><title>EduBoard</title></head>"
            "<body style='font-family:sans-serif;padding:2rem;background:#1a1c1f;color:#e4e6eb;text-align:center;'>"
            "<h2>EduBoard is Starting</h2>"
            "<p>Frontend dist directory has not been built yet. Run <code>npm run build</code> inside the <code>frontend/</code> folder.</p>"
            "</body></html>"
        )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
