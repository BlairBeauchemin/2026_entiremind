"use client";

import { Accordion } from "radix-ui";
import { ChevronDown } from "lucide-react";

// Answers describe what the waitlist actually does today: the approved form
// collects name, email and phone with optional SMS consent, nothing is texted
// to leads before launch, and enrollment in the daily texts happens
// separately when access opens.
const faqs = [
  {
    question: "What happens when I join?",
    answer:
      "We'll keep you posted on the launch and send your invitation when access opens.",
  },
  {
    question: "Will I start receiving texts now?",
    answer:
      "Not yet. You'll hear from us when access opens, and you'll choose then whether to enroll in the daily texts.",
  },
  {
    question: "Will Entiremind cost money?",
    answer:
      "Joining the waitlist is free. The text experience will be a paid service, with pricing shared before you choose to enroll.",
  },
  {
    question: "When will access open?",
    answer:
      "We'll share the launch date with the waitlist as soon as it's confirmed.",
  },
];

// Radix Accordion supplies the semantics: each question is a button with
// aria-expanded/aria-controls, answers are labelled regions, and arrow keys,
// Home and End move between questions. All answers start collapsed.
export function FAQ() {
  return (
    <section
      id="section-faq"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-xl mx-auto px-6">
        <h2 className="font-serif text-heading text-ink mb-6">
          Questions, answered
        </h2>
        <Accordion.Root
          type="multiple"
          className="divide-y divide-rule border-y border-rule"
        >
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
              <Accordion.Content className="pb-5 pr-9 text-base text-muted font-sans leading-normal">
                {faq.answer}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
