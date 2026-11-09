// Share only a request that is currently in flight. Completed authentication
// responses are never cached, and every caller receives its own readable body.
type Flight = { response: Promise<Response>; controller: AbortController };
let flight: Flight | undefined;

export function clearCurrentSessionRequest() {
  const current = flight;
  flight = undefined;
  current?.controller.abort();
}

export function fetchCurrentSession(signal?: AbortSignal): Promise<Response> {
  if (signal?.aborted) return Promise.reject(signal.reason);
  if (!flight) {
    const controller = new AbortController();
    const current: Flight = {
      controller,
      response: fetch("/api/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      }),
    };
    flight = current;
    void current.response.then(
      () => {
        if (flight === current) flight = undefined;
      },
      () => {
        if (flight === current) flight = undefined;
      },
    );
  }
  const response = flight.response;
  return new Promise((resolve, reject) => {
    const abort = () => {
      cleanup();
      reject(signal?.reason);
    };
    const cleanup = () => signal?.removeEventListener("abort", abort);
    signal?.addEventListener("abort", abort, { once: true });
    response.then(
      (result) => {
        cleanup();
        if (!signal?.aborted) resolve(result.clone());
      },
      (error) => {
        cleanup();
        reject(error);
      },
    );
  });
}
