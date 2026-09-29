// 목록형 화면(Feed/Sightings)에서 쓰는 축약형 "함께한 멤버" 표시.
// 1~2명은 전체 이름, 3명 이상은 "첫 멤버 외 N명"으로 줄인다.
export function formatParticipants(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length <= 2) return `함께한 멤버: ${names.join(", ")}`;
  return `함께한 멤버: ${names[0]} 외 ${names.length - 1}명`;
}
