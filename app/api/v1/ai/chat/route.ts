import { NextRequest } from 'next/server';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { aiChatCompletion } from '@/lib/ai-provider';

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { messages } = await request.json();
    if (!messages?.length) return errorResponse('Lipsesc mesajele.', 400);
    const result = await aiChatCompletion({ messages });
    return successResponse(result);
  } catch (e: any) { return errorResponse(e.message || 'Eroare AI.'); }
}