"use client";

import { useActionState } from "react";
import { startDemoSession, type DemoLoginState } from "@/app/actions";
import { Button } from "@/components/common/Button";

const initialState: DemoLoginState = {
  error: "",
};

export function DemoLogin() {
  const [state, formAction, pending] = useActionState(startDemoSession, initialState);

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-5 py-10">
      <section className="w-full max-w-112 rounded-2xl border border-line bg-white p-8 shadow-[0_24px_70px_#23304a14] max-mobile:p-6">
        <div className="mb-8">
          <div className="mb-5 flex items-center gap-2.5 text-base font-extrabold text-navy">
            <span className="text-xl text-[#826ee0]">✦</span>
            <span>CS Copilot</span>
          </div>
          <p className="mb-2 font-mono text-[10px] font-medium tracking-[1.3px] text-eyebrow">
            DEMO WORKSPACE
          </p>
          <h1 className="mb-3 text-[26px] font-extrabold tracking-[-0.7px]">
            상담 업무 데모를 시작하세요
          </h1>
          <p className="m-0 text-sm leading-6 text-muted">
            미리 준비된 윤서연 상담사 계정으로 로그인해 배정된 문의와 처리 이력을 확인합니다.
          </p>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#e4e8f1] bg-[#f8faff] p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e2a570] text-sm font-extrabold text-[#482e20]">
            윤
          </span>
          <div>
            <strong className="block text-sm">윤서연</strong>
            <span className="text-[11px] text-muted">고객 지원 상담사 · 데모 계정</span>
          </div>
        </div>

        {state.error && (
          <p
            className="mb-4 rounded-md border border-[#f0cccc] bg-[#fff7f7] px-3.5 py-3 text-xs font-semibold text-status-escalated"
            role="alert"
          >
            {state.error}
          </p>
        )}

        <form action={formAction}>
          <Button
            variant="primary"
            className="w-full justify-center py-3"
            type="submit"
            disabled={pending}
            trailingIcon={pending ? undefined : "→"}
          >
            {pending ? "데모 세션을 준비하는 중" : "윤서연 상담사로 데모 시작"}
          </Button>
        </form>
        <p className="mt-4 mb-0 text-center text-[10px] leading-4 text-faint">
          실제 고객 메시지 발송이나 환불은 실행되지 않습니다.
        </p>
      </section>
    </main>
  );
}
