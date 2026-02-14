"use client";

import { createContext, useContext } from "react";
import type { DbUser, DbSubscription } from "@/lib/supabase";

interface UserContextValue {
  user: DbUser | null;
  subscription: DbSubscription | null;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  user,
  subscription,
  children,
}: {
  user: DbUser | null;
  subscription: DbSubscription | null;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user, subscription }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
