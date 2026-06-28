import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ValuesStep } from "./values-step";
import { VALUE_OPTIONS } from "@/lib/persona/questions";

function renderStep(
  props: Partial<React.ComponentProps<typeof ValuesStep>> = {},
) {
  return render(
    <ValuesStep
      selected={props.selected ?? []}
      onChange={props.onChange ?? vi.fn()}
      onNext={props.onNext ?? vi.fn()}
      onBack={props.onBack ?? vi.fn()}
    />,
  );
}

describe("ValuesStep", () => {
  it("renders the prompt and all ten value chips", () => {
    renderStep();
    expect(
      screen.getByText(/pick the three that matter most/i),
    ).toBeInTheDocument();
    for (const option of VALUE_OPTIONS) {
      expect(
        screen.getByRole("button", { name: option.label }),
      ).toBeInTheDocument();
    }
  });

  it("adds an unselected value to the selection", () => {
    const onChange = vi.fn();
    renderStep({ selected: ["freedom"], onChange });
    fireEvent.click(screen.getByRole("button", { name: "Growth" }));
    expect(onChange).toHaveBeenCalledWith(["freedom", "growth"]);
  });

  it("removes a value when tapped again", () => {
    const onChange = vi.fn();
    renderStep({ selected: ["freedom", "growth"], onChange });
    fireEvent.click(screen.getByRole("button", { name: "Freedom" }));
    expect(onChange).toHaveBeenCalledWith(["growth"]);
  });

  it("ignores a fourth selection once three are chosen", () => {
    const onChange = vi.fn();
    renderStep({ selected: ["freedom", "growth", "peace"], onChange });
    fireEvent.click(screen.getByRole("button", { name: "Adventure" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows a progress counter of how many are chosen", () => {
    renderStep({ selected: ["freedom", "growth"] });
    expect(screen.getByText(/2 of 3/i)).toBeInTheDocument();
  });

  it("disables Continue until exactly three are selected", () => {
    const { rerender } = renderStep({ selected: ["freedom", "growth"] });
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    rerender(
      <ValuesStep
        selected={["freedom", "growth", "peace"]}
        onChange={vi.fn()}
        onNext={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).not.toBeDisabled();
  });

  it("calls onNext when Continue is pressed with three selected", () => {
    const onNext = vi.fn();
    renderStep({ selected: ["freedom", "growth", "peace"], onNext });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when back is pressed", () => {
    const onBack = vi.fn();
    renderStep({ onBack });
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
