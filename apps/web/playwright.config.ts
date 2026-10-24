import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      // Set PW_CHROMIUM_PATH when the machine's browser build differs from this Playwright version (e.g. cloud sandboxes).
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined } },
    },
  ],
  webServer: [
    {
      command: "python3 -m http.server 8100 --directory ../../reference/website-prototype",
      url: "http://localhost:8100/index.html",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm exec next dev -p 3100",
      url: "http://localhost:3100/id",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { EUNIKE_DEV_AUTH: "1", EUNIKE_DEV_AUTH_SECRET: "e2e-only" },
    },
  ],
});
