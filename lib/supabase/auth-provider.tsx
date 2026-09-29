"use client";

// SupabaseAuthProvider — app/layout.tsx의 기본 Auth provider (Phase 4A-2).
// 실제 로그인은 login_id + password로 하고(email은 회사 소속 인증 수단일 뿐), 가입은
// signUp()으로 Supabase Auth email confirmation flow를 그대로 쓴다.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "./client";
import type { User, UserRole, UserStatus } from "../types";

export type LoginResult = { ok: true } | { ok: false; error: string; code?: "email_not_confirmed" };
export type SignUpResult = { ok: true } | { ok: false; error: string };
export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (loginId: string, password: string) => Promise<LoginResult>;
  signUp: (email: string, loginId: string, nickname: string, password: string) => Promise<SignUpResult>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ChangePasswordResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(supabase: ReturnType<typeof createClient>, userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, login_id, nickname, role, status")
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.user_id,
    loginId: data.login_id,
    nickname: data.nickname,
    role: data.role as UserRole,
    status: data.status as UserStatus,
  };
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // email 미인증 session은 profile row가 있어도 로그인하지 않은 것으로 취급한다
    // (section 13/17: unconfirmed session이 app access를 얻지 못하도록).
    supabase.auth.getSession().then(async ({ data }) => {
      const authUser = data.session?.user;
      const profile = authUser?.email_confirmed_at ? await loadProfile(supabase, authUser.id) : null;
      if (!cancelled) {
        setUser(profile);
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session?.user?.email_confirmed_at ? await loadProfile(supabase, session.user.id) : null;
      if (!cancelled) setUser(profile);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const login: AuthContextValue["login"] = async (loginId, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      return {
        ok: false,
        error: body?.error ?? "아이디 또는 비밀번호를 확인해 주세요.",
        code: body?.code,
      };
    }
    return { ok: true };
  };

  const signUp: AuthContextValue["signUp"] = async (email, loginId, nickname, password) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { login_id: loginId.trim(), nickname: nickname.trim() },
        // Site URL 설정과 무관하게 실제 접속 중인 origin으로 확정 리다이렉트한다
        // (Site URL이 나중에 바뀌어도, 지금 origin에서 가입한 사람은 지금 origin으로 돌아온다).
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      if (/이미 사용 중인 아이디/.test(error.message)) return { ok: false, error: error.message };
      if (/already registered|already exists/i.test(error.message)) {
        return { ok: false, error: "이미 가입된 이메일이에요." };
      }
      if (/tanabe-pharma|회사 이메일/i.test(error.message)) {
        return { ok: false, error: "@tanabe-pharma.com 회사 이메일만 가입할 수 있습니다." };
      }
      return { ok: false, error: "가입에 실패했어요. 잠시 후 다시 시도해 주세요." };
    }
    return { ok: true };
  };

  const logout = () => {
    void supabase.auth.signOut();
    setUser(null);
  };

  const changePassword: AuthContextValue["changePassword"] = async (currentPassword, newPassword) => {
    if (!user) return { ok: false, error: "로그인이 필요합니다." };
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email;
    if (!email) return { ok: false, error: "계정 정보를 찾을 수 없습니다." };

    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (reauthError) return { ok: false, error: "현재 비밀번호가 일치하지 않습니다." };

    if (newPassword.length < 8) return { ok: false, error: "새 비밀번호는 8자 이상이어야 해요." };
    if (newPassword === currentPassword) {
      return { ok: false, error: "기존 비밀번호와 다른 비밀번호를 입력해 주세요." };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: "비밀번호 변경에 실패했어요. 다시 시도해 주세요." };
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signUp, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within SupabaseAuthProvider");
  return ctx;
}
