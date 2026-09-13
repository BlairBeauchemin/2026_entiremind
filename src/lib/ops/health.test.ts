import { describe, it, expect } from "vitest";
import {
  evaluateHealth,
  overallSeverity,
  expectedSendDeadline,
  DEFAULT_HEALTH_CONFIG,
  type DailySendFacts,
  type HealthInput,
} from "./health";

/** 2026-09-12 — the day the send was missed. */
const AFTER_WINDOW = new Date("2026-09-12T16:30:00Z");
const BEFORE_WINDOW = new Date("2026-09-12T12:00:00Z");

function facts(overrides: Partial<DailySendFacts> = {}): DailySendFacts {
  return {
    lastSuccessAt: new Date("2026-09-12T15:04:00Z"),
    lastSent: 1,
    lastFailed: 0,
    lastPromptAt: new Date("2026-09-12T15:04:00Z"),
    eligibleRecipients: 2,
    ...overrides,
  };
}

function input(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    now: AFTER_WINDOW,
    dailySend: facts(),
    providers: { twilio: null, anthropic: null },
    ...overrides,
  };
}

function byId(checks: ReturnType<typeof evaluateHealth>, id: string) {
  return checks.find((c) => c.id === id);
}

describe("expectedSendDeadline", () => {
  it("anchors to today's UTC date plus the grace window", () => {
    const deadline = expectedSendDeadline(AFTER_WINDOW, DEFAULT_HEALTH_CONFIG);
    // 14:45 scheduled + 90 minutes grace
    expect(deadline.toISOString()).toBe("2026-09-12T16:15:00.000Z");
  });
});

describe("evaluateHealth — daily send", () => {
  it("is healthy when a run succeeded today", () => {
    const checks = evaluateHealth(input());
    expect(overallSeverity(checks)).toBe("ok");
    expect(byId(checks, "daily_send_missing")).toBeUndefined();
  });

  it("does not alert before the send window closes", () => {
    const checks = evaluateHealth(
      input({
        now: BEFORE_WINDOW,
        dailySend: facts({
          // Yesterday's send; today's has not happened yet.
          lastSuccessAt: new Date("2026-09-11T15:04:00Z"),
          lastPromptAt: new Date("2026-09-11T15:04:00Z"),
        }),
      }),
    );
    expect(overallSeverity(checks)).toBe("ok");
    expect(byId(checks, "daily_send_missing")).toBeUndefined();
  });

  it("flags a missed send once the window has closed", () => {
    const checks = evaluateHealth(
      input({
        dailySend: facts({
          lastSuccessAt: new Date("2026-09-11T15:04:00Z"),
          lastPromptAt: new Date("2026-09-11T15:04:00Z"),
        }),
      }),
    );
    expect(overallSeverity(checks)).toBe("critical");
    expect(byId(checks, "daily_send_missing")?.severity).toBe("critical");
  });

  it("catches the 25-hour blind spot a rolling threshold would miss", () => {
    // Yesterday 15:05 → today 16:30 is only 25.4h. A "stale after 26h" rule
    // would call this healthy; the calendar comparison must not.
    const checks = evaluateHealth(
      input({
        dailySend: facts({
          lastSuccessAt: new Date("2026-09-11T15:05:00Z"),
          lastPromptAt: new Date("2026-09-11T15:05:00Z"),
        }),
      }),
    );
    const hoursElapsed =
      (AFTER_WINDOW.getTime() - new Date("2026-09-11T15:05:00Z").getTime()) /
      3_600_000;
    expect(hoursElapsed).toBeLessThan(26);
    expect(byId(checks, "daily_send_missing")?.severity).toBe("critical");
  });

  it("stays quiet when there is nobody to send to", () => {
    const checks = evaluateHealth(
      input({
        dailySend: facts({
          lastSuccessAt: new Date("2026-09-11T15:04:00Z"),
          lastPromptAt: new Date("2026-09-11T15:04:00Z"),
          eligibleRecipients: 0,
        }),
      }),
    );
    expect(overallSeverity(checks)).toBe("ok");
    expect(byId(checks, "daily_send_missing")).toBeUndefined();
  });

  it("falls back to message history when cron_runs is empty (cold start)", () => {
    const checks = evaluateHealth(
      input({
        dailySend: facts({
          lastSuccessAt: null,
          lastSent: null,
          lastFailed: null,
          lastPromptAt: new Date("2026-09-12T15:04:00Z"),
        }),
      }),
    );
    expect(overallSeverity(checks)).toBe("ok");
    expect(byId(checks, "daily_send_missing")).toBeUndefined();
  });

  it("flags a run that succeeded but delivered nothing", () => {
    const checks = evaluateHealth(input({ dailySend: facts({ lastSent: 0 }) }));
    expect(byId(checks, "daily_send_no_output")?.severity).toBe("critical");
  });

  it("warns on per-user failures without going critical", () => {
    const checks = evaluateHealth(
      input({ dailySend: facts({ lastSent: 1, lastFailed: 2 }) }),
    );
    expect(byId(checks, "daily_send_failures")?.severity).toBe("warning");
    expect(overallSeverity(checks)).toBe("warning");
  });

  it("reports no previous send on a completely empty history", () => {
    const checks = evaluateHealth(
      input({
        dailySend: facts({
          lastSuccessAt: null,
          lastPromptAt: null,
          lastSent: null,
          lastFailed: null,
        }),
      }),
    );
    expect(byId(checks, "daily_send_missing")?.detail).toContain(
      "no previous send is on record",
    );
  });
});

describe("evaluateHealth — Twilio balance", () => {
  it("passes a healthy balance", () => {
    const checks = evaluateHealth(
      input({
        providers: {
          twilio: { ok: true, balance: 42.5, currency: "USD" },
          anthropic: null,
        },
      }),
    );
    expect(byId(checks, "twilio_balance")?.severity).toBe("ok");
  });

  it("warns below the threshold", () => {
    const checks = evaluateHealth(
      input({
        providers: {
          twilio: { ok: true, balance: 7, currency: "USD" },
          anthropic: null,
        },
      }),
    );
    expect(byId(checks, "twilio_balance_low")?.severity).toBe("warning");
  });

  it("goes critical below half the threshold", () => {
    const checks = evaluateHealth(
      input({
        providers: {
          twilio: { ok: true, balance: 2, currency: "USD" },
          anthropic: null,
        },
      }),
    );
    expect(byId(checks, "twilio_balance_low")?.severity).toBe("critical");
  });

  it("treats an unreadable balance as a warning, not an outage", () => {
    const checks = evaluateHealth(
      input({
        providers: {
          twilio: { ok: false, error: "401 Unauthorized" },
          anthropic: null,
        },
      }),
    );
    expect(byId(checks, "twilio_unreachable")?.severity).toBe("warning");
    expect(overallSeverity(checks)).toBe("warning");
  });

  it("skips the check entirely when not configured", () => {
    const checks = evaluateHealth(input());
    expect(checks.some((c) => c.id.startsWith("twilio"))).toBe(false);
  });
});

describe("evaluateHealth — Anthropic", () => {
  it("passes when a minimal completion succeeds", () => {
    const checks = evaluateHealth(
      input({ providers: { twilio: null, anthropic: { ok: true } } }),
    );
    expect(byId(checks, "anthropic")?.severity).toBe("ok");
  });

  it("goes critical on exhausted credit", () => {
    const checks = evaluateHealth(
      input({
        providers: {
          twilio: null,
          anthropic: {
            ok: false,
            kind: "credit",
            error: "credit balance is too low",
          },
        },
      }),
    );
    const check = byId(checks, "anthropic_unavailable");
    expect(check?.severity).toBe("critical");
    expect(check?.title).toContain("credit");
  });

  it("goes critical on a rejected key", () => {
    const checks = evaluateHealth(
      input({
        providers: {
          twilio: null,
          anthropic: { ok: false, kind: "auth", error: "invalid x-api-key" },
        },
      }),
    );
    const check = byId(checks, "anthropic_unavailable");
    expect(check?.severity).toBe("critical");
    expect(check?.title).toContain("key");
  });

  it("treats a rate limit as a warning only", () => {
    const checks = evaluateHealth(
      input({
        providers: {
          twilio: null,
          anthropic: { ok: false, kind: "rate_limit", error: "429" },
        },
      }),
    );
    expect(byId(checks, "anthropic_rate_limited")?.severity).toBe("warning");
    expect(overallSeverity(checks)).toBe("warning");
  });
});

describe("overallSeverity", () => {
  it("reports the worst severity present", () => {
    expect(
      overallSeverity([
        { id: "a", severity: "ok", title: "", detail: "" },
        { id: "b", severity: "warning", title: "", detail: "" },
        { id: "c", severity: "critical", title: "", detail: "" },
      ]),
    ).toBe("critical");
    expect(
      overallSeverity([{ id: "a", severity: "ok", title: "", detail: "" }]),
    ).toBe("ok");
  });
});
