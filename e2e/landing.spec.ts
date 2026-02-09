import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("landing page loads successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Entiremind/);
    await expect(page.getByRole("link", { name: "Entiremind" })).toBeVisible();
  });

  test("landing page has lead capture form", async ({ page }) => {
    await page.goto("/");

    // Check for email input (placeholder is "you@example.com")
    const emailInput = page.getByPlaceholder("you@example.com");
    await expect(emailInput).toBeVisible();
  });

  test("navigation links work", async ({ page }) => {
    await page.goto("/");

    // Click sign in link
    const signInLink = page.getByRole("link", { name: /sign in/i });
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL("/auth");
    }
  });
});
