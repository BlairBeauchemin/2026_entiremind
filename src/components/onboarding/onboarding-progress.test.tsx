import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingProgress } from "./onboarding-progress";

describe("OnboardingProgress", () => {
  it("renders the correct number of dots", () => {
    render(<OnboardingProgress currentStep={0} totalSteps={4} />);
    const dots = screen.getAllByRole("generic").filter((el) =>
      el.className.includes("rounded-full")
    );
    // Parent div + 4 dot divs
    expect(dots.length).toBeGreaterThanOrEqual(4);
  });

  it("renders with different step counts", () => {
    const { rerender } = render(
      <OnboardingProgress currentStep={0} totalSteps={3} />
    );
    expect(document.querySelectorAll(".rounded-full").length).toBe(3);

    rerender(<OnboardingProgress currentStep={0} totalSteps={5} />);
    expect(document.querySelectorAll(".rounded-full").length).toBe(5);
  });
});
