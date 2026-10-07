import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "textbook-reader.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 25_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3200",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "reader-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "reader-mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    cwd: path.resolve(__dirname, ".."),
    command:
      "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3200",
    url: "http://127.0.0.1:3200",
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
