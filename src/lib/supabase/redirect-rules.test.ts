import { describe, it, expect } from "vitest";
import { resolveRouteRedirect } from "./redirect-rules";

describe("resolveRouteRedirect", () => {
  describe("unauthenticated", () => {
    it("sends users on protected routes to /auth", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/dashboard",
          isAuthed: false,
          isOnboarded: false,
        }),
      ).toBe("/auth");
    });

    it("sends users on onboarding routes to /auth", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/onboarding",
          isAuthed: false,
          isOnboarded: false,
        }),
      ).toBe("/auth");
    });

    it("sends users on the archetype route to /auth", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/onboarding/archetype",
          isAuthed: false,
          isOnboarded: false,
        }),
      ).toBe("/auth");
    });

    it("leaves the auth page alone", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/auth",
          isAuthed: false,
          isOnboarded: false,
        }),
      ).toBeNull();
    });
  });

  describe("authenticated on /auth", () => {
    it("routes onboarded users to /dashboard", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/auth",
          isAuthed: true,
          isOnboarded: true,
        }),
      ).toBe("/dashboard");
    });

    it("routes not-onboarded users to /onboarding", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/auth",
          isAuthed: true,
          isOnboarded: false,
        }),
      ).toBe("/onboarding");
    });

    it("never redirects the callback", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/auth/callback",
          isAuthed: true,
          isOnboarded: true,
        }),
      ).toBeNull();
    });
  });

  describe("authenticated, onboarding status enforcement", () => {
    it("sends not-onboarded users off the dashboard to /onboarding", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/dashboard",
          isAuthed: true,
          isOnboarded: false,
        }),
      ).toBe("/onboarding");
    });

    it("sends onboarded users off the full onboarding flow to /dashboard", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/onboarding",
          isAuthed: true,
          isOnboarded: true,
        }),
      ).toBe("/dashboard");
    });

    it("lets onboarded users INTO the archetype retake flow (the M5 fix)", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/onboarding/archetype",
          isAuthed: true,
          isOnboarded: true,
        }),
      ).toBeNull();
    });

    it("lets not-onboarded users continue the full onboarding flow", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/onboarding",
          isAuthed: true,
          isOnboarded: false,
        }),
      ).toBeNull();
    });

    it("lets onboarded users stay on the dashboard", () => {
      expect(
        resolveRouteRedirect({
          pathname: "/dashboard",
          isAuthed: true,
          isOnboarded: true,
        }),
      ).toBeNull();
    });
  });
});
