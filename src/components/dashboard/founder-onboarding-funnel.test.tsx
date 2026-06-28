import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { FounderOnboardingFunnel } from "./founder-onboarding-funnel";

describe("FounderOnboardingFunnel", () => {
  it("renders a row for every funnel step in flow order", () => {
    render(<FounderOnboardingFunnel counts={{ welcome: 10 }} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(15);
    expect(rows[0]).toHaveTextContent("Welcome");
    expect(rows[2]).toHaveTextContent("Phone");
    expect(rows[14]).toHaveTextContent("Reveal");
  });

  it("shows each step's user count", () => {
    render(
      <FounderOnboardingFunnel
        counts={{ welcome: 100, phone: 70, reveal: 40 }}
      />,
    );
    const phone = screen.getByText("Phone").closest("li")!;
    expect(within(phone).getByText("70")).toBeInTheDocument();
  });

  it("shows percentage of starts relative to the first step", () => {
    render(
      <FounderOnboardingFunnel
        counts={{ welcome: 100, phone: 70, reveal: 40 }}
      />,
    );
    const reveal = screen.getByText("Reveal").closest("li")!;
    expect(within(reveal).getByText("40%")).toBeInTheDocument();
    const phone = screen.getByText("Phone").closest("li")!;
    expect(within(phone).getByText("70%")).toBeInTheDocument();
  });

  it("treats steps with no events as zero", () => {
    render(<FounderOnboardingFunnel counts={{ welcome: 100 }} />);
    const reveal = screen.getByText("Reveal").closest("li")!;
    expect(within(reveal).getByText("0")).toBeInTheDocument();
    expect(within(reveal).getByText("0%")).toBeInTheDocument();
  });

  it("renders an empty state when there is no funnel data", () => {
    render(<FounderOnboardingFunnel counts={{}} />);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByText(/no onboarding/i)).toBeInTheDocument();
  });
});
