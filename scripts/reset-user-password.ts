// Owner-only emergency password reset — SUPABASE_SERVICE_ROLE_KEY 필요, UI에 노출되지 않는다.
// 단독 Admin이 lockout됐을 때 쓰는 최후의 복구 경로다(Phase 4B-9 section 18~23).
//
// Run:
//   npm run reset-user-password -- --login-id chem_mg
//   npm run reset-user-password -- --email mingyo.kim@tanabe-pharma.com
//
// 비밀번호는 CLI argument로 받지 않는다 (shell history에 남는 것을 피하기 위해) — 실행 중
// hidden prompt로 입력받는다.

import { createClient } from "@supabase/supabase-js";

function parseArgs(argv: string[]): { loginId?: string; email?: string } {
  const result: { loginId?: string; email?: string } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--login-id") result.loginId = argv[++i];
    else if (argv[i] === "--email") result.email = argv[++i];
  }
  return result;
}

function readHidden(promptText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    process.stdout.write(promptText);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(new Error("interactive terminal(TTY)이 필요해요."));
      return;
    }
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");

    let value = "";
    const onData = (char: string) => {
      if (char === "") {
        // Ctrl+C
        cleanup();
        process.exit(1);
      }
      if (char === "\r" || char === "\n") {
        cleanup();
        process.stdout.write("\n");
        resolve(value);
        return;
      }
      if (char === "" || char === "\b") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };
    const cleanup = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const { loginId, email } = parseArgs(process.argv.slice(2));
  if (!loginId && !email) {
    console.error("사용법: npm run reset-user-password -- --login-id <id> | --email <email>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("환경변수 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 필요해요.");
    process.exit(1);
  }

  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  let userId: string;
  let resolvedLoginId: string;
  if (loginId) {
    const { data } = await admin.from("profiles").select("user_id, login_id").ilike("login_id", loginId).maybeSingle();
    if (!data) {
      console.error("해당 아이디의 계정을 찾을 수 없어요.");
      process.exit(1);
    }
    userId = data.user_id;
    resolvedLoginId = data.login_id;
  } else {
    const { data } = await admin.auth.admin.listUsers();
    const match = data.users.find((u) => u.email?.toLowerCase() === email!.trim().toLowerCase());
    if (!match) {
      console.error("해당 이메일의 계정을 찾을 수 없어요.");
      process.exit(1);
    }
    const { data: profile } = await admin.from("profiles").select("login_id").eq("user_id", match.id).maybeSingle();
    userId = match.id;
    resolvedLoginId = profile?.login_id ?? match.id;
  }

  const password = await readHidden("New temporary password: ");
  if (password.length < 8) {
    console.error("비밀번호는 8자 이상이어야 해요.");
    process.exit(1);
  }
  const confirm = await readHidden("Confirm: ");
  if (password !== confirm) {
    console.error("비밀번호가 일치하지 않아요.");
    process.exit(1);
  }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { password });
  if (authError) {
    console.error("비밀번호 재설정에 실패했어요.");
    process.exit(1);
  }
  const { error: profileError } = await admin.from("profiles").update({ must_change_password: true }).eq("user_id", userId);
  if (profileError) {
    console.error("비밀번호는 재설정됐지만 must_change_password 갱신에 실패했어요.");
    process.exit(1);
  }

  console.log(`Password reset completed for ${resolvedLoginId}.`);
}

main();
