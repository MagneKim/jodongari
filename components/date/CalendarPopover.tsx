"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function CalendarPopover({
  title,
  onClose,
  triggerRef,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  footer?: ReactNode;
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:absolute sm:inset-auto sm:top-[calc(100%+8px)] sm:left-0 sm:block sm:items-stretch sm:justify-start">
      <div className="fixed inset-0 bg-black/25 sm:hidden" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full rounded-t-3xl border border-border bg-surface shadow-popover sm:w-auto sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:hidden">
          <span className="text-[15px] font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-accent"
          >
            완료
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
