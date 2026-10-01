"use client";

// SupabaseAuthProvider — app/layout.tsx의 기본 Auth provider (Phase 4B-7).
// 실제 로그인은 login_id + password로 하고(email은 회사 소속 인증 수단일 뿐), 신규 계정은
// admin/leader가 /manage/users/new → POST /api/manage/users로 직접 생성한다(초대제, public self-signup 없음).
// 생성 시 email_confirm=true로 만들어지므로 이메일 인증 대기 상태는 더 이상 존재하지 않는다.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "./client";
import { validatePassword } from "../auth/password";
import type { User, UserRole, UserStatus } from "../types";

export type LoginResult = { ok: true } | { ok: false; error: string; code?: "email_not_confirmed" };
export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  onboardingIncomplete: boolean;
  login: (loginId: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<ChangePasswordResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ProfileState {
  user: User | null;
  onboardingIncomplete: boolean;
}

const EMPTY_PROFILE: ProfileState = { user: null, onboardingIncomplete: false };

async function loadProfileState(supabase: ReturnType<typeof createClient>, userId: string): Promise<ProfileState> {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, login_id, nickname, role, status, onboarding_completed, must_change_password")
    .eq("user_id", userId)
    .single();
  if (error || !data) return EMPTY_PROFILE;
  if (!data.onboarding_completed || !data.login_id || !data.nickname) {
    return { user: null, onboardingIncomplete: true };
  }
  return {
    user: {
      id: data.user_id,
      loginId: data.login_id,
      nickname: data.nickname,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      mustChangePassword: data.must_change_password,
    },
    onboardingIncomplete: false,
  };
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // email 미인증 session은 profile row가 있어도 로그인하지 않은 것으로 취급한다
    // (unconfirmed session이 app access를 얻지 못하도록).
    supabase.auth.getSession().then(async ({ data }) => {
      const authUser = data.session?.user;
      const next = authUser?.email_confirmed_at ? await loadProfileState(supabase, authUser.id) : EMPTY_PROFILE;
      if (!cancelled) {
        setProfile(next);
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const next = session?.user?.email_confirmed_at
        ? await loadProfileState(supabase, session.user.id)
        : EMPTY_PROFILE;
      if (!cancelled) setProfile(next);
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

  const logout = () => {
    void supabase.auth.signOut();
    setProfile(EMPTY_PROFILE);
  };

  const changePassword: AuthContextValue["changePassword"] = async (newPassword) => {
    if (!profile.user) return { ok: false, error: "로그인이 필요합니다." };

    const validation = validatePassword(newPassword);
    if (!validation.ok) return validation;

    // 로그인된 사용자는 이미 authenticated session이 있으므로 기존 비밀번호 확인 없이
    // Supabase Auth updateUser만으로 변경한다(Phase 4B-9 section 41) — 다른 사용자의
    // 비밀번호를 바꿀 수 있는 경로가 아니라 본인 session에 한정된 작업이다.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: "비밀번호 변경에 실패했어요. 다시 시도해 주세요." };

    await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", profile.user.id);
    setProfile((prev) => (prev.user ? { ...prev, user: { ...prev.user, mustChangePassword: false } } : prev));
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user: profile.user,
        isLoading,
        onboardingIncomplete: profile.onboardingIncomplete,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within SupabaseAuthProvider");
  return ctx;
}
