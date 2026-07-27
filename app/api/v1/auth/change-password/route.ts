import { NextRequest } from 'next/server';
import { changePassword } from '@/lib/auth-service';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'));
    if (!token) return unauthorizedResponse();
    const payload = verifyAccessToken(token);
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) return errorResponse('Parola curentă și cea nouă sunt obligatorii.', 400);
    await changePassword(payload.sub, currentPassword, newPassword);
    return successResponse(null, 'Parola a fost schimbată cu succes.');
  } catch (error: any) {
    if (error.message?.includes('Parola curentă')) return errorResponse(error.message, 400);
    return unauthorizedResponse();
  }
}