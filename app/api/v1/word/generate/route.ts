import { NextRequest } from 'next/server';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateWord } from '@/lib/document-generator';

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { title, paragraphs, tableData, variables } = await request.json();
    const buffer = await generateWord({ title: title || 'Document', paragraphs: paragraphs || [], tableData, variables });
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': 'attachment; filename="document.docx"' },
    });
  } catch (e: any) { return errorResponse(e.message); }
}