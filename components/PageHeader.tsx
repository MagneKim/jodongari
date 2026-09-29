import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-[32px] font-bold tracking-[-0.03em] sm:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
