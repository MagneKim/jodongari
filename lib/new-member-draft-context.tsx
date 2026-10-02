"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./supabase/auth-provider";
import type { UserRole } from "./types";
import type { DupState } from "./duplicate-check";

export type { DupState };

export interface NewMemberDraft {
  email: string;
  loginId: string;
  nickname: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  loginIdDup: DupState;
  nicknameDup: DupState;
}

export const EMPTY_DRAFT: NewMemberDraft = {
  email: "",
  loginId: "",
  nickname: "",
  password: "",
  confirmPassword: "",
  role: "member",
  loginIdDup: "idle",
  nicknameDup: "idle",
};

interface NewMemberDraftContextValue {
  draft: NewMemberDraft;
  setDraft: (next: Partial<NewMemberDraft>) => void;
  clearDraft: () => void;
}

const NewMemberDraftContext = createContext<NewMemberDraftContextValue | null>(null);

// ponytail: draft lives only in memory (never localStorage/sessionStorage) since it carries a plaintext temp password;
// this provider sits above route pages so client-side nav between /manage/users/new and other routes doesn't lose it,
// while a page refresh (component tree remounts from scratch) wipes it naturally.
export function NewMemberDraftProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [draft, setDraftState] = useState<NewMemberDraft>(EMPTY_DRAFT);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const id = user?.id ?? null;
    if (lastUserId.current !== id) {
      lastUserId.current = id;
      setDraftState(EMPTY_DRAFT);
    }
  }, [user?.id]);

  const setDraft = (next: Partial<NewMemberDraft>) => setDraftState((prev) => ({ ...prev, ...next }));
  const clearDraft = () => setDraftState(EMPTY_DRAFT);

  return (
    <NewMemberDraftContext.Provider value={{ draft, setDraft, clearDraft }}>
      {children}
    </NewMemberDraftContext.Provider>
  );
}

export function useNewMemberDraft() {
  const ctx = useContext(NewMemberDraftContext);
  if (!ctx) throw new Error("useNewMemberDraft must be used within NewMemberDraftProvider");
  return ctx;
}
