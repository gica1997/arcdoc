import { NextRequest } from 'next/server';
import { logoutUser } from '@/lib/auth-service';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    const payload = verifyAccessToken(token);
    await logoutUser(payload.sub, token);
    return successResponse(null, 'Deconectare reușită.');
  } catch {
    return unauthorizedResponse();
  }
}