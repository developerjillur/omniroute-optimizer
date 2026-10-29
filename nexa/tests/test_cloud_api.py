import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("cloud_api", Path(__file__).parents[1] / "cloud/verify-api.py")
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)


class NativeAcceptanceTests(unittest.TestCase):
    def test_native_text_excludes_thinking_and_preserves_envelope_identity(self):
        value = {"response": {"candidates": [{"content": {"parts": [
            {"text": "private reasoning", "thought": True}, {"text": "visible"}]}, "finishReason": "STOP"}],
            "usageMetadata": {"promptTokenCount": 12}}}
        result = api.inspect([value], "antigravity", True)
        self.assertEqual(result["text"], "visible")
        self.assertEqual(result["finish_reasons"], ["STOP"])
        self.assertTrue(result["native_envelopes"])
        self.assertEqual(result["usage"], [{"promptTokenCount": 12}])

    def test_openai_shape_cannot_masquerade_as_native_gemini(self):
        value = {"choices": [{"message": {"content": api.MARKER}, "finish_reason": "stop"}]}
        self.assertFalse(api.inspect([value], "antigravity", False)["native_envelopes"])

    def test_responses_stream_does_not_count_completed_snapshot_twice(self):
        values = [{"type": "response.output_text.delta", "delta": api.MARKER},
                  {"type": "response.completed", "response": {"status": "completed", "output": [
                      {"content": [{"type": "output_text", "text": api.MARKER}]}]}}]
        result = api.inspect(values, "responses", True)
        self.assertEqual(result["text"], api.MARKER)
        self.assertEqual(result["finish_reasons"], ["completed"])

    def test_anthropic_stream_requires_message_stop(self):
        delta = {"type": "content_block_delta", "delta": {"type": "text_delta", "text": api.MARKER}}
        self.assertEqual(api.inspect([delta], "claude", True)["finish_reasons"], [])
        self.assertEqual(api.inspect([delta, {"type": "message_stop"}], "claude", True)["finish_reasons"], ["message_stop"])

    def test_credentials_cannot_follow_a_redirect(self):
        self.assertIsNone(api.NoRedirect().redirect_request(None, None, 302, "", {}, "https://other.invalid"))

    def test_http_200_with_empty_generation_cannot_pass_acceptance(self):
        with tempfile.TemporaryDirectory(prefix="nexa-cloud-api-") as folder:
            root = Path(folder)
            credentials = root / "credentials.env"
            credentials.write_text("NEXAOMNI_API_KEY=synthetic-acceptance-key\n")
            credentials.chmod(0o600)
            output = root / "receipt.json"
            def exchange(base, path, key=None, body=None):
                status = 200
                if path == "/v1/models" and key != "synthetic-acceptance-key": status = 401
                values = []
                if body and body.get("model", "").startswith("unavailable-"):
                    status, values = 401, [{"error": {"code": "provider_not_configured"}}]
                elif body and body.get("model", "").endswith("/not-a-model"):
                    status = 400
                return {"http_status": status, "seconds": 0, "provider": None, "model": None}, values, ""
            with patch.object(api, "exchange", exchange), patch.object(sys, "argv", ["verify-api", "--credentials", str(credentials), "--output", str(output)]):
                self.assertEqual(api.main(), 1)
            result = json.loads(output.read_text())
            self.assertFalse(result["passed"])
            self.assertFalse(next(row for row in result["checks"] if row["name"] == "antigravity_sse")["passed"])
            for name in ["invalid_model_rejected", "unconfigured_provider_rejected"]:
                self.assertTrue(next(row for row in result["checks"] if row["name"] == name)["passed"])
            self.assertNotIn("synthetic-acceptance-key", output.read_text())


if __name__ == "__main__":
    unittest.main()
