"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, Send, Sparkles, ChevronsUpDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface UserOption {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
}

interface ScheduleMessageFormProps {
  onScheduled?: () => void;
}

export function ScheduleMessageForm({ onScheduled }: ScheduleMessageFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [open, setOpen] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        if (res.ok && data.users) {
          setUsers(data.users);
        }
      } catch {
        console.error("Failed to fetch users");
      }
    }
    fetchUsers();
  }, []);

  // Update phone when user is selected
  const handleUserSelect = (user: UserOption) => {
    setSelectedUser(user);
    setPhoneValue(user.phone);
    setOpen(false);
  };

  const handleGenerateAI = async () => {
    if (!phoneValue) {
      setError("Select a user or enter a phone number first");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate message");
        return;
      }

      // Set the generated message in the textarea
      if (textareaRef.current) {
        textareaRef.current.value = data.message;
      }
    } catch {
      setError("Failed to generate message");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const toPhone = phoneValue || (formData.get("toPhone") as string);
    const text = formData.get("text") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;

    if (!toPhone || !text || !date || !time) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    // Combine date and time into ISO timestamp
    const scheduledFor = new Date(`${date}T${time}`).toISOString();

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toPhone, text, scheduledFor }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to schedule message");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      // Reset form
      (e.target as HTMLFormElement).reset();
      setSelectedUser(null);
      setPhoneValue("");
      if (textareaRef.current) {
        textareaRef.current.value = "";
      }
      onScheduled?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to schedule message");
    } finally {
      setIsLoading(false);
    }
  };

  // Default to tomorrow at 7:45 AM Pacific (cron time)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];
  const defaultTime = "07:45";

  // Display name for selected user
  const getDisplayName = (user: UserOption) => {
    if (user.name) return user.name;
    if (user.email) return user.email;
    return user.phone;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-6 md:p-8"
    >
      <h3 className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50 mb-4">
        Schedule New Message
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
              Select User
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full h-11 justify-between bg-white/60 border-white/60 rounded-xl font-normal"
                >
                  {selectedUser ? (
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-900/40" />
                      {getDisplayName(selectedUser)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Search users...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search by name, email, or phone..." />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.name || ""} ${user.email || ""} ${user.phone}`}
                          onSelect={() => handleUserSelect(user)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user.name || user.email || "Unknown"}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {user.phone}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="toPhone"
              className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
            >
              Phone Number
            </Label>
            <Input
              id="toPhone"
              name="toPhone"
              type="tel"
              placeholder="+1234567890"
              value={phoneValue}
              onChange={(e) => {
                setPhoneValue(e.target.value);
                // Clear selected user if manually editing phone
                if (selectedUser && e.target.value !== selectedUser.phone) {
                  setSelectedUser(null);
                }
              }}
              className="h-11 bg-white/60 border-white/60 rounded-xl font-mono"
            />
          </div>
        </div>

        {/* Date/Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="date"
              className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
            >
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={defaultDate}
              className="h-11 bg-white/60 border-white/60 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="time"
              className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
            >
              Time
            </Label>
            <Input
              id="time"
              name="time"
              type="time"
              defaultValue={defaultTime}
              className="h-11 bg-white/60 border-white/60 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="text"
            className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
          >
            Message
          </Label>
          <div className="flex gap-2">
            <textarea
              id="text"
              name="text"
              rows={3}
              ref={textareaRef}
              placeholder="Enter your message..."
              className="flex-1 px-4 py-3 bg-white/60 border border-white/60 rounded-xl text-navy resize-none focus:outline-none focus:ring-2 focus:ring-em-purple-300/20"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="h-auto px-3 bg-white/60 border-white/60 rounded-xl hover:bg-em-purple-100/50 self-start"
              title="Generate AI message"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-em-purple-500" />
              )}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-navy hover:bg-navy/90 text-white rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Schedule Message
          </Button>

          {success && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm text-emerald-600"
            >
              <Check className="w-4 h-4" />
              Message scheduled
            </motion.div>
          )}
        </div>
      </form>

      <p className="text-xs text-teal-900/40 mt-4">
        Note: Messages are sent during the daily cron job at 7:45 AM Pacific.
      </p>
    </motion.div>
  );
}
