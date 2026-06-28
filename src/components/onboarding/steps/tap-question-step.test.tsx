import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TapQuestionStep } from "./tap-question-step";

const OPTIONS = [
  { id: "a", label: "Option A" },
  { id: "b", label: "Option B" },
  { id: "c", label: "Option C" },
];

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("TapQuestionStep", () => {
  it("renders the title, subtitle, and every option label", () => {
    render(
      <TapQuestionStep
        title="Which feels more true?"
        subtitle="Be honest"
        options={OPTIONS}
        mode="single"
        selected={[]}
        onSelect={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText("Which feels more true?")).toBeInTheDocument();
    expect(screen.getByText("Be honest")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Option A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Option B" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Option C" }),
    ).toBeInTheDocument();
  });

  it("calls onBack when the back button is pressed", () => {
    const onBack = vi.fn();
    render(
      <TapQuestionStep
        title="t"
        options={OPTIONS}
        mode="single"
        selected={[]}
        onSelect={vi.fn()}
        onNext={vi.fn()}
        onBack={onBack}
      />,
    );

    click(/back/i);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  describe("single-select", () => {
    it("calls onSelect with the chosen id", () => {
      const onSelect = vi.fn();
      render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="single"
          selected={[]}
          onSelect={onSelect}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );

      click("Option B");
      expect(onSelect).toHaveBeenCalledWith(["b"]);
    });

    it("marks the selected option as pressed", () => {
      render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="single"
          selected={["c"]}
          onSelect={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: "Option C" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "Option A" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("does not render a Continue button (auto-advances)", () => {
      render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="single"
          selected={[]}
          onSelect={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );
      expect(
        screen.queryByRole("button", { name: /continue/i }),
      ).not.toBeInTheDocument();
    });

    describe("auto-advance timing", () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());

      it("advances ~250ms after a selection, not before", () => {
        const onNext = vi.fn();
        render(
          <TapQuestionStep
            title="t"
            options={OPTIONS}
            mode="single"
            selected={[]}
            onSelect={vi.fn()}
            onNext={onNext}
            onBack={vi.fn()}
          />,
        );

        click("Option A");
        expect(onNext).not.toHaveBeenCalled();

        vi.advanceTimersByTime(250);
        expect(onNext).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("multi-select", () => {
    it("adds an unselected option to the current selection", () => {
      const onSelect = vi.fn();
      render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="multi"
          max={2}
          selected={["a"]}
          onSelect={onSelect}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );

      click("Option B");
      expect(onSelect).toHaveBeenCalledWith(["a", "b"]);
    });

    it("removes an already-selected option when tapped again", () => {
      const onSelect = vi.fn();
      render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="multi"
          max={2}
          selected={["a", "b"]}
          onSelect={onSelect}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );

      click("Option A");
      expect(onSelect).toHaveBeenCalledWith(["b"]);
    });

    it("ignores taps that would exceed max", () => {
      const onSelect = vi.fn();
      render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="multi"
          max={2}
          selected={["a", "b"]}
          onSelect={onSelect}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );

      click("Option C");
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("an exclusive option replaces any existing selection", () => {
      const onSelect = vi.fn();
      const opts = [...OPTIONS, { id: "none", label: "None", exclusive: true }];
      render(
        <TapQuestionStep
          title="t"
          options={opts}
          mode="multi"
          max={2}
          selected={["a", "b"]}
          onSelect={onSelect}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );

      click("None");
      expect(onSelect).toHaveBeenCalledWith(["none"]);
    });

    it("selecting a normal option clears a previously-exclusive selection", () => {
      const onSelect = vi.fn();
      const opts = [...OPTIONS, { id: "none", label: "None", exclusive: true }];
      render(
        <TapQuestionStep
          title="t"
          options={opts}
          mode="multi"
          max={2}
          selected={["none"]}
          onSelect={onSelect}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );

      click("Option A");
      expect(onSelect).toHaveBeenCalledWith(["a"]);
    });

    it("disables Continue until at least one option is selected", () => {
      const { rerender } = render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="multi"
          max={2}
          selected={[]}
          onSelect={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );
      expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

      rerender(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="multi"
          max={2}
          selected={["a"]}
          onSelect={vi.fn()}
          onNext={vi.fn()}
          onBack={vi.fn()}
        />,
      );
      expect(
        screen.getByRole("button", { name: /continue/i }),
      ).not.toBeDisabled();
    });

    it("calls onNext when Continue is pressed with a selection", () => {
      const onNext = vi.fn();
      render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="multi"
          max={2}
          selected={["a"]}
          onSelect={vi.fn()}
          onNext={onNext}
          onBack={vi.fn()}
        />,
      );

      click(/continue/i);
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("does not auto-advance on selection in multi mode", () => {
      const onNext = vi.fn();
      render(
        <TapQuestionStep
          title="t"
          options={OPTIONS}
          mode="multi"
          max={2}
          selected={[]}
          onSelect={vi.fn()}
          onNext={onNext}
          onBack={vi.fn()}
        />,
      );

      click("Option A");
      expect(onNext).not.toHaveBeenCalled();
    });
  });
});
