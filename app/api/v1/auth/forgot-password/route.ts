import { NextRequest } from 'next/server';
import { forgotPassword } from '@/lib/auth-service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return errorResponse('Email lipsă.', 400);
    await forgotPassword(email);
    return successResponse(null, 'Dacă emailul există, veți primi instrucțiuni de resetare.');
  } catch (error: any) {
    return errorResponse(error.message || 'Eroare.', 400);
  }
}