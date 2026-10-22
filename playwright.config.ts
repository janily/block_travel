import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir:"./tests/e2e",testMatch:"**/*.spec.ts",
  fullyParallel:true,forbidOnly:!!process.env.CI,retries:process.env.CI ? 1:0,
  workers:process.env.CI ? 2:undefined,
  reporter:[["list"],["html",{open:"never"}]],
  use:{baseURL:"http://127.0.0.1:3000",launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:undefined,trace:"retain-on-failure"},
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}],
  webServer:{command:"pnpm start",url:"http://127.0.0.1:3000",reuseExistingServer:!process.env.CI,timeout:60000},
});
