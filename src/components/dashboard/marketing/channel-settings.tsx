"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ChannelView {
  id: string;
  platform: string;
  publishMode: "require_approval" | "auto_publish";
  connected: boolean;
}

interface ChannelSettingsProps {
  channels: ChannelView[];
}

const PLATFORM_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/**
 * Per-channel publish mode. Meta Ads is locked to require_approval — paid
 * ads always pass founder review (also enforced server-side).
 */
export function ChannelSettings({ channels: initialChannels }: ChannelSettingsProps) {
  const router = useRouter();
  const [channels, setChannels] = useState(initialChannels);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setMode(id: string, publishMode: "require_approval" | "auto_publish") {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/founder/marketing/channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish_mode: publishMode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      setChannels((prev) =>
        prev.map((c) => (c.id === id ? { ...c, publishMode } : c)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {channels.map((channel) => {
          const isAds = channel.platform === "meta_ads";
          return (
            <div
              key={channel.id}
              className="bg-white/60 border border-em-purple-300/40 rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-navy">
                  {PLATFORM_LABELS[channel.platform] ?? channel.platform}
                </div>
                <span
                  className={`text-[11px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    channel.connected
                      ? "bg-em-yellow-200/60 text-navy"
                      : "bg-teal-900/10 text-teal-900/60"
                  }`}
                >
                  {channel.connected ? "Connected" : "Not connected"}
                </span>
              </div>

              {isAds ? (
                <p className="text-xs text-teal-900/50">
                  Always requires approval — paid ads never launch without your review.
                </p>
              ) : (
                <label className="flex items-center gap-2 text-xs text-teal-900/60">
                  Publish mode
                  <select
                    value={channel.publishMode}
                    onChange={(e) =>
                      setMode(channel.id, e.target.value as "require_approval" | "auto_publish")
                    }
                    disabled={pendingId === channel.id}
                    className="rounded-xl border border-em-purple-300/40 bg-white/80 px-2 py-1 text-xs text-navy focus:outline-none focus:ring-2 focus:ring-em-purple-400"
                  >
                    <option value="require_approval">Require approval</option>
                    <option value="auto_publish">Auto-publish</option>
                  </select>
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
