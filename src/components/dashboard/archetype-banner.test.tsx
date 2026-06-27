import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ArchetypeBanner } from "./archetype-banner";

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
          const { initial, animate, exit, transition, ...rest } = props;
          void initial;
          void animate;
          void exit;
          void transition;
          return React.createElement(tag, { ref, ...rest });
        }),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

const { dismissMock } = vi.hoisted(() => ({ dismissMock: vi.fn() }));
vi.mock("@/lib/onboarding/actions", () => ({
  dismissArchetypeBanner: dismissMock,
}));

beforeEach(() => {
  dismissMock.mockReset();
  dismissMock.mockResolvedValue({ success: true });
});

describe("ArchetypeBanner", () => {
  it("invites the user to discover their archetype and links to the quiz", () => {
    render(<ArchetypeBanner />);
    expect(
      screen.getByText(/discover your manifestation archetype/i),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: /discover|start|archetype/i,
    });
    expect(link).toHaveAttribute("href", "/onboarding/archetype");
  });

  it("dismisses: calls the action and removes itself", async () => {
    render(<ArchetypeBanner />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    await waitFor(() => expect(dismissMock).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.queryByText(/discover your manifestation archetype/i),
      ).not.toBeInTheDocument(),
    );
  });
});
