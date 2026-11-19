"use client";

import { Accordion } from "radix-ui";
import { ChevronDown } from "lucide-react";

// Five questions: waitlist logistics first, then what the texts are like.
// Every answer describes what the product actually does: one AI-written prompt
// a day plus a short reply when someone texts back (src/lib/ai, src/lib/acks);
// silence is never punished (src/lib/reconnect.ts: one check-in that offers
// PAUSE); STOP / PAUSE / RESUME are real keywords (the Twilio webhook); and the
// waitlist form asks for email and an optional first name only, with no texts before
// someone enrolls at launch.
const faqs = [
  {
    question: "What happens when I join the waitlist?",
    answer:
      "You share your email (and first name, if you like), and that's all. No texts yet. We'll email your invitation as soon as access opens (we'll share the date once it's confirmed), and you'll choose then whether to enroll.",
  },
  {
    question: "Will it cost money?",
    answer:
      "Joining the waitlist is free. The daily texts will be a paid subscription, and you'll see the price before you decide anything.",
  },
  {
    question: "How many texts will I get?",
    answer:
      "Usually one a day. When you reply, you'll get a short response back.",
  },
  {
    question: "What if I don't reply, or want to stop?",
    answer:
      "Nothing happens if you don't reply. There are no streaks and no reminders about what you missed. If you go quiet for a while, we'll check in once and offer to pause. And you can stop anytime: reply STOP and the texts end, or pause and come back when you're ready.",
  },
  {
    question: "Who reads what I send?",
    answer:
      "Your replies are read by our AI so your next text can reflect what you shared. Our small team may review messages to improve the experience.",
  },
];

// Radix Accordion supplies the semantics: each question is a button with
// aria-expanded/aria-controls, answers are labelled regions, and arrow keys,
// Home and End move between questions. All answers start collapsed.
//
// It sits after the signup steps and before the blue band (the final ask), so
// like the other linen sections it carries only the section gap below it.
export function FAQ() {
  return (
    <section id="section-faq" className="pb-flow relative z-10">
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
