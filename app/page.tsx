"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppData } from "@/lib/app-data-context";
import { calculateUserExp, countApprovedSightings, getLevel } from "@/lib/exp";
import { buildEncyclopedia } from "@/lib/encyclopedia";

export default function Home() {
  const { currentUser, sightings, birds } = useAppData();

  const myExp = calculateUserExp(currentUser.id, sightings);
  const { level } = getLevel(myExp);
  const sightingCount = countApprovedSightings(currentUser.id, sightings);

  const encyclopedia = buildEncyclopedia(currentUser.id, sightings, birds);
  const unlockedCount = encyclopedia.filter((e) => e.unlocked).length;
  const recentUnlocked = encyclopedia
    .filter((e) => e.unlocked && e.lastSeenAt)
    .sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-14 lg:gap-16">
      <section className="mx-auto w-full max-w-[1200px]">
        <div className="flex flex-col items-center gap-8 pb-6 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:pb-8 lg:text-left">
          <div className="flex flex-col items-center lg:items-start">
            <h1 className="max-w-2xl text-[40px] font-extrabold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-[48px] lg:text-[64px]">
              오늘 만난 새를,
              <br />
              <span className="text-accent">오래 기억하는 방법.</span>
            </h1>
            <p className="mt-5 max-w-md text-[17px] text-muted lg:text-[19px]">
              우리끼리 기록하고 발견하는 탐조 생활
            </p>
          </div>

          <div
            className="w-[60%] max-w-[260px] shrink-0 md:w-[38%] md:max-w-[320px] lg:w-[30%] lg:max-w-[380px]"
            style={{
              background: "radial-gradient(circle, rgba(0,113,227,0.07), transparent 60%)",
            }}
          >
            <Image
              src="/img/jodongari-illustration.png"
              alt=""
              width={1210}
              height={1122}
              priority
              sizes="(min-width: 1024px) 30vw, (min-width: 768px) 38vw, 60vw"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1200px] border-t border-separator pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[19px] font-semibold">
              {currentUser.nickname} <span className="ml-1 text-accent">Lv.{level}</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {unlockedCount}종 발견 · 탐조 {sightingCount}회
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/record"
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-soft"
            >
              탐조 기록하기
            </Link>
            <Link
              href="/sightings"
              className="rounded-full bg-surface-secondary px-4 py-2.5 text-sm font-medium text-foreground"
            >
              내 기록 보기
            </Link>
          </div>
        </div>

        <div className="mt-6">
          {recentUnlocked.length > 0 ? (
            <p className="text-sm">
              <span className="text-muted">최근 발견 </span>
              {recentUnlocked.map((e) => e.species.koreanName).join(" · ")}
            </p>
          ) : (
            <p className="text-sm text-muted">아직 발견 기록이 없어요.</p>
          )}
        </div>
      </section>
    </div>
  );
}
