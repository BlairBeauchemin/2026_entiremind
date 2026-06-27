import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OnboardingFlow } from "./onboarding-flow";

// Render motion elements as plain DOM and let AnimatePresence mount/unmount
// instantly — otherwise framer-motion exit animations stall step transitions
// in jsdom.
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
            layout,
            ...rest
          } = props;
          void initial;
          void animate;
          void exit;
          void transition;
          void whileHover;
          void whileTap;
          void layout;
          return React.createElement(tag, { ref, ...rest });
        }),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

const { actions } = vi.hoisted(() => ({
  actions: {
    updateOnboardingName: vi.fn(),
    updateOnboardingPhone: vi.fn(),
    createInitialIntention: vi.fn(),
    completeFullOnboarding: vi.fn(),
    recordOnboardingStep: vi.fn(),
  },
}));
vi.mock("@/lib/onboarding/actions", () => actions);

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  pushMock.mockReset();
  for (const fn of Object.values(actions)) fn.mockReset();
  actions.updateOnboardingName.mockResolvedValue({ success: true });
  actions.updateOnboardingPhone.mockResolvedValue({ success: true });
  actions.createInitialIntention.mockResolvedValue({ success: true });
  actions.completeFullOnboarding.mockResolvedValue({ success: true });
  actions.recordOnboardingStep.mockResolvedValue({ success: true });
});

afterEach(() => vi.useRealTimers());

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
}

function clickButton(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function type(labelId: string, value: string) {
  const el = document.getElementById(labelId) as
    | HTMLInputElement
    | HTMLTextAreaElement;
  fireEvent.change(el, { target: { value } });
}

describe("OnboardingFlow (Visionary path)", () => {
  it("walks the 15 screens and submits the assembled answers", async () => {
    render(<OnboardingFlow />);

    // 1 welcome
    clickButton(/get started/i);
    // 2 name
    type("name", "Maya");
    clickButton(/continue/i);
    await flush();
    // 3 phone
    type("phone", "5551234567");
    clickButton(/continue/i);
    await flush();
    // 4 category (auto-advance)
    clickButton("Career & work");
    await advance(250);
    // 5 intention
    type("intention", "I want to launch my studio");
    clickButton(/continue/i);
    await flush();
    // 6 vision (reworded — ordinary Tuesday)
    expect(screen.getByText(/ordinary tuesday/i)).toBeInTheDocument();
    type("vision", "a calm, unhurried morning");
    clickButton(/continue/i);
    await flush();
    // 7 motivation orientation (auto-advance)
    clickButton("I'm reaching toward something I can almost see");
    await advance(250);
    // 8 change style (auto-advance)
    clickButton(/The doing\./i);
    await advance(250);
    // 9 past pattern (auto-advance)
    clickButton("I start strong, then lose steam");
    await advance(250);
    // 10 first doubt (multi + continue)
    clickButton("If I can't do it perfectly, why start?");
    clickButton(/continue/i);
    await flush();
    // 11 inner voice (auto-advance)
    clickButton("You always do this.");
    await advance(250);
    // 12 values (pick 3 + continue)
    clickButton("Freedom");
    clickButton("Creativity");
    clickButton("Peace");
    clickButton(/continue/i);
    await flush();
    // 13 tone (auto-advance)
    clickButton("Questions that make me think");
    await advance(250);
    // 14 aligned state — skip
    clickButton(/skip/i);
    await flush();
    // 15 reveal transition
    await advance(1800);

    expect(
      screen.getByRole("heading", { name: /The Visionary/i }),
    ).toBeInTheDocument();

    clickButton(/first message/i);
    await flush();

    expect(actions.completeFullOnboarding).toHaveBeenCalledTimes(1);
    expect(actions.completeFullOnboarding).toHaveBeenCalledWith({
      answers: {
        intention_category: "career",
        motivation_orientation: "toward",
        change_style: "dreamer",
        past_pattern: "lose_steam",
        first_doubt: ["not_perfect"],
        inner_voice: "always_do_this",
        core_values: ["freedom", "creativity", "peace"],
        tone_preference: "socratic",
      },
      vision: "a calm, unhurried morning",
      alignedState: null,
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("preserves earlier answers when navigating back", async () => {
    render(<OnboardingFlow />);

    clickButton(/get started/i);
    type("name", "Maya");
    clickButton(/continue/i);
    await flush();
    type("phone", "5551234567");
    clickButton(/continue/i);
    await flush();
    // category select → auto-advances to intention
    clickButton("Career & work");
    await advance(250);
    // go back from intention to category
    clickButton(/back/i);
    await flush();

    expect(
      screen.getByRole("button", { name: "Career & work" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
