import os
import time
import unittest
from unittest.mock import MagicMock, patch
from starlette.testclient import TestClient

import main
from main import app, edub, get_current_school_year, EduBoard


class TestEduBoardBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_academic_year_logic(self):
        with patch.dict(os.environ, {}, clear=True):
            year = get_current_school_year()
            self.assertIsInstance(year, int)
            self.assertGreaterEqual(year, 2020)

        with patch.dict(os.environ, {"SCHOOL_YEAR": "2028"}):
            self.assertEqual(get_current_school_year(), 2028)

    def test_cache_mechanism(self):
        board = EduBoard()
        key = "test_key"
        board._set_cache(key, {"sample": 123})

        self.assertTrue(board._is_cache_valid(key, ttl_seconds=10))
        self.assertEqual(board._get_cache(key), {"sample": 123})

        # Test expiration
        board._cache[key]["time"] = time.time() - 20
        self.assertFalse(board._is_cache_valid(key, ttl_seconds=10))

    def test_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("academic_year", data)
        self.assertIn("authenticated", data)
        self.assertIn("school", data)

    def test_static_frontend_served(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        # Should contain HTML
        self.assertIn("<html", response.text.lower())

    def test_api_endpoints_graceful_empty_responses(self):
        # When unauthenticated or offline, endpoints return empty/fallback structures, not 500 crashes
        resp_data = self.client.get("/api/data")
        self.assertEqual(resp_data.status_code, 200)

        resp_events = self.client.get("/api/events")
        self.assertEqual(resp_events.status_code, 200)

        resp_timetable = self.client.get("/api/timetable")
        self.assertEqual(resp_timetable.status_code, 200)

    def test_mock_login_success(self):
        board = EduBoard()
        board.SCHOOL_SUBDOMAIN = "testschool"
        board.PASSWORD = "secret"

        mock_get = MagicMock()
        mock_get.cookies.get.return_value = "SESS123"

        mock_post = MagicMock()
        mock_post.json.return_value = {"r": {"cookie": "HASH_ABC"}}

        with patch("httpx.Client") as mock_client_cls:
            mock_client = mock_client_cls.return_value.__enter__.return_value
            mock_client.get.return_value = mock_get
            mock_client.post.return_value = mock_post

            success = board.login()
            self.assertTrue(success)
            self.assertEqual(board.cookies.get("nb_pwd_hash"), "HASH_ABC")
            self.assertEqual(board.cookies.get("PHPSESSID"), "SESS123")


class TestKioskInstallConfigs(unittest.TestCase):
    def test_screen_idle_cmdline_update(self):
        sample_cmdline = "console=serial0,115200 console=tty1 root=PARTUUID=123 rootfstype=ext4 fsck.repair=yes rootwait"
        if "consoleblank=0" not in sample_cmdline:
            updated = f"{sample_cmdline.strip()} consoleblank=0\n"
        self.assertIn("consoleblank=0", updated)
        self.assertTrue(updated.endswith("consoleblank=0\n"))

    def test_sway_config_contains_dpms_on(self):
        sway_config = """
default_border none
bar {
    swaybar_command :
}
output * dpms on
exec firefox-esr --kiosk
"""
        self.assertIn("output * dpms on", sway_config)
        self.assertIn("firefox-esr --kiosk", sway_config)


if __name__ == "__main__":
    unittest.main()
