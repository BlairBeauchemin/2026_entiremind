"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Search } from "lucide-react";
import { formatDateTime } from "./types";

export interface CampaignView {
  id: string;
  name: string;
  objective: string;
  campaignType: string;
  status: string;
  totalBudgetCents: number | null;
  dailyBudgetCents: number | null;
  pieceCount: number;
  createdAt: string;
}

interface CampaignListProps {
  brandId: string;
  campaigns: CampaignView[];
}

export function CampaignList({ brandId, campaigns }: CampaignListProps) {
  const router = useRouter();
  const [running, setRunning] = useState<"plan" | "research" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(mode: "plan" | "research") {
    setRunning(mode);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/founder/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, mode }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      setNotice(
        mode === "plan"
          ? `Planned ${body.pieceIds?.length ?? 0} pieces. The daily cron generates them, or use "Generate queued now".`
          : "Trend research complete.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => run("plan")}
          disabled={running !== null}
          className="bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm"
        >
          {running === "plan" ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1" />
          )}
          Plan content now
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => run("research")}
          disabled={running !== null}
          className="border-rule text-ink rounded-sm"
        >
          {running === "research" ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Search className="w-4 h-4 mr-1" />
          )}
          Run trend research
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-sm p-2">
          {error}
        </div>
      )}
      {notice && (
        <div className="text-sm text-ink bg-cobalt-wash border border-rule rounded-sm p-2">
          {notice}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
          No campaigns yet. &quot;Plan content now&quot; creates one from the
          latest trend research.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-muted border-b border-rule">
                <th className="py-2 pr-4">Campaign</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Pieces</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-rule">
                  <td className="py-2 pr-4">
                    <div className="text-ink font-medium">{c.name}</div>
                    {c.objective && (
                      <div className="text-xs text-muted">{c.objective}</div>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-muted">{c.campaignType}</td>
                  <td className="py-2 pr-4 text-muted">{c.status}</td>
                  <td className="py-2 pr-4 text-muted">{c.pieceCount}</td>
                  <td className="py-2 text-muted">
                    {formatDateTime(c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
