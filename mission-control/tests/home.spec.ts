import { test, expect } from "@playwright/test";

const VIEWPORT = { width: 1440, height: 900 };

const BASE_PATH = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000/";

const SNAPSHOT_NAME = `home-${VIEWPORT.width}x${VIEWPORT.height}.png`;

const THRESHOLD = 0.02; // 2%

async function ensureServer(page: any) {
  if (!process.env.PLAYWRIGHT_BASE_URL) {
    return;
  }
}

test.describe("Mission Control visual", () => {
  test("homepage matches baseline", async ({ page }) => {
    await ensureServer(page);
    await page.setViewportSize(VIEWPORT);
    await page.goto(BASE_PATH);
    await page.waitForTimeout(2000);
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(SNAPSHOT_NAME, {
      maxDiffPixelRatio: THRESHOLD,
    });
  });
});
