import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryStep } from "./category-step";
import { CATEGORY_OPTIONS } from "@/lib/persona/questions";

describe("CategoryStep", () => {
  it("renders the prompt and all eight category options", () => {
    render(
      <CategoryStep
        selected={null}
        onSelect={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/what part of life is calling you/i),
    ).toBeInTheDocument();
    for (const option of CATEGORY_OPTIONS) {
      expect(
        screen.getByRole("button", { name: option.label }),
      ).toBeInTheDocument();
    }
  });

  it("calls onSelect with the chosen category id", () => {
    const onSelect = vi.fn();
    render(
      <CategoryStep
        selected={null}
        onSelect={onSelect}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Money & abundance" }));
    expect(onSelect).toHaveBeenCalledWith("money");
  });

  it("marks the selected category as pressed", () => {
    render(
      <CategoryStep
        selected="career"
        onSelect={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Career & work" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onBack when back is pressed", () => {
    const onBack = vi.fn();
    render(
      <CategoryStep
        selected={null}
        onSelect={vi.fn()}
        onNext={vi.fn()}
        onBack={onBack}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe("auto-advance", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("advances ~250ms after a selection, not before", () => {
      const onNext = vi.fn();
      render(
        <CategoryStep
          selected={null}
          onSelect={vi.fn()}
          onNext={onNext}
          onBack={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Health & body" }));
      expect(onNext).not.toHaveBeenCalled();
      vi.advanceTimersByTime(250);
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });
});
