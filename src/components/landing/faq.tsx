"use client";

import { Accordion } from "radix-ui";
import { ChevronDown } from "lucide-react";

// Five questions: waitlist logistics first, then what the texts are like.
// Every answer describes what the product does, or will do at launch: one
// AI-written prompt a day plus a short reply when someone texts back (src/lib/ai,
// src/lib/acks) -- the "few a week up to one a day" pace choice is a launch
// requirement on the roadmap in CLAUDE.md, not built yet;
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
      "Joining the waitlist is free. After that, Entiremind will cost less each month than a couple of fancy coffees, with a free trial to start so you can see if it's right for you. You'll see the price before you decide anything.",
  },
  {
    question: "How many texts will I get?",
    answer:
      "As many as feels right, from a few a week up to one a day. It's your pace, not ours. Reply whenever you like and you'll get a short note back.",
  },
  {
    question: "What if I don't reply, or want to stop?",
    answer:
      "That's completely fine. There are no streaks and no guilt trips about what you missed. If you go quiet for a while, we'll check in gently and ease off, so texts never pile up. Reply STOP anytime to end them, or PAUSE to take a break and RESUME when you're ready.",
  },
  {
    question: "Who reads what I send?",
    answer:
      "Our AI reads your replies so each text can build on what you've shared, and it remembers what matters to you. A small team may occasionally look at messages to make Entiremind better, and we never sell your information.",
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
