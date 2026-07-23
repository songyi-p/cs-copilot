import { NextResponse } from "next/server";
import {
  getAiDiagnostics,
  getAiErrorStatus,
  requestAiSuggestion,
} from "@/server/ai-suggestion";
import { requireCurrentAgent } from "@/server/current-agent";
import { ServerError } from "@/server/errors";
import { buildAiRequest } from "@/server/ai-request";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let agent;
  try {
    agent = await requireCurrentAgent();
  } catch (error) {
    const message =
      error instanceof ServerError ? error.message : "로그인이 필요합니다.";
    const status = error instanceof ServerError ? error.status : 401;
    return NextResponse.json({ error: message }, { status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }

  let ticketId: string;
  try {
    ticketId = z.object({ ticketId: z.string().min(1).max(100) }).strict().parse(body).ticketId;
  } catch {
    return NextResponse.json({ error: "티켓 식별자가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const input = await buildAiRequest(ticketId, agent);
    const suggestion = await requestAiSuggestion(input);
    return NextResponse.json(suggestion);
  } catch (error) {
    const status = getAiErrorStatus(error);
    const diagnostics = getAiDiagnostics(error);
    console.error("[ai-suggestion] request failed", diagnostics);
    const message =
      status === 503
        ? "AI 제안 기능이 아직 설정되지 않았습니다."
        : "AI 제안을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return NextResponse.json({ error: message }, { status });
  }
}
