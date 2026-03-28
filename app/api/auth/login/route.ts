import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json();
    const adminId = process.env.ADMIN_ID;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminId || !adminPassword) {
      return NextResponse.json({ error: '서버 환경변수 설정 오류' }, { status: 500 });
    }

    if (id === adminId && password === adminPassword) {
      const response = NextResponse.json({ success: true });
      
      // 24시간 쿠키 세션 발급
      response.cookies.set('mapleki-session', 'authenticated-' + Date.now(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  }
}
