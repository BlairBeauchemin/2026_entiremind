import { mockIntentionHistory, mockMessages } from "@/lib/mock-data";
import { IntentionsTimeline } from "@/components/dashboard/intentions-timeline";

export default function IntentionsPage() {
  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
        Your Intentions
      </h1>

      <IntentionsTimeline
        intentions={mockIntentionHistory}
        messages={mockMessages}
      />
    </div>
  );
}
