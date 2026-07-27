import { NextRequest } from 'next/server';
import { refreshAccessToken } from '@/lib/auth-service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) return errorResponse('Refresh token lipsă.', 400);
    const result = await refreshAccessToken(refreshToken);
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error.message || 'Token invalid.', 401);
  }
}