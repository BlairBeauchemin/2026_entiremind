import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ArchetypeFlow } from "./archetype-flow";

// Render motion elements as plain DOM and resolve AnimatePresence instantly.
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
    completeArchetypeQuiz: vi.fn(),
    completeFullOnboarding: vi.fn(),
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
  actions.completeArchetypeQuiz.mockReset();
  actions.completeArchetypeQuiz.mockResolvedValue({ success: true });
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

describe("ArchetypeFlow (backfill)", () => {
  it("walks the shortened flow and submits the assembled answers", async () => {
    render(<ArchetypeFlow name="Maya" />);

    // category (auto-advance)
    clickButton("Career & work");
    await advance(250);
    // motivation orientation
    clickButton("I'm reaching toward something I can almost see");
    await advance(250);
    // change style
    clickButton(/The doing\./i);
    await advance(250);
    // past pattern
    clickButton("I start strong, then lose steam");
    await advance(250);
    // first doubt (multi + continue)
    clickButton("If I can't do it perfectly, why start?");
    clickButton(/continue/i);
    await flush();
    // inner voice
    clickButton("You always do this.");
    await advance(250);
    // values (pick 3 + continue)
    clickButton("Freedom");
    clickButton("Creativity");
    clickButton("Peace");
    clickButton(/continue/i);
    await flush();
    // tone
    clickButton("Questions that make me think");
    await advance(250);
    // reveal transition
    await advance(1800);

    expect(
      screen.getByRole("heading", { name: /The Visionary/i }),
    ).toBeInTheDocument();

    // Match the completion CTA specifically — the reveal now also renders a
    // "Share your archetype" button.
    clickButton(/save my archetype/i);
    await flush();

    expect(actions.completeArchetypeQuiz).toHaveBeenCalledTimes(1);
    expect(actions.completeArchetypeQuiz).toHaveBeenCalledWith({
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
    });
    expect(actions.completeFullOnboarding).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("does not render the name/phone/intention/vision steps", () => {
    render(<ArchetypeFlow name="Maya" />);
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ordinary tuesday/i)).not.toBeInTheDocument();
    // Opens directly on the category question.
    expect(screen.getByText("Career & work")).toBeInTheDocument();
  });
});
