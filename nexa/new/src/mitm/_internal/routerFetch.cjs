"use strict";

// Pair fetch and Agent from the same version; Node's bundled dispatcher ABI
// differs between supported runtimes.
const { Agent, fetch } = require("undici");

// Leave room for the backend's bounded 21-minute active stream budget.
// The native ingress grants a 22-minute idle window only to this local backend.
const configured = Number(process.env.MITM_ROUTER_TIMEOUT_MS);
const isConfigured = Number.isInteger(configured) && configured >= 1000 && configured <= 1_290_000;
const timeoutMs = isConfigured ? configured : 540000;
const nativeBufferedTimeoutMs = isConfigured ? configured : 1_290_000;
const dispatchers = new Map();

function transportCode(error) {
  return error?.cause?.code || error?.code || "";
}

async function fetchRouter(url, options, { buffered = false, nativeThinking = false } = {}) {
  const budget = buffered && nativeThinking ? nativeBufferedTimeoutMs : timeoutMs;
  if (!dispatchers.has(budget))
    dispatchers.set(budget, new Agent({ headersTimeout: budget, bodyTimeout: budget }));
  const dispatcher = dispatchers.get(budget);
  const deadline = buffered ? AbortSignal.timeout(budget) : undefined;
  const signal = deadline
    ? options.signal
      ? AbortSignal.any([options.signal, deadline])
      : deadline
    : options.signal;
  try {
    return await fetch(url, { ...options, dispatcher, signal });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    const timedOut =
      deadline?.aborted ||
      ["UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"].includes(transportCode(error));
    const failure = new Error(
      timedOut
        ? "Agent Bridge timed out waiting for the selected model. Retry the request; the conversation is preserved."
        : "Agent Bridge could not reach the local router. Check the OmniRoute service and retry."
    );
    failure.statusCode = timedOut ? 504 : 502;
    failure.code = timedOut ? "agent_bridge_timeout" : "agent_bridge_transport_error";
    if (timedOut) failure.retryable = false;
    failure.cause = error;
    throw failure;
  }
}

module.exports = { fetchRouter, timeoutMs, nativeBufferedTimeoutMs };
