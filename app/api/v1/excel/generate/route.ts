import { NextRequest } from 'next/server';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateExcel } from '@/lib/document-generator';

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { sheetName, headers, rows, title } = await request.json();
    const buffer = await generateExcel({ sheetName: sheetName || 'Export', headers: headers || [], rows: rows || [], title });
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="export.xlsx"' },
    });
  } catch (e: any) { return errorResponse(e.message); }
}