import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Header, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from remote_hub import remote_hub, SLIDES_DIR

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("EduBoard")

# Load environment
load_dotenv(Path(__file__).resolve().parent / ".env")

LOCAL_MODE = (
    os.getenv("LOCAL_MODE", "0").lower() in ("1", "true", "yes")
    or os.getenv("EDUBOARD_LOCAL_MODE", "0").lower() in ("1", "true", "yes")
    or "--local" in sys.argv
    or "--mock" in sys.argv
)

LOCAL_MOCK_LOOKUP = {
    "classes": {
        "name": "Třídy",
        "data": {
            "c1": "1.A", "c2": "1.B", "c3": "2.A", "c4": "2.B",
            "c5": "3.A", "c6": "3.B", "c7": "4.A", "c8": "4.B",
        },
    },
    "subjects": {
        "name": "Předměty",
        "data": {
            "s_mat": "Matematika", "s_cj": "Český jazyk", "s_aj": "Anglický jazyk",
            "s_nj": "Německý jazyk", "s_fy": "Fyzika", "s_inf": "Informatika",
            "s_dej": "Dějepis", "s_ch": "Chemie", "s_bio": "Biologie",
            "s_tv": "Tělesná výchova", "s_zem": "Zeměpis",
        },
    },
    "teachers": {
        "name": "Učitelé",
        "data": {
            "t_nov": "Mgr. Novák M.", "t_svo": "Ing. Svoboda J.", "t_dvo": "Mgr. Dvořáková E.",
            "t_cer": "RNDr. Černý P.", "t_ves": "Mgr. Veselá K.", "t_hor": "PaedDr. Horák T.",
            "t_kra": "Mgr. Králová L.", "t_pro": "Ing. Procházka M.",
        },
    },
    "classrooms": {
        "name": "Učebny",
        "data": {
            "r_101": "U101", "r_102": "U102", "r_lab": "LAB Fyz",
            "r_inf1": "INF 1", "r_inf2": "INF 2", "r_tel": "Tělocvična",
            "r_aul": "Aula", "r_204": "U204", "r_bio": "LAB Bio",
        },
    },
    "periods": {
        "name": "Zvonění",
        "data": {
            "0": {"name": "0. hodina", "short": "0", "period": "0", "start": "07:10", "end": "07:55"},
            "1": {"name": "1. hodina", "short": "1", "period": "1", "start": "08:00", "end": "08:45"},
            "2": {"name": "2. hodina", "short": "2", "period": "2", "start": "08:55", "end": "09:40"},
            "3": {"name": "3. hodina", "short": "3", "period": "3", "start": "10:00", "end": "10:45"},
            "4": {"name": "4. hodina", "short": "4", "period": "4", "start": "10:55", "end": "11:40"},
            "5": {"name": "5. hodina", "short": "5", "period": "5", "start": "11:50", "end": "12:35"},
            "6": {"name": "6. hodina", "short": "6", "period": "6", "start": "12:45", "end": "13:30"},
            "7": {"name": "7. hodina", "short": "7", "period": "7", "start": "13:40", "end": "14:25"},
        },
    },
    "infoscreens": {
        "name": "Informační tabule",
        "data": [{"id": "1", "enabled": True, "name": "Kiosk", "header": "EduBoard Informační Tabule", "type": "timetable"}],
    },
}

LOCAL_MOCK_TIMETABLE = {
    "classes": [
        {
            "id": "c1",
            "ttitems": [
                {"type": "card", "uniperiod": 1, "starttime": "08:00", "endtime": "08:45", "subjectid": "s_mat", "teacherids": ["t_nov"], "classroomids": ["r_101"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 2, "starttime": "08:55", "endtime": "09:40", "subjectid": "s_cj", "teacherids": ["t_dvo"], "classroomids": ["r_101"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_aj", "teacherids": ["t_ves"], "classroomids": ["r_101"], "groupnames": ["skup. 1"], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_nj", "teacherids": ["t_kra"], "classroomids": ["r_102"], "groupnames": ["skup. 2"], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 4, "starttime": "10:55", "endtime": "11:40", "subjectid": "s_fy", "teacherids": ["t_svo"], "classroomids": ["r_lab"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 5, "starttime": "11:50", "endtime": "12:35", "subjectid": "s_inf", "teacherids": ["t_pro"], "classroomids": ["r_inf1"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 6, "starttime": "12:45", "endtime": "13:30", "subjectid": "s_tv", "teacherids": ["t_hor"], "classroomids": ["r_tel"], "groupnames": [], "changed": False, "removed": False},
            ],
        },
        {
            "id": "c2",
            "ttitems": [
                {"type": "card", "uniperiod": 1, "starttime": "08:00", "endtime": "08:45", "subjectid": "s_cj", "teacherids": ["t_dvo"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 2, "starttime": "08:55", "endtime": "09:40", "subjectid": "s_mat", "teacherids": ["t_nov"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_bio", "teacherids": ["t_cer"], "classroomids": ["r_bio"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 4, "starttime": "10:55", "endtime": "11:40", "subjectid": "s_fy", "teacherids": ["t_ves"], "classroomids": ["r_102"], "groupnames": [], "changed": True, "removed": False},
                {"type": "card", "uniperiod": 5, "starttime": "11:50", "endtime": "12:35", "subjectid": "s_dej", "teacherids": ["t_kra"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
            ],
        },
        {
            "id": "c3",
            "ttitems": [
                {"type": "card", "uniperiod": 1, "starttime": "08:00", "endtime": "08:45", "subjectid": "s_dej", "teacherids": ["t_kra"], "classroomids": ["r_204"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 2, "starttime": "08:55", "endtime": "09:40", "subjectid": "s_mat", "teacherids": ["t_svo"], "classroomids": ["r_204"], "groupnames": [], "changed": True, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_ch", "teacherids": ["t_cer"], "classroomids": ["r_bio"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 4, "starttime": "10:55", "endtime": "11:40", "subjectid": "s_cj", "teacherids": ["t_dvo"], "classroomids": ["r_204"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 5, "starttime": "11:50", "endtime": "12:35", "subjectid": "s_zem", "teacherids": ["t_pro"], "classroomids": ["r_204"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 6, "starttime": "12:45", "endtime": "13:30", "subjectid": "s_aj", "teacherids": ["t_ves"], "classroomids": ["r_204"], "groupnames": [], "changed": False, "removed": False},
            ],
        },
        {
            "id": "c4",
            "ttitems": [
                {"type": "card", "uniperiod": 1, "starttime": "08:00", "endtime": "08:45", "subjectid": "s_inf", "teacherids": ["t_pro"], "classroomids": ["r_inf1"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 2, "starttime": "08:55", "endtime": "09:40", "subjectid": "s_fy", "teacherids": ["t_svo"], "classroomids": ["r_lab"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_mat", "teacherids": ["t_nov"], "classroomids": ["r_101"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 4, "starttime": "10:55", "endtime": "11:40", "subjectid": "s_tv", "teacherids": ["t_hor"], "classroomids": ["r_tel"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 5, "starttime": "11:50", "endtime": "12:35", "subjectid": "s_dej", "teacherids": ["t_kra"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": True},
            ],
        },
        {
            "id": "c5",
            "ttitems": [
                {"type": "card", "uniperiod": 1, "starttime": "08:00", "endtime": "08:45", "subjectid": "s_cj", "teacherids": ["t_dvo"], "classroomids": ["r_204"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 2, "starttime": "08:55", "endtime": "09:40", "subjectid": "s_aj", "teacherids": ["t_ves"], "classroomids": ["r_204"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_ch", "teacherids": ["t_nov"], "classroomids": ["r_lab"], "groupnames": [], "changed": True, "removed": False},
                {"type": "card", "uniperiod": 4, "starttime": "10:55", "endtime": "11:40", "subjectid": "s_mat", "teacherids": ["t_svo"], "classroomids": ["r_204"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 5, "starttime": "11:50", "endtime": "12:35", "subjectid": "s_bio", "teacherids": ["t_cer"], "classroomids": ["r_bio"], "groupnames": [], "changed": False, "removed": False},
            ],
        },
        {
            "id": "c6",
            "ttitems": [
                {"type": "card", "uniperiod": 1, "starttime": "08:00", "endtime": "08:45", "subjectid": "s_mat", "teacherids": ["t_svo"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 2, "starttime": "08:55", "endtime": "09:40", "subjectid": "s_cj", "teacherids": ["t_dvo"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_inf", "teacherids": ["t_pro"], "classroomids": ["r_inf2"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 4, "starttime": "10:55", "endtime": "11:40", "subjectid": "s_dej", "teacherids": ["t_kra"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 5, "starttime": "11:50", "endtime": "12:35", "subjectid": "s_zem", "teacherids": ["t_nov"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
            ],
        },
        {
            "id": "c7",
            "ttitems": [
                {"type": "card", "uniperiod": 1, "starttime": "08:00", "endtime": "08:45", "subjectid": "s_mat", "teacherids": ["t_nov"], "classroomids": ["r_aul"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 2, "starttime": "08:55", "endtime": "09:40", "subjectid": "s_fy", "teacherids": ["t_svo"], "classroomids": ["r_aul"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_cj", "teacherids": ["t_dvo"], "classroomids": ["r_aul"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 4, "starttime": "10:55", "endtime": "11:40", "subjectid": "s_aj", "teacherids": ["t_ves"], "classroomids": ["r_aul"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 6, "starttime": "12:45", "endtime": "13:30", "subjectid": "s_tv", "teacherids": ["t_hor"], "classroomids": ["r_tel"], "groupnames": [], "changed": False, "removed": True},
            ],
        },
        {
            "id": "c8",
            "ttitems": [
                {"type": "card", "uniperiod": 1, "starttime": "08:00", "endtime": "08:45", "subjectid": "s_bio", "teacherids": ["t_cer"], "classroomids": ["r_bio"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 2, "starttime": "08:55", "endtime": "09:40", "subjectid": "s_ch", "teacherids": ["t_cer"], "classroomids": ["r_bio"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 3, "starttime": "10:00", "endtime": "10:45", "subjectid": "s_mat", "teacherids": ["t_nov"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 4, "starttime": "10:55", "endtime": "11:40", "subjectid": "s_cj", "teacherids": ["t_dvo"], "classroomids": ["r_102"], "groupnames": [], "changed": False, "removed": False},
                {"type": "card", "uniperiod": 5, "starttime": "11:50", "endtime": "12:35", "subjectid": "s_inf", "teacherids": ["t_pro"], "classroomids": ["r_inf1"], "groupnames": [], "changed": False, "removed": False},
            ],
        },
    ]
}

LOCAL_MOCK_EVENTS = {
    "classes": [
        {
            "id": "global",
            "ttitems": [
                {
                    "type": "event",
                    "name": "Přednáška: Kybernetická bezpečnost a digitální hygiena",
                    "starttime": "10:00",
                    "endtime": "11:40",
                    "classids": ["c5", "c6", "c7"],
                    "classroomids": ["r_aul"],
                    "teacherids": ["t_svo", "t_pro"],
                    "uniperiod": 3,
                },
                {
                    "type": "event",
                    "name": "Okresní kolo florbalového turnaje SŠ",
                    "starttime": "08:30",
                    "endtime": "14:00",
                    "classids": [],
                    "classroomids": ["r_tel"],
                    "teacherids": ["t_hor"],
                    "uniperiod": "ad",
                },
                {
                    "type": "event",
                    "name": "Přírodovědná exkurze: Planetárium Praha",
                    "starttime": "08:00",
                    "endtime": "13:00",
                    "classids": ["c1", "c2"],
                    "classroomids": [],
                    "teacherids": ["t_cer", "t_ves"],
                    "uniperiod": "ad",
                },
                {
                    "type": "event",
                    "name": "Maturitní generálka – didaktický test ČJL",
                    "starttime": "08:00",
                    "endtime": "10:45",
                    "classids": ["c7", "c8"],
                    "classroomids": ["r_101", "r_102"],
                    "teacherids": ["t_dvo", "t_kra"],
                    "uniperiod": 1,
                },
            ],
        }
    ]
}


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
        if LOCAL_MODE:
            logger.info("EduBoard running in LOCAL MODE (mock dummy data, EduPage authentication bypassed).")
            return True

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
        if LOCAL_MODE:
            return LOCAL_MOCK_LOOKUP

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
        if LOCAL_MODE:
            return LOCAL_MOCK_EVENTS

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
        if LOCAL_MODE:
            return LOCAL_MOCK_TIMETABLE

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

    async def watchdog_loop():
        while True:
            try:
                await remote_hub.check_auto_revert()
            except Exception as e:
                logger.error(f"Error in remote watchdog loop: {e}")
            await asyncio.sleep(2)

    asyncio.create_task(try_startup_login())
    watchdog_task = asyncio.create_task(watchdog_loop())
    yield
    watchdog_task.cancel()


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
        "mode": "local_mock" if LOCAL_MODE else "live",
        "authenticated": True if LOCAL_MODE else ("nb_pwd_hash" in edub.cookies),
        "school": "demo-local" if LOCAL_MODE else edub.SCHOOL_SUBDOMAIN,
        "screen_id": edub.SCREEN_ID,
        "academic_year": get_current_school_year(),
    }


# --- Remote Control & Kiosk WebSocket Hub ---

@app.websocket("/ws/kiosk")
async def websocket_kiosk(websocket: WebSocket, role: str = "display"):
    if role == "controller":
        await remote_hub.connect_controller(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type")
                if msg_type == "webrtc_signal":
                    await remote_hub.relay_webrtc_signal(websocket, data)
                elif msg_type == "state_update":
                    token = data.get("token")
                    if remote_hub.verify_auth(token):
                        await remote_hub.update_state(data.get("data", {}))
                    else:
                        await websocket.send_json({"type": "error", "message": "Neplatný PIN / heslo"})
        except WebSocketDisconnect:
            remote_hub.disconnect_controller(websocket)
    else:
        await remote_hub.connect_display(websocket)
        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type")
                if msg_type == "webrtc_signal":
                    await remote_hub.relay_webrtc_signal(websocket, data)
        except WebSocketDisconnect:
            remote_hub.disconnect_display(websocket)


@app.get("/api/remote/state")
def get_remote_state():
    return remote_hub.state


@app.post("/api/remote/auth")
def post_remote_auth(payload: dict = Body(...)):
    pin = payload.get("pin") or payload.get("password")
    if remote_hub.verify_auth(pin):
        return {"ok": True, "token": pin}
    raise HTTPException(status_code=401, detail="Neplatný PIN nebo administrátorské heslo")


def check_auth(authorization: Optional[str] = Header(None), x_admin_pin: Optional[str] = Header(None)):
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif x_admin_pin:
        token = x_admin_pin.strip()
    elif authorization:
        token = authorization.strip()

    if not remote_hub.verify_auth(token):
        raise HTTPException(status_code=401, detail="Vyžadováno přihlášení (neplatný PIN)")
    return token


@app.post("/api/remote/state")
async def post_remote_state(
    payload: dict = Body(...),
    authorization: Optional[str] = Header(None),
    x_admin_pin: Optional[str] = Header(None),
):
    check_auth(authorization, x_admin_pin)
    updated = await remote_hub.update_state(payload)
    return {"ok": True, "state": updated}


@app.get("/api/remote/slides")
def get_remote_slides():
    return {"slides": remote_hub.state.get("images", [])}


@app.post("/api/remote/slides")
async def post_remote_slide(
    payload: dict = Body(...),
    authorization: Optional[str] = Header(None),
    x_admin_pin: Optional[str] = Header(None),
):
    check_auth(authorization, x_admin_pin)
    b64_data = payload.get("data")
    if not b64_data:
        raise HTTPException(status_code=400, detail="Chybí obrazová data (base64)")
    caption = payload.get("caption", "")
    item = remote_hub.save_slide_image(b64_data, caption)
    await remote_hub.broadcast_state()
    return {"ok": True, "slide": item}


@app.delete("/api/remote/slides/{slide_id}")
async def delete_remote_slide(
    slide_id: str,
    authorization: Optional[str] = Header(None),
    x_admin_pin: Optional[str] = Header(None),
):
    check_auth(authorization, x_admin_pin)
    deleted = remote_hub.delete_slide_image(slide_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Snímek nebyl nalezen")
    await remote_hub.broadcast_state()
    return {"ok": True}


@app.get("/api/remote/slides/{filename}")
def serve_slide_image(filename: str):
    fpath = SLIDES_DIR / filename
    if fpath.exists() and fpath.is_file():
        return FileResponse(fpath)
    raise HTTPException(status_code=404, detail="Soubor nenalezen")


@app.post("/api/remote/cec")
async def post_cec_power(
    payload: dict = Body(...),
    authorization: Optional[str] = Header(None),
    x_admin_pin: Optional[str] = Header(None),
):
    check_auth(authorization, x_admin_pin)
    power_on = payload.get("power", True)
    await remote_hub.update_state({"tvPower": power_on})

    cmd = "echo 'on 0' | cec-client -s -d 1" if power_on else "echo 'standby 0' | cec-client -s -d 1"
    try:
        proc = await asyncio.create_subprocess_shell(cmd, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
        await asyncio.wait_for(proc.communicate(), timeout=3.0)
    except Exception:
        pass

    return {"ok": True, "power": power_on}


# Frontend static files and SPA route mounting
dist_dir = Path(__file__).resolve().parent / "frontend" / "dist"

def frontend_fallback():
    return HTMLResponse(
        "<!DOCTYPE html><html><head><title>EduBoard</title></head>"
        "<body style='font-family:sans-serif;padding:2rem;background:#1a1c1f;color:#e4e6eb;text-align:center;'>"
        "<h2>EduBoard is Starting</h2>"
        "<p>Frontend dist directory has not been built yet. Run <code>npm run build</code> inside the <code>frontend/</code> folder.</p>"
        "</body></html>"
    )

@app.get("/admin")
@app.get("/admin/{path:path}")
def serve_admin():
    admin_index = dist_dir / "index.html"
    if admin_index.exists():
        return FileResponse(admin_index)
    return frontend_fallback()

class SafeStaticFiles(StaticFiles):
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            if scope["type"] == "websocket":
                await send({"type": "websocket.close", "code": 1000})
            return
        await super().__call__(scope, receive, send)


if dist_dir.exists():
    app.mount("/", SafeStaticFiles(directory=dist_dir, html=True), name="frontend")
else:
    @app.get("/")
    def serve_frontend_root():
        return frontend_fallback()


if __name__ == "__main__":
    if LOCAL_MODE:
        logger.info("Starting EduBoard in LOCAL TESTING MODE on http://localhost:8000 (Mock data, screen standby disabled)")
    uvicorn.run(app, host="0.0.0.0", port=8000)
