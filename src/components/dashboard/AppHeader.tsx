import { endDemoSession } from "@/app/actions";
import { Button } from "@/components/common/Button";
import type { Agent } from "@/utils/types";

export function AppHeader({ agent }: { agent: Agent }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-navy px-7 text-white max-mobile:px-4">
      <div className="flex items-center gap-2.5 text-base font-extrabold">
        <span className="text-xl text-ai">✦</span>
        <span>CS Copilot</span>
      </div>
      <div className="text-sm font-semibold text-[#d7ddea] max-mobile:hidden">고객 지원 운영</div>
      <div className="flex items-center gap-2.5 text-xs">
        <span className="grid size-7.25 place-items-center rounded-full bg-[#e2a570] font-extrabold text-[#482e20]">
          {agent.name.slice(0, 1)}
        </span>
        <span className="max-mobile:hidden">{agent.name}</span>
        <span className="ml-1.5 text-[11px] text-[#b9c5dc] max-mobile:hidden">
          <span className="text-[#68d4a8]">●</span> 온라인
        </span>
        <form action={endDemoSession}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="ml-1 border-[#43506a] bg-transparent px-2 py-1 text-[10px] text-[#d7ddea]"
          >
            로그아웃
          </Button>
        </form>
      </div>
    </header>
  );
}
