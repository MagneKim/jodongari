"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useAppData } from "@/lib/app-data-context";
import { isVisibleInAllScope } from "@/lib/sighting-access";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/status";
import { MediaViewer } from "@/components/MediaViewer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatShortKoreanDate } from "@/lib/period";

export default function SightingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, users, sightings, birds, toggleLike, addComment, deleteSighting } = useAppData();
  const [draft, setDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sighting = sightings.find((s) => s.id === id);
  const canView = sighting ? isVisibleInAllScope(sighting, currentUser.id) : false;

  if (!sighting || !canView) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">기록을 찾을 수 없어요.</p>
        <Link href="/sightings" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white">
          탐조로 돌아가기
        </Link>
      </div>
    );
  }

  const authorName = (uid: string) => users.find((u) => u.id === uid)?.nickname ?? uid;
  const speciesName = (sid: string) => birds.find((b) => b.id === sid)?.koreanName ?? sid;
  const liked = sighting.likedBy.includes(currentUser.id);

  const isAuthor = sighting.authorId === currentUser.id;
  const isReviewer = currentUser.role === "leader" || currentUser.role === "admin";
  const canDelete = isAuthor || isReviewer;
  const canResubmit = isAuthor && sighting.status === "revision";
  const hasParticipants = sighting.participantUserIds.length > 0;

  const deleteCopy = (() => {
    if (sighting.status === "approved") {
      return {
        title: "승인된 탐조 기록을 삭제할까요?",
        description:
          "이 기록을 삭제하면 작성자와 참여자의 경험치,\n도감 및 활동 통계가 변경될 수 있습니다.\n삭제한 기록은 복구할 수 없습니다.",
      };
    }
    const base = "삭제한 기록은 복구할 수 없습니다.";
    return {
      title: "탐조 기록을 삭제할까요?",
      description: hasParticipants
        ? `이 기록에는 함께 탐조한 멤버가 포함되어 있습니다.\n삭제하면 해당 멤버의 경험치와 도감에도 영향을 줄 수 있습니다.\n${base}`
        : base,
    };
  })();

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteSighting(sighting.id);
    setDeleting(false);
    if (!result.ok) {
      setDeleteError(result.error);
      setConfirmDeleteOpen(false);
      return;
    }
    router.push("/sightings?deleted=1");
  };

  const submitComment = async () => {
    if (!draft.trim()) return;
    setCommentError(null);
    const result = await addComment(sighting.id, draft);
    if (!result.ok) {
      setCommentError(result.error);
      return;
    }
    setDraft("");
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link href="/sightings" className="flex w-fit items-center gap-1 text-sm font-medium text-muted">
        <span aria-hidden="true">←</span> 탐조
      </Link>

      <header>
        <p className="text-sm text-muted">
          {formatShortKoreanDate(sighting.date)} · {sighting.location}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-[24px] font-bold tracking-[-0.02em]">{authorName(sighting.authorId)}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE_CLASSES[sighting.status]}`}>
            {STATUS_LABELS[sighting.status]}
          </span>
        </div>
      </header>

      {sighting.participantUserIds.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted">함께한 멤버</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {sighting.participantUserIds.map((uid) => (
              <span key={uid} className="rounded-full bg-surface-secondary px-3 py-1 text-sm">
                {authorName(uid)}
              </span>
            ))}
          </div>
        </section>
      )}

      {sighting.speciesIds.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted">관찰한 새</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {sighting.speciesIds.map((sid) => (
              <span key={sid} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
                {speciesName(sid)}
              </span>
            ))}
          </div>
        </section>
      )}

      <MediaViewer media={sighting.media} altPrefix={sighting.location} />

      {sighting.memo && (
        <section>
          <h2 className="text-sm font-semibold text-muted">한마디</h2>
          <p className="mt-2 text-[15px] leading-relaxed">{sighting.memo}</p>
        </section>
      )}

      {sighting.leaderNote && (
        <p className="rounded-lg bg-surface-secondary p-3 text-sm text-muted">
          {sighting.status === "revision" ? "검토 의견: " : "회장 메모: "}
          {sighting.leaderNote}
        </p>
      )}

      {canResubmit && (
        <Link
          href={`/record?editId=${sighting.id}`}
          className="rounded-full bg-accent py-3 text-center text-sm font-medium text-white shadow-soft"
        >
          수정하고 다시 제출
        </Link>
      )}

      <section className="border-t border-separator pt-5">
        <div className="flex items-center gap-4 text-sm text-muted">
          <button
            type="button"
            onClick={() => toggleLike(sighting.id)}
            aria-pressed={liked}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2.5 -mx-3 transition-colors ${
              liked ? "text-accent" : "text-muted"
            }`}
          >
            <span aria-hidden="true">{liked ? "♥" : "♡"}</span> {sighting.likedBy.length}
          </button>
          <span>댓글 {sighting.comments.length}</span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {sighting.comments.map((c) => (
            <p key={c.id} className="text-sm">
              <span className="font-medium">{authorName(c.authorId)}</span> <span>{c.text}</span>
            </p>
          ))}
          <div className="mt-1 flex gap-2">
            <label className="sr-only" htmlFor="comment-input">
              댓글 작성
            </label>
            <input
              id="comment-input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="댓글을 남겨보세요"
              className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={!draft.trim()}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              등록
            </button>
          </div>
          {commentError && <p className="text-xs text-danger">{commentError}</p>}
        </div>
      </section>

      {canDelete && (
        <section className="border-t border-separator pt-5">
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            className="text-sm font-medium text-danger"
          >
            탐조 기록 삭제
          </button>
          {deleteError && <p className="mt-2 text-xs text-danger">{deleteError}</p>}
        </section>
      )}

      {confirmDeleteOpen && (
        <ConfirmDialog
          title={deleteCopy.title}
          description={deleteCopy.description}
          confirmLabel="삭제"
          destructive
          pending={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
      )}
    </div>
  );
}
