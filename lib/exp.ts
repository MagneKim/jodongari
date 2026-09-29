import { isContributor, type Sighting } from "./types";

// Balance is intentionally centralized here — expect this to change.
export const EXP_RULES = {
  approvedSighting: 10,
  approvedSpecies: 2,
  newSpeciesUnlock: 20,
} as const;

// 작성자와 동행 멤버 모두 동일한 기준으로 EXP를 받는다 (공동 탐조).
export function calculateUserExp(userId: string, sightings: Sighting[]): number {
  const approved = sightings
    .filter((s) => isContributor(s, userId) && s.status === "approved")
    .sort((a, b) => a.date.localeCompare(b.date));

  const seenSpeciesIds = new Set<string>();
  let exp = 0;

  for (const sighting of approved) {
    exp += EXP_RULES.approvedSighting;
    for (const speciesId of sighting.speciesIds) {
      exp += EXP_RULES.approvedSpecies;
      if (!seenSpeciesIds.has(speciesId)) {
        seenSpeciesIds.add(speciesId);
        exp += EXP_RULES.newSpeciesUnlock;
      }
    }
  }

  return exp;
}

// 탐조 횟수는 approved 기록만 센다 (pending/draft는 아직 확정 활동이 아님).
export function countApprovedSightings(userId: string, sightings: Sighting[]): number {
  return sightings.filter((s) => isContributor(s, userId) && s.status === "approved").length;
}

const EXP_PER_LEVEL = 100;

export function getLevel(totalExp: number): {
  level: number;
  currentExp: number;
  expToNextLevel: number;
} {
  const level = Math.floor(totalExp / EXP_PER_LEVEL) + 1;
  const currentExp = totalExp % EXP_PER_LEVEL;
  return { level, currentExp, expToNextLevel: EXP_PER_LEVEL };
}
