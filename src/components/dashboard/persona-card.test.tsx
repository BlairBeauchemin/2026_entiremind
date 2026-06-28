import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PersonaCard } from "./persona-card";
import type { PersonaProfile } from "@/lib/persona/types";

// Render motion elements as plain DOM (see onboarding-flow.test.tsx).
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        React.forwardRef(function MotionMock(
          props: Record<string, unknown>,
          ref,
        ) {
          const {
            initial,
            animate,
            exit,
            transition,
            whileHover,
            whileTap,
            ...rest
          } = props;
          void initial;
          void animate;
          void exit;
          void transition;
          void whileHover;
          void whileTap;
          return React.createElement(tag, { ref, ...rest });
        }),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

function profile(overrides: Partial<PersonaProfile> = {}): PersonaProfile {
  return {
    archetype: "visionary",
    motivation_orientation: "toward",
    change_style: "dreamer",
    primary_distortion: "all_or_nothing",
    secondary_distortion: null,
    distortion_scores: { all_or_nothing: 4 },
    core_values: ["freedom", "growth", "peace"],
    tone_preference: "socratic",
    intention_category: "creative",
    ...overrides,
  };
}

describe("PersonaCard", () => {
  it("renders the archetype name", () => {
    render(<PersonaCard profile={profile()} name="Maya" />);
    expect(screen.getByText("The Visionary")).toBeInTheDocument();
  });

  it("renders the inner-critic pattern name when a primary distortion exists", () => {
    render(<PersonaCard profile={profile()} name="Maya" />);
    expect(screen.getByText("The All-or-Nothing Trap")).toBeInTheDocument();
  });

  it("hides the inner-critic section when there is no primary distortion", () => {
    render(
      <PersonaCard
        profile={profile({ primary_distortion: null, distortion_scores: {} })}
        name="Maya"
      />,
    );
    expect(
      screen.queryByText("The All-or-Nothing Trap"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/inner critic/i)).not.toBeInTheDocument();
  });

  it("renders a chip for each core value", () => {
    render(
      <PersonaCard
        profile={profile({ core_values: ["freedom", "growth", "peace"] })}
        name="Maya"
      />,
    );
    expect(screen.getByText("Freedom")).toBeInTheDocument();
    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("Peace")).toBeInTheDocument();
  });

  it("offers a quiet retake link to the archetype flow", () => {
    render(<PersonaCard profile={profile()} name="Maya" />);
    const retake = screen.getByRole("link", { name: /retake/i });
    expect(retake).toHaveAttribute("href", "/onboarding/archetype");
  });
});
