import { test, expect } from "@playwright/test";

/**
 * The Space lives at a top-level route rather than under /dashboard, so its
 * auth gate is a separate wiring job from the dashboard's — the proxy has to
 * name /space in two places for it to work. These check that end to end,
 * against the real proxy, rather than only against the pure rule function.
 *
 * The suite runs unauthenticated (there is no test-session fixture in this
 * project yet), so the signed-in surface is verified by unit tests and by hand.
 */
test.describe("The Space", () => {
  test("unauthenticated user visiting /space is redirected to /auth", async ({
    page,
  }) => {
    await page.goto("/space");
    await expect(page).toHaveURL("/auth");
  });

  test("nested space paths are gated too", async ({ page }) => {
    await page.goto("/space/anything");
    await expect(page).toHaveURL("/auth");
  });

  test("robots.txt keeps crawlers out of the space", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("/space");
  });
});
