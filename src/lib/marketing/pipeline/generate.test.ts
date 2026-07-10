import { describe, it, expect } from "vitest";
import { terminalStatusFor } from "./generate";

describe("terminalStatusFor", () => {
  it("always sends ads to pending_review, even on auto_publish channels", () => {
    expect(terminalStatusFor("ad", "auto_publish")).toBe("pending_review");
    expect(terminalStatusFor("ad", "require_approval")).toBe("pending_review");
    expect(terminalStatusFor("ad", null)).toBe("pending_review");
  });

  it("schedules organic pieces only when the channel is auto_publish", () => {
    expect(terminalStatusFor("organic", "auto_publish")).toBe("scheduled");
    expect(terminalStatusFor("organic", "require_approval")).toBe("pending_review");
    expect(terminalStatusFor("organic", null)).toBe("pending_review");
  });
});
