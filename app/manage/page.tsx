"use client";

import Link from "next/link";
import { useAppData } from "@/lib/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import type { UserRole } from "@/lib/types";

const CARDS: { href: string; title: string; description: string; roles: UserRole[] }[] = [
  {
    href: "/review",
    title: "검토",
    description: "검토 대기 중인 탐조 기록을 확인하고 승인합니다.",
    roles: ["leader", "admin"],
  },
  {
    href: "/manage/users/new",
    title: "새 회원 추가",
    description: "초대할 회원의 계정을 직접 등록합니다.",
    roles: ["leader", "admin"],
  },
  {
    href: "/admin",
    title: "사용자 관리",
    description: "회원의 역할과 상태를 관리합니다.",
    roles: ["admin"],
  },
];

export default function ManagePage() {
  const { currentUser } = useAppData();
  const cards = CARDS.filter((c) => c.roles.includes(currentUser.role));

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6">
      <PageHeader title="관리" />

      <ul className="flex flex-col divide-y divide-separator rounded-2xl border border-border bg-surface">
        {cards.map((card) => (
          <li key={card.href}>
            <Link href={card.href} className="flex items-center justify-between gap-4 px-4 py-4 active:opacity-70">
              <div>
                <p className="text-[17px] font-semibold">{card.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{card.description}</p>
              </div>
              <span className="shrink-0 text-muted" aria-hidden="true">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
