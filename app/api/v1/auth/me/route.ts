import { NextRequest } from 'next/server';
import { getMe } from '@/lib/auth-service';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    const payload = verifyAccessToken(token);
    const user = await getMe(payload.sub);
    if (!user) return unauthorizedResponse('Utilizator negăsit.');
    return successResponse(user);
  } catch {
    return unauthorizedResponse();
  }
}