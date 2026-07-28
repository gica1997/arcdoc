import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth-service';
import { successResponse, errorResponse, tooManyRequestsResponse } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = checkRateLimit(`login:${ip}`, 10, 60000);
    if (!allowed) return tooManyRequestsResponse();

    const body = await request.json();
    const { email, password, rememberMe } = body;
    if (!email || !password) return errorResponse('Email și parola sunt obligatorii.', 400);

    const result = await loginUser(email, password, rememberMe);

    // Set session cookie for middleware and server-side requests
    const response = NextResponse.json(
      { success: true, data: result, message: 'Autentificare reușită.' },
      { status: 200 }
    );

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 or 7 days
    response.cookies.set('arcdoc_session', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error: any) {
    const msg = error.message || 'Eroare la autentificare.';
    const status = msg.includes('blocat') || msg.includes('încercări') ? 429 : 401;
    return errorResponse(msg, status);
  }
}
