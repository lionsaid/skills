import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? "3100");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const shouldUseManagedWebServer = !process.env.DEV_BASE_URL && !process.env.STATIC_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: shouldUseManagedWebServer
    ? {
        command: `sh -c "npm run build && cd out && python3 -m http.server ${PORT} --bind 127.0.0.1"`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 240000,
      }
    : undefined,
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1440, height: 1100 },
      },
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
      },
    },
  ],
});
