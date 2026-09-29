"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MOCK_USERS } from "./mock-data";
import { getPasswordHash, getProfileOverrides, hashPassword, setPasswordHash } from "./profile-store";
import type { User } from "./types";

export type AuthUser = User;
export type LoginResult = { ok: true } | { ok: false; error: string };
export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ChangePasswordResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "jodongari_auth_user_id";
const TEST_PASSWORD = "bird1234";

// 로컬 UX 테스트용 mock credential. 실제 보안 기능이 아니며, Phase 4에서 Supabase Auth로 교체된다.
const CREDENTIALS: { email: string; password: string; userId: string }[] = [
  { email: "member1@jodongari.local", password: TEST_PASSWORD, userId: "u-member1" },
  { email: "member2@jodongari.local", password: TEST_PASSWORD, userId: "u-member2" },
  { email: "leader@jodongari.local", password: TEST_PASSWORD, userId: "u-leader" },
  { email: "admin@jodongari.local", password: TEST_PASSWORD, userId: "u-admin" },
];

// 관리자 화면에서 이메일을 표시하기 위한 lookup. email은 Supabase Auth 쪽 개념이라
// User/profile에는 넣지 않고 이 credential 목록에서만 파생시킨다.
export const CREDENTIAL_EMAILS: Record<string, string> = Object.fromEntries(
  CREDENTIALS.map((c) => [c.userId, c.email])
);

function findUser(id: string): AuthUser | null {
  const base = MOCK_USERS.find((u) => u.id === id);
  if (!base) return null;
  const override = getProfileOverrides()[id];
  if (!override) return base;
  return {
    ...base,
    ...(override.nickname ? { nickname: override.nickname } : {}),
    ...(override.role ? { role: override.role } : {}),
    ...(override.status ? { status: override.status } : {}),
  };
}

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: AuthUser | null; isLoading: boolean }>({
    user: null,
    isLoading: true,
  });
  const { user, isLoading } = session;
  const setUser = (nextUser: AuthUser | null) => setSession({ user: nextUser, isLoading: false });

  useEffect(() => {
    // localStorage는 서버에 없으므로 mount 이후 한 번만 동기화한다.
    const savedId = localStorage.getItem(SESSION_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session read from localStorage, not a derived/cascading update
    setSession({ user: savedId ? findUser(savedId) : null, isLoading: false });
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const match = CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!match) return { ok: false, error: "이메일 또는 비밀번호를 확인해 주세요." };

    const overrideHash = getPasswordHash(match.userId);
    const passwordOk = overrideHash
      ? (await hashPassword(password)) === overrideHash
      : password === match.password;
    if (!passwordOk) return { ok: false, error: "이메일 또는 비밀번호를 확인해 주세요." };

    const found = findUser(match.userId);
    if (!found) return { ok: false, error: "이메일 또는 비밀번호를 확인해 주세요." };
    if (found.status === "inactive") {
      return { ok: false, error: "비활성화된 계정입니다. 관리자에게 문의해 주세요." };
    }
    localStorage.setItem(SESSION_KEY, found.id);
    setUser(found);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const changePassword: AuthContextValue["changePassword"] = async (currentPassword, newPassword) => {
    if (!user) return { ok: false, error: "로그인이 필요합니다." };
    const match = CREDENTIALS.find((c) => c.userId === user.id);
    if (!match) return { ok: false, error: "계정 정보를 찾을 수 없습니다." };

    const overrideHash = getPasswordHash(user.id);
    const currentOk = overrideHash
      ? (await hashPassword(currentPassword)) === overrideHash
      : currentPassword === match.password;
    if (!currentOk) return { ok: false, error: "현재 비밀번호가 일치하지 않습니다." };

    if (newPassword.length < 8) return { ok: false, error: "새 비밀번호는 8자 이상이어야 해요." };
    if (newPassword === currentPassword) {
      return { ok: false, error: "기존 비밀번호와 다른 비밀번호를 입력해 주세요." };
    }

    setPasswordHash(user.id, await hashPassword(newPassword));
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within LocalAuthProvider");
  return ctx;
}
