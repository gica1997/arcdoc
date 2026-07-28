import { NextRequest } from 'next/server';
import { getMe } from '@/lib/auth-service';
import { getAuthUser } from '@/lib/auth-handler';
import { successResponse, serverErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth.ok) return auth.response;

  try {
    const user = await getMe(auth.payload.sub);
    if (!user) return serverErrorResponse('Utilizator negăsit.');
    return successResponse(user);
  } catch {
    return serverErrorResponse();
  }
}
