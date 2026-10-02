// 중복 확인 공용 state/helper(UI only) — /manage/users/new와 MY profile 수정에서 공유한다.
// 두 화면은 의미가 다른 별도 endpoint를 쓴다(Phase 4B-13): MY는 /api/profile/check-*(본인 제외),
// manage/users/new는 /api/manage/users/check-*(전체 profiles, 제외 없음). 이 helper는 endpoint URL을
// 그대로 전달만 하고 context를 추론하지 않는다 — exclusion 의미는 항상 호출하는 쪽이 넘기는 endpoint,
// 즉 server가 결정한다.

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
