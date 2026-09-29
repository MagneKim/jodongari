"use client";

import { useEffect, useRef } from "react";

export type MediaSourceKind = "photoVideo" | "camera" | "audio" | "generic";

const ACTIONS: {
  key: MediaSourceKind;
  icon: string;
  title: string;
  desc: string;
  accept: string;
  capture?: "environment";
  multiple?: boolean;
  mobileOnly?: boolean;
}[] = [
  {
    key: "photoVideo",
    icon: "🖼️",
    title: "사진 또는 영상",
    desc: "사진과 동영상을 선택해요",
    accept: "image/*,video/*",
    multiple: true,
  },
  {
    key: "camera",
    icon: "📷",
    title: "카메라로 촬영",
    desc: "새 사진을 촬영해요",
    accept: "image/*",
    capture: "environment",
    mobileOnly: true,
  },
  {
    key: "audio",
    icon: "🎵",
    title: "녹음 파일",
    desc: "저장된 오디오 파일을 선택해요",
    accept: "audio/*",
    multiple: true,
  },
  {
    key: "generic",
    icon: "📁",
    title: "파일에서 선택",
    desc: "기기의 파일을 선택해요",
    accept: "image/*,video/*,audio/*",
    multiple: true,
  },
];

export function MediaSourcePicker({
  triggerRef,
  onClose,
  onFileChange,
}: {
  triggerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:absolute sm:inset-auto sm:top-[calc(100%+8px)] sm:left-0 sm:block sm:items-stretch sm:justify-start">
      <div className="fixed inset-0 bg-black/25 sm:hidden" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="미디어 추가"
        className="relative w-full rounded-t-3xl border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-popover sm:w-[340px] sm:rounded-[20px] sm:pb-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:hidden">
          <span className="text-[15px] font-semibold">미디어 추가</span>
        </div>
        <ul className="divide-y divide-border py-1">
          {ACTIONS.map((a) => (
            <li key={a.key} className={a.mobileOnly ? "sm:hidden" : undefined}>
              <div className="relative min-w-0">
                <div className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:py-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base"
                  >
                    {a.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium sm:text-sm">{a.title}</span>
                    <span className="block truncate text-xs text-muted">{a.desc}</span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-muted">
                    ›
                  </span>
                </div>
                <input
                  type="file"
                  accept={a.accept}
                  multiple={a.multiple}
                  capture={a.capture}
                  onChange={handleChange}
                  aria-label={`${a.title} 선택`}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-4 py-3">
          <button type="button" onClick={onClose} className="w-full rounded-full py-2.5 text-sm font-medium text-accent">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
