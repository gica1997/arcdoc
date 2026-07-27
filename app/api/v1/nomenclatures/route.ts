import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { query } from '@/lib/db';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  const cat = new URL(request.url).searchParams.get('category');
  const where = cat ? 'WHERE category = $1' : '';
  const data = await query(`SELECT * FROM nomenclatures ${where} ORDER BY category, sort_order`, cat ? [cat] : []);
  return successResponse(data.rows);
}

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return unauthorizedResponse();
  try { verifyAccessToken(token); } catch { return unauthorizedResponse(); }
  try {
    const { category, name, code, description } = await request.json();
    if (!category || !name) return errorResponse('Categorie și nume obligatorii.', 400);
    const id = uuidv4();
    await query('INSERT INTO nomenclatures (id, category, name, code, description) VALUES ($1,$2,$3,$4,$5)', [id, category, name, code, description]);
    return createdResponse({ id });
  } catch (e: any) { return errorResponse(e.message); }
}