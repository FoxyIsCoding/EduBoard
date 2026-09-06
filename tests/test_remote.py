import base64
import time
import unittest
from starlette.testclient import TestClient
from main import app
from remote_hub import remote_hub

class TestRemoteControl(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        remote_hub.state["mode"] = "normal"
        remote_hub.state["revertAt"] = None
        remote_hub.state["autoRevertSeconds"] = None

    def test_get_remote_state(self):
        res = self.client.get("/api/remote/state")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("mode", data)
        self.assertEqual(data["mode"], "normal")

    def test_auth_success_and_failure(self):
        # Default pin 1234
        res_fail = self.client.post("/api/remote/auth", json={"pin": "wrong_pin"})
        self.assertEqual(res_fail.status_code, 401)

        res_ok = self.client.post("/api/remote/auth", json={"pin": "1234"})
        self.assertEqual(res_ok.status_code, 200)
        self.assertTrue(res_ok.json().get("ok"))

    def test_update_remote_state(self):
        # Unauthorized update
        res_unauth = self.client.post("/api/remote/state", json={"mode": "slideshow"})
        self.assertEqual(res_unauth.status_code, 401)

        # Authorized update with X-Admin-PIN
        headers = {"X-Admin-PIN": "1234"}
        res = self.client.post(
            "/api/remote/state",
            json={"mode": "browser", "browserUrl": "https://school.cz"},
            headers=headers,
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["state"]["mode"], "browser")
        self.assertEqual(res.json()["state"]["browserUrl"], "https://school.cz")

    def test_slide_lifecycle(self):
        headers = {"X-Admin-PIN": "1234"}
        # Sample 1x1 transparent PNG base64
        dummy_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        res_upload = self.client.post(
            "/api/remote/slides",
            json={"data": f"data:image/png;base64,{dummy_png}", "caption": "Test Foto"},
            headers=headers,
        )
        self.assertEqual(res_upload.status_code, 200)
        slide_info = res_upload.json()["slide"]
        slide_id = slide_info["id"]

        # Check list
        res_list = self.client.get("/api/remote/slides")
        self.assertEqual(res_list.status_code, 200)
        slides = res_list.json()["slides"]
        self.assertTrue(any(s["id"] == slide_id for s in slides))

        # Delete slide
        res_del = self.client.delete(f"/api/remote/slides/{slide_id}", headers=headers)
        self.assertEqual(res_del.status_code, 200)

    def test_auto_revert_watchdog(self):
        remote_hub.state["mode"] = "slideshow"
        remote_hub.state["revertAt"] = time.time() - 1  # already expired
        remote_hub.state["autoRevertSeconds"] = 10

        import asyncio
        asyncio.run(remote_hub.check_auto_revert())

        self.assertEqual(remote_hub.state["mode"], "normal")
        self.assertIsNone(remote_hub.state["revertAt"])


if __name__ == "__main__":
    unittest.main()
