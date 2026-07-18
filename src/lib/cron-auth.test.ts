import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { requireCronAuth } from "./cron-auth";

const SECRET = "test-cron-secret-with-plenty-of-entropy";

function requestWithAuth(header: string | null): Request {
  return new Request("https://example.com/api/cron/daily-send", {
    headers: header ? { authorization: header } : undefined,
  });
}

describe("requireCronAuth", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
  });

  it("returns null for the correct bearer secret", () => {
    expect(requireCronAuth(requestWithAuth(`Bearer ${SECRET}`))).toBeNull();
  });

  it("rejects a wrong secret with 401", () => {
    const res = requireCronAuth(requestWithAuth("Bearer wrong-secret"));
    expect(res?.status).toBe(401);
  });

  it("rejects a same-length wrong secret with 401", () => {
    const flipped = SECRET.slice(0, -1) + (SECRET.endsWith("x") ? "y" : "x");
    const res = requireCronAuth(requestWithAuth(`Bearer ${flipped}`));
    expect(res?.status).toBe(401);
  });

  it("rejects a missing authorization header with 401", () => {
    const res = requireCronAuth(requestWithAuth(null));
    expect(res?.status).toBe(401);
  });

  it("returns 500 when CRON_SECRET is unset", () => {
    delete process.env.CRON_SECRET;
    const res = requireCronAuth(requestWithAuth(`Bearer ${SECRET}`));
    expect(res?.status).toBe(500);
  });
});
