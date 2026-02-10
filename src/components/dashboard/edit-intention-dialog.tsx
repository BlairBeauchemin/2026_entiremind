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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Your Intention</DialogTitle>
          <DialogDescription>
            Update what you want to manifest. Your intention guides your
            reflection prompts.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[120px] p-3 rounded-lg border border-gray-200 bg-white/80 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-em-purple-300 focus:border-transparent resize-none"
            placeholder="What do you want to manifest?"
            disabled={isPending}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex flex-row justify-end gap-3 pt-4">
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
            className="bg-em-teal hover:bg-em-teal/90"
          >
            {isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
