"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import type { Database } from "./database.types";

// 브라우저(client component)에서 쓰는 Supabase client. anon key만 사용한다.
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
