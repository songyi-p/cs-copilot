import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ServerError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
  }
}

export async function parseRequest<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ServerError("요청 본문이 올바른 JSON이 아닙니다.", 400, "INVALID_JSON");
  }

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ServerError("요청 데이터가 올바르지 않습니다.", 400, "INVALID_INPUT");
    }
    throw error;
  }
}

export function apiErrorResponse(error: unknown, scope: string) {
  if (error instanceof ServerError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  console.error(`[${scope}] request failed`, error);
  return NextResponse.json(
    {
      error: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}
