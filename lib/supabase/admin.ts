// service_role key로 만드는 server-only privileged client.
// login_id → email resolve, 신규 회원 createUser처럼 anon/authenticated로는 할 수 없는 작업에만 쓴다
// (app/api/auth/login/route.ts, app/api/manage/users/route.ts).
// 절대 client component에서 import하지 않는다 — service_role key가 브라우저에 노출된다.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";
import type { Database } from "./database.types";

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("[jodongari] createAdminClient는 서버에서만 호출할 수 있어요.");
  }
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("[jodongari] 환경변수 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았어요.");
  }
  return createSupabaseClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
