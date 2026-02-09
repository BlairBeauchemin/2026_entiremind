import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("unauthenticated user visiting /onboarding is redirected to /auth", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL("/auth");
  });

  test("unauthenticated user visiting /dashboard is redirected to /auth", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/auth");
  });

  test("auth page displays login form", async ({ page }) => {
    await page.goto("/auth");

    await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send magic link" })
    ).toBeVisible();
  });

  test("auth page button is disabled without email", async ({ page }) => {
    await page.goto("/auth");

    const submitButton = page.getByRole("button", { name: "Send magic link" });
    await expect(submitButton).toBeDisabled();
  });
});
