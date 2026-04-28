// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. 브라우저의 쿠키나 로컬스토리지 대신 사용할 세션 체크 (쿠키 권장)
  // 클라이언트의 localStorage는 서버 미들웨어에서 직접 접근이 안 되므로, 
  // 로그인 시 쿠키에 'isLoggedIn' 같은 값을 심어두면 여기서 체크가 가능합니다.
  const authCookie = request.cookies.get('sb-access-token'); // Supabase 기본 쿠키 예시

  const { pathname } = request.nextUrl;

  // 2. 로그인이 필요한 경로 설정
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    if (!authCookie) {
      // 세션이 없으면 로그인 페이지로 리다이렉트
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// 미들웨어가 작동할 경로 지정
export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};