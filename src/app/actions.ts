"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/utils/auth";

export type DemoLoginState = {
  error: string;
};

export async function startDemoSession(
  _state: DemoLoginState,
  _formData: FormData
): Promise<DemoLoginState> {
  try {
    await signIn("demo", { redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "데모 계정으로 로그인하지 못했습니다. DB 설정과 초기 데이터를 확인해 주세요.",
      };
    }
    throw error;
  }

  return { error: "" };
}

export async function endDemoSession() {
  await signOut({ redirectTo: "/" });
}
