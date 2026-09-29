import { isContributor, type Sighting } from "./types";

export type SightingScope = "mine" | "all";

// "전체 기록"에서 노출 가능한 기록: approved 이거나 본인이 기여(author/participant)한 기록.
// 다른 사람의 draft/pending은 제외한다. 상세(/sightings/[id]) 접근 가능 여부도 동일 기준을 쓴다.
export function isVisibleInAllScope(sighting: Sighting, userId: string): boolean {
  return sighting.status === "approved" || isContributor(sighting, userId);
}

export function filterByScope(sightings: Sighting[], scope: SightingScope, userId: string): Sighting[] {
  return scope === "mine"
    ? sightings.filter((s) => isContributor(s, userId))
    : sightings.filter((s) => isVisibleInAllScope(s, userId));
}
