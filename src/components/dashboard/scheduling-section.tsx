"use client";

import { useState, useCallback } from "react";
import { ScheduleMessageForm } from "./schedule-message-form";
import { ScheduledMessagesTable } from "./scheduled-messages-table";

interface ScheduledMessage {
  id: string;
  toPhone: string;
  text: string;
  scheduledFor: string;
  status: string;
  createdAt: string;
}

interface SchedulingSectionProps {
  initialMessages: ScheduledMessage[];
}

export function SchedulingSection({ initialMessages }: SchedulingSectionProps) {
  const [messages, setMessages] = useState<ScheduledMessage[]>(initialMessages);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMessages = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();

      if (data.success && data.scheduledMessages) {
        const formatted = data.scheduledMessages.map(
          (msg: {
            id: string;
            to_phone: string;
            text: string;
            scheduled_for: string;
            status: string;
            created_at: string;
          }) => ({
            id: msg.id,
            toPhone: msg.to_phone,
            text: msg.text,
            scheduledFor: msg.scheduled_for,
            status: msg.status,
            createdAt: msg.created_at,
          })
        );
        setMessages(formatted);
      }
    } catch (error) {
      console.error("Failed to refresh scheduled messages:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-navy font-medium">
          Schedule Messages
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Schedule SMS messages to be sent during the daily cron job.
        </p>
      </div>

      <ScheduleMessageForm onScheduled={refreshMessages} />

      <div className="relative">
        {isRefreshing && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <div className="text-sm text-teal-900/50">Refreshing...</div>
          </div>
        )}
        <ScheduledMessagesTable messages={messages} onCancelled={refreshMessages} />
      </div>
    </div>
  );
}
