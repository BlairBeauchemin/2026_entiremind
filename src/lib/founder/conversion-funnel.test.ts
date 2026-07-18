import { describe, it, expect } from "vitest";
import { computeConversionFunnel } from "./conversion-funnel";

describe("computeConversionFunnel", () => {
  it("matches leads to users by email case-insensitively", () => {
    const funnel = computeConversionFunnel(
      [{ email: "Amy@Example.com", source: "landing_page" }],
      [{ id: "u1", email: "amy@example.com", onboarding_completed: true }],
      [],
    );
    expect(funnel.totals).toMatchObject({
      leads: 1,
      signups: 1,
      onboarded: 1,
      paid: 0,
    });
  });

  it("counts paid only for active/trialing/past_due monthly-or-yearly subs", () => {
    const users = [
      { id: "u1", email: "a@x.com", onboarding_completed: true },
      { id: "u2", email: "b@x.com", onboarding_completed: true },
      { id: "u3", email: "c@x.com", onboarding_completed: true },
    ];
    const leads = users.map((u) => ({ email: u.email, source: "quiz" }));
    const funnel = computeConversionFunnel(leads, users, [
      { user_id: "u1", status: "active", plan: "monthly" },
      { user_id: "u2", status: "canceled", plan: "yearly" },
      { user_id: "u3", status: "active", plan: "free" },
    ]);
    expect(funnel.totals.paid).toBe(1);
  });

  it("breaks down by source and keeps share-{slug} buckets distinct", () => {
    const funnel = computeConversionFunnel(
      [
        { email: "a@x.com", source: "quiz" },
        { email: "b@x.com", source: "quiz" },
        { email: "c@x.com", source: "share-phoenix" },
        { email: "d@x.com", source: "landing_page" },
        { email: "e@x.com", source: null },
      ],
      [],
      [],
    );
    const sources = Object.fromEntries(
      funnel.bySource.map((r) => [r.source, r.leads]),
    );
    expect(sources).toEqual({
      quiz: 2,
      "share-phoenix": 1,
      landing_page: 1,
      unknown: 1,
    });
    // Sorted by lead volume, biggest first.
    expect(funnel.bySource[0].source).toBe("quiz");
  });

  it("ignores leads without email and users a lead never matched", () => {
    const funnel = computeConversionFunnel(
      [{ email: null, source: "quiz" }],
      [{ id: "u1", email: "organic@x.com", onboarding_completed: true }],
      [{ user_id: "u1", status: "active", plan: "monthly" }],
    );
    expect(funnel.totals).toMatchObject({
      leads: 0,
      signups: 0,
      onboarded: 0,
      paid: 0,
    });
  });
});
