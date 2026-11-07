import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: true,
  reporter: "list",
  outputDir: "../test-results",
  use: {
    baseURL: "http://127.0.0.1:5175",
    trace: "retain-on-failure",
    launchOptions: {
      ...(process.env.PW_CHROME_PATH
        ? { executablePath: process.env.PW_CHROME_PATH }
        : {}),
    },
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    {
      name: "movil",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort",
    url: "http://127.0.0.1:5175",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
