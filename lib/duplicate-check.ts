// 중복 확인 공용 state/helper — /manage/users/new와 MY profile 수정에서 공유한다.
// 두 화면 모두 같은 /api/onboarding/check-* endpoint(= profiles 단일 source of truth)를 호출한다.

export type DupState = "idle" | "checking" | "available" | "taken" | "error";

export async function checkDuplicate(
  endpoint: string,
  key: "loginId" | "nickname",
  value: string
): Promise<DupState> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) return "error";
    return body.available ? "available" : "taken";
  } catch {
    return "error";
  }
}

export function dupButtonLabel(state: DupState): string {
  switch (state) {
    case "checking":
      return "확인 중…";
    case "available":
      return "확인 완료";
    case "taken":
    case "error":
      return "다시 확인";
    default:
      return "중복 확인";
  }
}
