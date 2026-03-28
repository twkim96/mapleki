import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호할 라우트 목록 (추가/수정 관련)
const protectedRoutes = ['/new', '/edit'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.includes(route));

  if (isProtectedRoute) {
    const sessionCookie = request.cookies.get('mapleki-session');

    // 세션이 없다면 로그인 페이지로 리다이렉트
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
