import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH, shouldProtectPath } from "@/constants/auth";

/**
 * Edge에서 Supabase 클라이언트(process.version 사용)를 쓰지 않고,
 * Supabase Auth 쿠키 존재 여부만 검사합니다.
 * 쿠키 이름 패턴: sb-<project-ref>-auth-token
 */
function hasSupabaseAuthCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  return cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token") && c.value?.length > 0
  );
}

export async function middleware(request: NextRequest) {
  const isProtected = shouldProtectPath(request.nextUrl.pathname);
  const hasAuth = hasSupabaseAuthCookie(request);

  if (isProtected && !hasAuth) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
