/**
 * The only place on the page a reader sees the product actually work, so it
 * gets the most weight: one bubble, quiet framing, nothing competing.
 *
 * The prompt is set in the SANS inside a message-bubble shape. Setting it in
 * Prata would advertise typography the product cannot deliver — a text message
 * carries none. It is deliberately NOT set at the `device` step either: that
 * ramp belongs to the phone mockup and DESIGN.md reserves it there.
 */
export function V3Example() {
  return (
    <section className="relative z-10 py-section">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mx-auto max-w-[44rem] text-center">
          <h2 className="font-serif text-heading text-balance text-ink">
            A moment to reconnect. A small step to take.
          </h2>
          <p className="mx-auto mt-6 max-w-[52ch] text-body text-muted">
            Imagine you&rsquo;ve set an intention to feel more confident
            speaking up at work. An Entiremind prompt might look like this:
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-[34rem]">
          <div className="rounded-[18px] rounded-tl-[4px] border border-rule bg-surface p-7 text-body text-ink sm:p-9">
            You&rsquo;ve been wanting to share your ideas more openly. Think of
            one you&rsquo;ve kept to yourself this week. What&rsquo;s a small
            way you could put it into words today?
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-[50ch] text-center text-body text-muted">
          A moment to notice what&rsquo;s holding you back&mdash;and an
          invitation to try something different.
        </p>
      </div>
    </section>
  );
}
