// 닉네임/비밀번호/역할/상태 local override 저장소. 향후 Supabase Auth/profile table로 교체될 임시 계층.
// 단일 localStorage key에 user별 override를 모아 저장한다 (key 난립 방지).

import type { UserRole, UserStatus } from "./types";

interface ProfileOverride {
  nickname?: string;
  passwordHash?: string;
  role?: UserRole;
  status?: UserStatus;
}

type ProfileOverrides = Record<string, ProfileOverride>;

const PROFILE_KEY = "jodongari_profile_overrides";

function readOverrides(): ProfileOverrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeOverrides(overrides: ProfileOverrides) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(overrides));
}

// nickname/role/status override를 한 번에 반환한다. AppDataProvider/LocalAuthProvider가
// mount·login 시점에 이 값을 MOCK_USERS 위에 병합한다.
export function getProfileOverrides(): Record<
  string,
  { nickname?: string; role?: UserRole; status?: UserStatus }
> {
  const overrides = readOverrides();
  const result: Record<string, { nickname?: string; role?: UserRole; status?: UserStatus }> = {};
  for (const [id, o] of Object.entries(overrides)) {
    if (o.nickname || o.role || o.status) {
      result[id] = { nickname: o.nickname, role: o.role, status: o.status };
    }
  }
  return result;
}

export function setNicknameOverride(userId: string, nickname: string) {
  const overrides = readOverrides();
  overrides[userId] = { ...overrides[userId], nickname };
  writeOverrides(overrides);
}

export function setRoleOverride(userId: string, role: UserRole) {
  const overrides = readOverrides();
  overrides[userId] = { ...overrides[userId], role };
  writeOverrides(overrides);
}

export function setStatusOverride(userId: string, status: UserStatus) {
  const overrides = readOverrides();
  overrides[userId] = { ...overrides[userId], status };
  writeOverrides(overrides);
}

export function getPasswordHash(userId: string): string | undefined {
  return readOverrides()[userId]?.passwordHash;
}

export function setPasswordHash(userId: string, passwordHash: string) {
  const overrides = readOverrides();
  overrides[userId] = { ...overrides[userId], passwordHash };
  writeOverrides(overrides);
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
