import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query, buildPaginationClause } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, successPaginatedResponse, createdResponse, errorResponse, unauthorizedResponse, buildPaginationMeta, parsePaginationParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  const { searchParams } = new URL(request.url);
  const { page, limit, sort, order } = parsePaginationParams(searchParams);
  const search = searchParams.get('search') || '';
  const fundId = searchParams.get('fund_id');
  const seriesId = searchParams.get('series_id');
  const typeId = searchParams.get('type_id');
  const status = searchParams.get('status');
  const format = searchParams.get('format');
  const departmentId = searchParams.get('department_id');
  const confidentiality = searchParams.get('confidentiality');

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (search) { conditions.push(`(d.title ILIKE $${idx} OR d.code ILIKE $${idx} OR d.number ILIKE $${idx} OR d.description ILIKE $${idx} OR d.ocr_text ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
  if (fundId) { conditions.push(`d.fund_id = $${idx}`); params.push(fundId); idx++; }
  if (seriesId) { conditions.push(`d.series_id = $${idx}`); params.push(seriesId); idx++; }
  if (typeId) { conditions.push(`d.document_type = $${idx}`); params.push(typeId); idx++; }
  if (status) { conditions.push(`d.status = $${idx}`); params.push(status); idx++; }
  if (format) { conditions.push(`d.format = $${idx}`); params.push(format); idx++; }
  if (departmentId) { conditions.push(`d.department_id = $${idx}`); params.push(departmentId); idx++; }
  if (confidentiality) { conditions.push(`d.confidentiality_level = $${idx}`); params.push(confidentiality); idx++; }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM documents d ${where}`, params
  );
  const total = parseInt(countResult.rows[0]?.total || '0', 10);

  const limitOffset = buildPaginationClause(sort, order, page, limit);
  const data = await query<any>(
    `SELECT d.*,
      f.name as fund_name, ds.name as series_name, dt.name as type_name,
      dep.name as department_name, u.first_name || ' ' || u.last_name as created_by_name,
      (SELECT da.file_url FROM document_attachments da WHERE da.document_id = d.id AND da.is_primary = true LIMIT 1) as primary_file
    FROM documents d
    LEFT JOIN archival_funds f ON f.id = d.fund_id
    LEFT JOIN document_series ds ON ds.id = d.series_id
    LEFT JOIN document_types dt ON dt.code = d.document_type
    LEFT JOIN organizational_structure dep ON dep.id = d.department_id
    LEFT JOIN users u ON u.id = d.created_by
    ${where} ORDER BY d.${sort} ${order} LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    params
  );

  return successPaginatedResponse(data.rows, buildPaginationMeta(total, page, limit));
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  let payload;
  try { payload = verifyAccessToken(token); } catch { return unauthorizedResponse(); }

  try {
    const body = await request.json();
    const fields = ['title','code','number','document_type','description','category','subcategory','fund_id','series_id','classification_id','department_id','responsible_id','issue_date','registration_date','expiry_date','retention_period_id','confidentiality_level','format','status','observations','custom_fields','archive_location_id'];
    const columns: string[] = ['id','created_by'];
    const values: unknown[] = [uuidv4(), payload.sub];
    const placeholders: string[] = ['$1','$2'];
    let i = 3;
    for (const f of fields) {
      if (body[f] !== undefined && body[f] !== '') {
        columns.push(f); placeholders.push(`$${i}`); values.push(body[f]); i++;
      }
    }
    await query(`INSERT INTO documents (${columns.join(',')}) VALUES (${placeholders.join(',')})`, values);

    // Handle tags
    if (body.tags && Array.isArray(body.tags)) {
      for (const tag of body.tags) {
        await query('INSERT INTO document_tags (document_id, tag) VALUES ($1,$2)', [values[0], tag]);
      }
    }

    return createdResponse({ id: values[0] }, 'Document creat.');
  } catch (e: any) {
    if (e.message?.includes('duplicate') || e.message?.includes('unique')) return errorResponse('Cod duplicat.', 409);
    return errorResponse(e.message || 'Eroare la creare document.');
  }
}