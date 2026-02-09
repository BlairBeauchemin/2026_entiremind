import { describe, it, expect } from "vitest";
import { formatPhoneInput, cleanPhoneNumber, isValidUSPhone } from "./phone";

describe("formatPhoneInput", () => {
  it("returns empty string for empty input", () => {
    expect(formatPhoneInput("")).toBe("");
  });

  it("formats partial numbers correctly", () => {
    expect(formatPhoneInput("5")).toBe("(5");
    expect(formatPhoneInput("55")).toBe("(55");
    expect(formatPhoneInput("555")).toBe("(555");
    expect(formatPhoneInput("5551")).toBe("(555) 1");
    expect(formatPhoneInput("55512")).toBe("(555) 12");
    expect(formatPhoneInput("555123")).toBe("(555) 123");
    expect(formatPhoneInput("5551234")).toBe("(555) 123-4");
    expect(formatPhoneInput("55512345")).toBe("(555) 123-45");
    expect(formatPhoneInput("555123456")).toBe("(555) 123-456");
    expect(formatPhoneInput("5551234567")).toBe("(555) 123-4567");
  });

  it("strips non-numeric characters", () => {
    expect(formatPhoneInput("(555) 123-4567")).toBe("(555) 123-4567");
    expect(formatPhoneInput("555-123-4567")).toBe("(555) 123-4567");
    expect(formatPhoneInput("555.123.4567")).toBe("(555) 123-4567");
  });

  it("limits to 10 digits", () => {
    expect(formatPhoneInput("55512345678")).toBe("(555) 123-4567");
    expect(formatPhoneInput("5551234567890")).toBe("(555) 123-4567");
  });
});

describe("cleanPhoneNumber", () => {
  it("converts formatted number to E.164", () => {
    expect(cleanPhoneNumber("(555) 123-4567")).toBe("+15551234567");
  });

  it("handles already clean numbers", () => {
    expect(cleanPhoneNumber("5551234567")).toBe("+15551234567");
  });
});

describe("isValidUSPhone", () => {
  it("returns true for valid 10-digit numbers", () => {
    expect(isValidUSPhone("5551234567")).toBe(true);
    expect(isValidUSPhone("(555) 123-4567")).toBe(true);
    expect(isValidUSPhone("555-123-4567")).toBe(true);
  });

  it("returns false for invalid numbers", () => {
    expect(isValidUSPhone("")).toBe(false);
    expect(isValidUSPhone("555123456")).toBe(false); // 9 digits
    expect(isValidUSPhone("55512345678")).toBe(false); // 11 digits
  });
});
