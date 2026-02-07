"use client";

import { createContext, useContext } from "react";
import type { DbUser } from "@/lib/supabase";

interface UserContextValue {
  user: DbUser | null;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: DbUser | null;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
