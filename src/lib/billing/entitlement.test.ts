import { describe, it, expect } from "vitest";
import { computeEntitlement } from "./entitlement";

const NOW = new Date("2026-07-04T12:00:00Z");
const FUTURE = "2026-07-10T12:00:00Z";
const PAST = "2026-07-01T12:00:00Z";

describe("computeEntitlement", () => {
  it("paid plan with active status is paid", () => {
    expect(
      computeEntitlement(
        { plan: "monthly", status: "active", trial_ends_at: PAST },
        NOW,
      ),
    ).toBe("paid");
  });

  it("past_due keeps entitlement — grace through Stripe's retry cycle", () => {
    expect(
      computeEntitlement(
        { plan: "yearly", status: "past_due", trial_ends_at: PAST },
        NOW,
      ),
    ).toBe("paid");
  });

  it("cancelled paid plan falls back to the trial window check", () => {
    expect(
      computeEntitlement(
        { plan: "monthly", status: "cancelled", trial_ends_at: PAST },
        NOW,
      ),
    ).toBe("expired");
  });

  it("free plan inside the trial window is trial", () => {
    expect(
      computeEntitlement(
        { plan: "free", status: "active", trial_ends_at: FUTURE },
        NOW,
      ),
    ).toBe("trial");
  });

  it("free plan past the trial window is expired", () => {
    expect(
      computeEntitlement(
        { plan: "free", status: "active", trial_ends_at: PAST },
        NOW,
      ),
    ).toBe("expired");
  });

  it("fails toward generosity: no subscription row → trial", () => {
    expect(computeEntitlement(null, NOW)).toBe("trial");
  });

  it("fails toward generosity: free plan with no trial date → trial", () => {
    expect(
      computeEntitlement(
        { plan: "free", status: "active", trial_ends_at: null },
        NOW,
      ),
    ).toBe("trial");
  });
});
