import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/api-response';
import { generatePdf } from '@/lib/document-generator';

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { template_id, title, content, variables, includeQr, qrData } = await request.json();
    let templateContent = content;
    if (template_id) {
      const tpl = await query<{content: string}>('SELECT content FROM document_templates WHERE id=$1', [template_id]);
      if (tpl.rows[0]) templateContent = tpl.rows[0].content;
    }
    if (!templateContent) return errorResponse('Conținutul șablonului este gol.', 400);

    const pdfBuffer = await generatePdf({ title: title || 'Document', content: templateContent, variables, includeQr, qrData });

    // Store in generated_documents
    const id = uuidv4();
    const fileName = `doc-${id.substring(0,8)}.pdf`;
    await query('INSERT INTO generated_documents (id, template_id, generated_by, file_name, metadata) VALUES ($1,$2,$3,$4,$5)',
      [id, template_id, payload.sub, fileName, JSON.stringify({ title, variables })]);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (e: any) { return errorResponse(e.message || 'Eroare la generare PDF.'); }
}