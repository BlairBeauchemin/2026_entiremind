import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { RevealStep } from "./reveal-step";
import { scoreProfile } from "@/lib/persona/score";
import type { QuizAnswers } from "@/lib/persona/types";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
}));

const { completeMock } = vi.hoisted(() => ({ completeMock: vi.fn() }));
vi.mock("@/lib/onboarding/actions", () => ({
  completeFullOnboarding: completeMock,
}));

const VISIONARY_ANSWERS: QuizAnswers = {
  intention_category: "career",
  motivation_orientation: "toward",
  change_style: "dreamer",
  past_pattern: "lose_steam", // all_or_nothing +1
  first_doubt: ["not_perfect"], // all_or_nothing +2
  inner_voice: "always_do_this", // all_or_nothing +2
  core_values: ["freedom", "creativity", "peace"],
  tone_preference: "socratic",
};

const CONFIDENT_ANSWERS: QuizAnswers = {
  intention_category: "health",
  motivation_orientation: "away",
  change_style: "doer",
  past_pattern: "usually_get_there", // confident, no score
  first_doubt: ["no_doubt"], // confident, exclusive
  inner_voice: "no_pattern", // confident
  core_values: ["growth", "peace", "freedom"],
  tone_preference: "direct",
};

function renderReveal(
  answers: QuizAnswers,
  props: Partial<React.ComponentProps<typeof RevealStep>> = {},
) {
  return render(
    <RevealStep
      profile={scoreProfile(answers)}
      answers={answers}
      name={props.name ?? "Maya"}
      vision={props.vision ?? "an ordinary good Tuesday"}
      alignedState={props.alignedState ?? null}
      transitionMs={props.transitionMs ?? 0}
    />,
  );
}

beforeEach(() => {
  pushMock.mockReset();
  completeMock.mockReset();
  completeMock.mockResolvedValue({ success: true });
});

describe("RevealStep", () => {
  it("reveals the archetype name and a personalized paragraph", async () => {
    renderReveal(VISIONARY_ANSWERS);
    expect(await screen.findByText(/The Visionary/i)).toBeInTheDocument();
    // Name woven into the paragraph
    expect(screen.getByText(/Maya/)).toBeInTheDocument();
  });

  it("renders the inner-critic section when a pattern scored", async () => {
    renderReveal(VISIONARY_ANSWERS);
    expect(
      await screen.findByRole("heading", { name: /The All-or-Nothing Trap/i }),
    ).toBeInTheDocument();
  });

  it("omits the inner-critic section when no pattern scored", async () => {
    renderReveal(CONFIDENT_ANSWERS);
    // Wait for reveal to render
    await screen.findByText(/The Phoenix/i);
    expect(screen.queryByText(/favorite trick/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Trap|Whisper|Other Shoe/i),
    ).not.toBeInTheDocument();
  });

  it("renders the three how-it-works lines", async () => {
    renderReveal(VISIONARY_ANSWERS);
    await screen.findByText(/The Visionary/i);
    expect(screen.getByText(/each morning/i)).toBeInTheDocument();
    expect(screen.getByText(/journal that answers back/i)).toBeInTheDocument();
    expect(screen.getByText(/the more you share/i)).toBeInTheDocument();
  });

  it("submits the raw answers and navigates to the dashboard on success", async () => {
    renderReveal(VISIONARY_ANSWERS, {
      vision: "an ordinary good Tuesday",
      alignedState: "on a long morning walk",
    });
    fireEvent.click(
      await screen.findByRole("button", { name: /first message/i }),
    );

    await waitFor(() =>
      expect(completeMock).toHaveBeenCalledWith({
        answers: VISIONARY_ANSWERS,
        vision: "an ordinary good Tuesday",
        alignedState: "on a long morning walk",
      }),
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("uses a custom onComplete + submit label when provided (retake flow)", async () => {
    const onComplete = vi.fn().mockResolvedValue({ success: true });
    render(
      <RevealStep
        profile={scoreProfile(VISIONARY_ANSWERS)}
        answers={VISIONARY_ANSWERS}
        name="Maya"
        transitionMs={0}
        submitLabel="See your archetype"
        onComplete={onComplete}
      />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /see your archetype/i }),
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(completeMock).not.toHaveBeenCalled();
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows an error and does not navigate when completion fails", async () => {
    completeMock.mockResolvedValue({ error: "Something went wrong" });
    renderReveal(VISIONARY_ANSWERS);
    fireEvent.click(
      await screen.findByRole("button", { name: /first message/i }),
    );

    expect(
      await screen.findByText(/something went wrong/i),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  describe("transition", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("shows a reading-your-answers transition before the reveal", () => {
      render(
        <RevealStep
          profile={scoreProfile(VISIONARY_ANSWERS)}
          answers={VISIONARY_ANSWERS}
          name="Maya"
          vision="v"
          alignedState={null}
          transitionMs={1800}
        />,
      );
      expect(screen.getByText(/reading your answers/i)).toBeInTheDocument();
      expect(screen.queryByText(/The Visionary/i)).not.toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1800);
      });
      expect(screen.getByText(/The Visionary/i)).toBeInTheDocument();
    });

    it("lets the user tap to skip the transition", () => {
      render(
        <RevealStep
          profile={scoreProfile(VISIONARY_ANSWERS)}
          answers={VISIONARY_ANSWERS}
          name="Maya"
          vision="v"
          alignedState={null}
          transitionMs={1800}
        />,
      );
      fireEvent.click(screen.getByText(/reading your answers/i));
      expect(screen.getByText(/The Visionary/i)).toBeInTheDocument();
    });
  });
});
