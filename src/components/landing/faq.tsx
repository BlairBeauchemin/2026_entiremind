"use client";

import { Accordion } from "radix-ui";
import { ChevronDown } from "lucide-react";

// Doubts about the product come first, waitlist logistics last. Every answer
// describes what the product actually does: one AI-written prompt a day plus a
// short reply when someone texts back (src/lib/ai, src/lib/acks); silence is
// never punished (src/lib/reconnect.ts: one check-in that offers PAUSE);
// STOP / PAUSE / RESUME are real keywords (the Twilio webhook); and the
// waitlist form asks for first name and email only, with no texts before
// someone enrolls at launch.
const faqs = [
  {
    question: "What is Entiremind?",
    answer:
      "A daily text that keeps you close to what you want. You share what you're creating, we send one thoughtful question a day, and you text back when you feel like it.",
  },
  {
    question: "Is this another app?",
    answer:
      "No. There's nothing to download and nothing to open. Entiremind lives in your messages, and it remembers what you've shared, so each text picks up where you left off.",
  },
  {
    question: "How many texts will I get?",
    answer:
      "Usually one a day. When you reply, you'll get a short response back.",
  },
  {
    question: "What if I don't reply?",
    answer:
      "Nothing happens. There are no streaks and no reminders about what you missed. If you go quiet for a while, we'll check in once and offer to pause.",
  },
  {
    question: "Who reads what I send?",
    answer:
      "Your replies are read by our AI so your next text can reflect what you shared. Our small team may review messages to improve the experience.",
  },
  {
    question: "Is this therapy or coaching?",
    answer:
      "No. Entiremind is a companion for reflection, not a substitute for professional care.",
  },
  {
    question: "Can I stop anytime?",
    answer:
      "Yes. Reply STOP and the texts end. You can also pause and come back when you're ready.",
  },
  {
    question: "What happens when I join the waitlist?",
    answer:
      "You share your first name and email, and that's all. No texts yet. We'll email your invitation when access opens, and you'll choose then whether to enroll.",
  },
  {
    question: "Will it cost money?",
    answer:
      "Joining the waitlist is free. The daily texts will be a paid subscription, and you'll see the price before you decide anything.",
  },
  {
    question: "When will access open?",
    answer: "We'll share the date with the waitlist as soon as it's confirmed.",
  },
];

// Radix Accordion supplies the semantics: each question is a button with
// aria-expanded/aria-controls, answers are labelled regions, and arrow keys,
// Home and End move between questions. All answers start collapsed.
//
// It sits after the blue band, above the shared footer: the full section gap
// above it, and below it only what the footer's own top padding (64px) does
// not already supply, so the gap to the footer matches the rest of the page.
export function FAQ() {
  return (
    <section id="section-faq" className="pt-flow pb-4 lg:pb-20 relative z-10">
      <div className="max-w-xl mx-auto px-6">
        <h2 className="font-serif text-heading text-ink mb-6">
          Questions, answered
        </h2>
        <Accordion.Root type="multiple">
          {faqs.map((faq) => (
            <Accordion.Item key={faq.question} value={faq.question}>
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full min-h-14 items-center justify-between gap-4 py-4 text-left font-sans text-lg text-ink hover:text-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt transition-colors">
                  {faq.question}
                  <ChevronDown
                    aria-hidden="true"
                    className="size-5 shrink-0 text-cobalt transition-transform duration-200 group-data-[state=open]:rotate-180"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="pb-5 pr-9 text-base text-muted font-sans leading-relaxed">
                {faq.answer}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
