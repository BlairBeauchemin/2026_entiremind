import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("landing page loads successfully", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Entiremind/);
    // The logo link in the header (the footer has one too).
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Entiremind" }),
    ).toBeVisible();
  });

  test("landing page has lead capture form", async ({ page }) => {
    await page.goto("/");

    // The email-first hero form (first name + email) is on the page itself.
    const emailInput = page.getByPlaceholder("Email address").first();
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

test.describe("Phone-first hero (/lp/phone-first)", () => {
  test.use({ viewport: { width: 390, height: 664 } });

  test("orders headline, scene, subhead, form on phones", async ({ page }) => {
    await page.goto("/lp/phone-first");
    const top = async (selector: string) =>
      (await page.locator(selector).first().boundingBox())!.y;
    const h1 = await top("#section-hero h1");
    // The scene is the hero grid's second child (the copy wrapper is first).
    const scene = await top("#section-hero > div > :nth-child(2)");
    const subhead = await top("#section-hero p");
    const form = await top("#join");
    expect(h1).toBeLessThan(scene);
    expect(scene).toBeLessThan(subhead);
    expect(subhead).toBeLessThan(form);
  });
});
