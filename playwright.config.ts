import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 1,
  use: {
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node tests/e2e/servidor.mjs",
    port: 3456,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "chromium-mobile",
      use: { browserName: "chromium", viewport: { width: 375, height: 667 } },
    },
  ],
});