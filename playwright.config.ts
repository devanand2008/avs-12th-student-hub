import { defineConfig, devices } from "@playwright/test";
import { testAppOrigin } from "./tests/helpers/e2e-urls";
const portalQa = process.env.AVS_PORTAL_QA_BUILD === "true";
export default defineConfig({
  outputDir: portalQa ? ".local/portal-playwright-results" : "test-results",
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: portalQa
          ? ".local/portal-playwright-report"
          : "playwright-report",
      },
    ],
  ],
  use: {
    baseURL: testAppOrigin,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "node --import tsx scripts/start-test-server.ts",
    url: testAppOrigin,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
