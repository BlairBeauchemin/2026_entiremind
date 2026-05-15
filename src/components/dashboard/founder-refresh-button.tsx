"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function FounderRefreshButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    // router.refresh() has no callback; clear the spinner after a short delay
    setTimeout(() => setRefreshing(false), 1200);
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-teal-900/60 hover:text-teal-900 hover:bg-teal-900/5 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
      {refreshing ? "Refreshing…" : "Refresh"}
    </button>
  );
}
