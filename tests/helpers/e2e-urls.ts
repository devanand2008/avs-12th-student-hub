// Keep this QA server independent of other local builds and browser suites.
export const testAppPort =
  process.env.AVS_PORTAL_QA_BUILD === "true" ? 3140 : 3100;
export const testAppOrigin = `http://127.0.0.1:${testAppPort}`;
export const testFixtureOrigin = `http://127.0.0.1:${testAppPort + 1}`;
