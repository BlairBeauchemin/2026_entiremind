import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlignedStateStep } from "./aligned-state-step";

function renderStep(
  props: Partial<React.ComponentProps<typeof AlignedStateStep>> = {},
) {
  return render(
    <AlignedStateStep
      value={props.value ?? ""}
      onChange={props.onChange ?? vi.fn()}
      onNext={props.onNext ?? vi.fn()}
      onSkip={props.onSkip ?? vi.fn()}
      onBack={props.onBack ?? vi.fn()}
    />,
  );
}

describe("AlignedStateStep", () => {
  it("renders the prompt", () => {
    renderStep();
    expect(
      screen.getByText(/when do you feel most like yourself/i),
    ).toBeInTheDocument();
  });

  it("disables Continue when empty and enables it with text", () => {
    const { rerender } = renderStep({ value: "" });
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    rerender(
      <AlignedStateStep
        value="on a long walk"
        onChange={vi.fn()}
        onNext={vi.fn()}
        onSkip={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).not.toBeDisabled();
  });

  it("advances via onNext when Continue is pressed with text", () => {
    const onNext = vi.fn();
    renderStep({ value: "on a long walk", onNext });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("advances via onSkip even when empty", () => {
    const onSkip = vi.fn();
    renderStep({ value: "", onSkip });
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when back is pressed", () => {
    const onBack = vi.fn();
    renderStep({ onBack });
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
