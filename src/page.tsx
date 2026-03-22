import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 브라우저 쿠키에서 인증 토큰 확인 (로그인 성공 시 저장됨)
  const token = request.cookies.get('auth_token');

  // 보호할 경로 리스트 (사건 입력 페이지 등)
  const isProtectedPath = request.nextUrl.pathname.startsWith('/case-input');

  // 토큰이 없는데 보호된 경로에 접근하려고 하면 로그인 페이지로 리다이렉트
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    // 로그인 완료 후 원래 가려던 페이지로 돌아오도록 쿼리 스트링 추가 가능
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 미들웨어가 감시할 경로 설정
export const config = {
  matcher: ['/case-input/:path*'],
};