import { isContributor, type BirdSpecies, type EncyclopediaEntry, type Sighting } from "./types";

export function buildEncyclopedia(
  userId: string,
  sightings: Sighting[],
  birds: BirdSpecies[]
): EncyclopediaEntry[] {
  const approved = sightings.filter(
    (s) => isContributor(s, userId) && s.status === "approved"
  );

  const sortedBirds = [...birds].sort((a, b) =>
    a.koreanName.localeCompare(b.koreanName, "ko")
  );

  return sortedBirds.map((species) => {
    const dates = approved
      .filter((s) => s.speciesIds.includes(species.id))
      .map((s) => s.date)
      .sort();

    return {
      species,
      unlocked: dates.length > 0,
      observationCount: dates.length,
      firstSeenAt: dates[0],
      lastSeenAt: dates[dates.length - 1],
    };
  });
}
