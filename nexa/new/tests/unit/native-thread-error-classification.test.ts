import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyProviderError,
  isResourceNotFoundResponse,
  PROVIDER_ERROR_TYPES,
} from "../../open-sse/services/errorClassifier.ts";

for (const message of [
  "No thread state was found for the requested `previous_message_id`. Replay the full conversation.",
  "No thread state is available for the requested `previous_message_id` on an eligible owning account.",
]) {
  test(`missing native Thread is request-scoped: ${message.split("`")[0]}`, () => {
    const body = { type: "error", error: { type: "invalid_request_error", message } };
    assert.equal(isResourceNotFoundResponse(body), true);
    assert.equal(classifyProviderError(404, body, "claude"), null);
  });
}

test("a genuine missing model retains model lockout classification", () => {
  assert.equal(
    classifyProviderError(404, { error: { message: "Model fixture-missing does not exist" } }, "claude"),
    PROVIDER_ERROR_TYPES.MODEL_NOT_FOUND
  );
});
