import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import type { Database } from "./database.types";

// Server component / route handler에서 쓰는 Supabase client. 요청 쿠키에서 session을 읽는다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component에서 호출되면 쓰기가 무시된다 — middleware가 session refresh를 담당하므로 안전하다.
        }
      },
    },
  });
}
