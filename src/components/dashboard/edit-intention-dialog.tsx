"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateIntention } from "@/lib/onboarding/actions";
import type { Intention } from "@/lib/types";

interface EditIntentionDialogProps {
  intention: Intention;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditIntentionDialog({
  intention,
  open,
  onOpenChange,
}: EditIntentionDialogProps) {
  const [text, setText] = useState(intention.text);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!text.trim()) {
      setError("Intention cannot be empty");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateIntention(intention.id, text.trim());
      if ("error" in result) {
        setError(result.error);
      } else {
        onOpenChange(false);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setText(intention.text);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Edit Your Intention</DialogTitle>
          <DialogDescription>
            Update what you want to manifest.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[80px] p-3 rounded-sm border border-rule bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-transparent resize-none"
            placeholder="What do you want to manifest?"
            disabled={isPending}
          />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex flex-row justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || !text.trim()}
            className="bg-cobalt-wash hover:bg-cobalt-wash text-ink"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
