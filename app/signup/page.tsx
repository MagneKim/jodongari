import Link from "next/link";

// 초대제 운영 안내 화면 — 실제 가입 form이 아니다. 신규 회원은 admin/leader가
// /manage/users/new에서 직접 생성한다(Phase 4B-7, 참고: docs/DECISIONS.md).
export default function SignUpPage() {
  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col px-4 py-[6vh] text-center">
      <h1 className="text-[24px] font-bold tracking-[-0.02em] text-foreground">조동아리 가입</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        현재 조동아리는 초대된 멤버만 이용할 수 있습니다.
        <br />
        관리자 또는 회장에게 회원 등록을 요청해 주세요.
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        이미 등록된 멤버라면
        <br />
        받은 아이디와 비밀번호로 로그인해 주세요.
      </p>

      <Link
        href="/login"
        className="mt-8 h-[50px] rounded-xl bg-accent text-[15px] font-semibold leading-[50px] text-white shadow-elevated transition-opacity active:opacity-80"
      >
        로그인으로 이동
      </Link>
    </div>
  );
}
