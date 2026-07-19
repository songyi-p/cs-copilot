import { NextResponse } from "next/server";
import {
  getAiErrorDiagnostics,
  getAiErrorStatus,
  parseAiSuggestionRequest,
  requestAiSuggestion,
} from "@/server/ai-suggestion";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }

  let input;
  try {
    input = parseAiSuggestionRequest(body);
  } catch {
    return NextResponse.json({ error: "AI 제안 요청 데이터가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const suggestion = await requestAiSuggestion(input);
    return NextResponse.json(suggestion);
  } catch (error) {
    const status = getAiErrorStatus(error);
    const diagnostics = getAiErrorDiagnostics(error);
    console.error("[ai-suggestion] request failed", diagnostics);
    const message =
      status === 503
        ? "AI 제안 기능이 아직 설정되지 않았습니다."
        : "AI 제안을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return NextResponse.json({ error: message }, { status });
  }
}
