import { NextRequest } from 'next/server';
import { resetPassword } from '@/lib/auth-service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) return errorResponse('Token și parola noi sunt obligatorii.', 400);
    await resetPassword(token, password);
    return successResponse(null, 'Parola a fost resetată cu succes.');
  } catch (error: any) {
    return errorResponse(error.message || 'Eroare la resetare.', 400);
  }
}