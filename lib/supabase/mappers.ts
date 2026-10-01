// DB row(snake_case) → app domain type(Sighting/User) 매핑. UI/서비스가 DB shape에 의존하지 않도록
// 여기 한 곳에서만 변환한다.

import type { Database } from "./database.types";
import type { Comment, MediaType, Sighting, SightingMedia, SightingStatus, User, UserRole, UserStatus } from "../types";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "user_id" | "login_id" | "nickname" | "role" | "status" | "must_change_password"
>;
type SightingRow = Database["public"]["Tables"]["sightings"]["Row"];
type MediaRow = Database["public"]["Tables"]["sighting_media"]["Row"];
type CommentRow = Database["public"]["Tables"]["sighting_comments"]["Row"];

// nested select로 가져온 sighting row (참여자/종/미디어/좋아요/댓글 포함).
export interface RawSightingRow extends SightingRow {
  sighting_participants: { user_id: string }[];
  sighting_species: { species_id: string }[];
  sighting_media: MediaRow[];
  sighting_likes: { user_id: string }[];
  sighting_comments: CommentRow[];
}

// onboarding_completed=true인 row만 호출한다 — DB constraint(profiles_onboarding_requires_identity)가
// 그 상태에서 login_id/nickname not null을 보장하므로 여기서는 안전하게 non-null로 다룬다.
export function mapProfileRow(row: ProfileRow): User {
  return {
    id: row.user_id,
    loginId: row.login_id ?? "",
    nickname: row.nickname ?? "",
    role: row.role as UserRole,
    status: row.status as UserStatus,
    mustChangePassword: row.must_change_password,
  };
}

function mapMediaRow(row: MediaRow, signedUrlByPath: Map<string, string>): SightingMedia {
  return {
    id: row.id,
    type: row.type as MediaType,
    name: row.original_name,
    mimeType: row.mime_type,
    size: row.size_bytes,
    url: signedUrlByPath.get(row.storage_path) ?? "",
  };
}

function mapCommentRow(row: CommentRow): Comment {
  return { id: row.id, authorId: row.author_id, text: row.body, createdAt: row.created_at };
}

export function mapSightingRow(row: RawSightingRow, signedUrlByPath: Map<string, string>): Sighting {
  return {
    id: row.id,
    authorId: row.author_id,
    participantUserIds: row.sighting_participants.map((p) => p.user_id),
    date: row.observed_date,
    location: row.place,
    memo: row.note,
    speciesIds: row.sighting_species.map((s) => s.species_id),
    media: row.sighting_media
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => mapMediaRow(m, signedUrlByPath)),
    status: row.status as SightingStatus,
    leaderNote: row.leader_note ?? undefined,
    createdAt: row.created_at,
    likedBy: row.sighting_likes.map((l) => l.user_id),
    comments: row.sighting_comments
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(mapCommentRow),
  };
}
