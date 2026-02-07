import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Database types
export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string | null;
          phone?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          name: string | null;
          timezone: string;
          status: "active" | "paused" | "cancelled";
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string | null;
          name?: string | null;
          timezone?: string;
          status?: "active" | "paused" | "cancelled";
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string | null;
          name?: string | null;
          timezone?: string;
          status?: "active" | "paused" | "cancelled";
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type DbUser = Database["public"]["Tables"]["users"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];

// Lazy-initialized browser client
let browserClient: SupabaseClient | null = null;

/**
 * @deprecated Use `createClient` from `@/lib/supabase/client` for client components
 * or `createClient` from `@/lib/supabase/server` for server components
 */
export function getSupabaseClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not set");
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

// Server-side client with service role key (for API routes)
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * @deprecated Use `createServiceRoleClient` instead
 */
export const createServerClient = createServiceRoleClient;
