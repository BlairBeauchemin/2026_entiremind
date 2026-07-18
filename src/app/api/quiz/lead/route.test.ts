import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  updatePayloads: [] as Record<string, unknown>[],
  insertPayloads: [] as Record<string, unknown>[],
  throttled: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  createServiceRoleClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mocks.maybeSingle }),
      }),
      update: (payload: Record<string, unknown>) => {
        mocks.updatePayloads.push(payload);
        return { eq: () => Promise.resolve({ error: null }) };
      },
      insert: (payload: Record<string, unknown>) => {
        mocks.insertPayloads.push(payload);
        return Promise.resolve({ error: null });
      },
    }),
  }),
}));

vi.mock("@/lib/lead-throttle", () => ({
  isLeadWriteThrottled: mocks.throttled,
}));

import { POST } from "./route";

const VALID_ANSWERS = {
  intention_category: "career",
  motivation_orientation: "toward",
  change_style: "doer",
  past_pattern: "lose_steam",
  first_doubt: ["who_am_i"],
  inner_voice: "always_do_this",
  core_values: ["freedom", "growth"],
  tone_preference: "gentle",
};

function quizRequest(overrides: Record<string, unknown> = {}): NextRequest {
  return new NextRequest("https://www.entiremind.com/api/quiz/lead", {
    method: "POST",
    body: JSON.stringify({
      email: "existing@example.com",
      answers: VALID_ANSWERS,
      ...overrides,
    }),
  });
}

describe("POST /api/quiz/lead", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
    mocks.maybeSingle.mockReset();
    mocks.throttled.mockReset().mockResolvedValue(false);
    mocks.updatePayloads.length = 0;
    mocks.insertPayloads.length = 0;
  });

  it("never writes consent, phone, or name onto an existing lead", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "lead-1", name: "Original Owner" },
    });

    const res = await POST(
      quizRequest({
        name: "Attacker",
        phone: "+15551234567",
        smsConsent: true,
        smsConsentLanguage: "I agree to receive texts",
      }),
    );

    expect(res.status).toBe(201);
    expect(mocks.insertPayloads).toHaveLength(0);
    expect(mocks.updatePayloads).toHaveLength(1);
    const update = mocks.updatePayloads[0];
    expect(Object.keys(update).sort()).toEqual([
      "archetype",
      "quiz_answers",
      "quiz_completed_at",
      "quiz_version",
    ]);
  });

  it("stores consent and phone on a newly created lead", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });

    const res = await POST(
      quizRequest({
        email: "new@example.com",
        name: "New Person",
        phone: "+15551234567",
        smsConsent: true,
      }),
    );

    expect(res.status).toBe(201);
    expect(mocks.updatePayloads).toHaveLength(0);
    expect(mocks.insertPayloads).toHaveLength(1);
    const insert = mocks.insertPayloads[0];
    expect(insert.sms_consent).toBe(true);
    expect(insert.phone).toBe("+15551234567");
    expect(insert.archetype).toBeTruthy();
  });

  it("returns 429 when the lead-write throttle trips", async () => {
    mocks.throttled.mockResolvedValue(true);

    const res = await POST(quizRequest());

    expect(res.status).toBe(429);
    expect(mocks.updatePayloads).toHaveLength(0);
    expect(mocks.insertPayloads).toHaveLength(0);
  });
});
