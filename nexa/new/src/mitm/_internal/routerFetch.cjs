"use strict";

// Pair fetch and Agent from the same version; Node's bundled dispatcher ABI
// differs between supported runtimes.
const { Agent, fetch } = require("undici");

// Stay below the native ingress's ten-minute idle window. Buffered native
// compaction needs longer than fetch's implicit five-minute headers timeout,
// while an abandoned request must still have a finite deadline.
const configured = Number(process.env.MITM_ROUTER_TIMEOUT_MS);
const timeoutMs =
  Number.isInteger(configured) && configured >= 1000 && configured <= 540000 ? configured : 540000;
let dispatcher;

function transportCode(error) {
  return error?.cause?.code || error?.code || "";
}

async function fetchRouter(url, options, { buffered = false } = {}) {
  dispatcher ||= new Agent({ headersTimeout: timeoutMs, bodyTimeout: timeoutMs });
  const deadline = buffered ? AbortSignal.timeout(timeoutMs) : undefined;
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
    failure.cause = error;
    throw failure;
  }
}

module.exports = { fetchRouter, timeoutMs };
