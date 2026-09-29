"use client";

// SupabaseAuthProvider — app/layout.tsx의 기본 Auth provider (Phase 4B-5).
// 실제 로그인은 login_id + password로 하고(email은 회사 소속 인증 수단일 뿐), 가입은
// email OTP(signInWithOtp/verifyOtp)로 회사 이메일을 인증한 뒤 /signup/profile에서
// login_id/nickname/password를 채워 onboarding을 완료한다.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "./client";
import type { User, UserRole, UserStatus } from "../types";

export type LoginResult = { ok: true } | { ok: false; error: string; code?: "email_not_confirmed" };
export type OtpResult = { ok: true } | { ok: false; error: string };
export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  onboardingIncomplete: boolean;
  login: (loginId: string, password: string) => Promise<LoginResult>;
  requestEmailOtp: (email: string) => Promise<OtpResult>;
  verifyEmailOtp: (email: string, token: string) => Promise<OtpResult>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ChangePasswordResult>;
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
    .select("user_id, login_id, nickname, role, status, onboarding_completed")
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

  const requestEmailOtp: AuthContextValue["requestEmailOtp"] = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) {
      if (/tanabe-pharma|회사 이메일/i.test(error.message)) {
        return { ok: false, error: "@tanabe-pharma.com 회사 이메일만 가입할 수 있습니다." };
      }
      if (/rate limit|too many/i.test(error.message)) {
        return { ok: false, error: "잠시 후 다시 시도해 주세요." };
      }
      return { ok: false, error: "인증번호 발송에 실패했어요. 잠시 후 다시 시도해 주세요." };
    }
    return { ok: true };
  };

  const verifyEmailOtp: AuthContextValue["verifyEmailOtp"] = async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: "email" });
    if (error) {
      if (/expired/i.test(error.message)) {
        return { ok: false, error: "인증번호가 만료되었습니다. 다시 받아 주세요." };
      }
      return { ok: false, error: "인증번호를 확인해 주세요." };
    }
    return { ok: true };
  };

  const logout = () => {
    void supabase.auth.signOut();
    setProfile(EMPTY_PROFILE);
  };

  const changePassword: AuthContextValue["changePassword"] = async (currentPassword, newPassword) => {
    if (!profile.user) return { ok: false, error: "로그인이 필요합니다." };
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
    <AuthContext.Provider
      value={{
        user: profile.user,
        isLoading,
        onboardingIncomplete: profile.onboardingIncomplete,
        login,
        requestEmailOtp,
        verifyEmailOtp,
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
