// ============================================
// ArcDoc Enterprise - Database Connection (Turso HTTP REST API)
// ============================================

let _url = '';
let _token = '';

function getConfig() {
  if (!_url) {
    // Prefer Turso env vars, fall back to generic DATABASE_URL
    _url = (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '').trim();
    _token = (process.env.TURSO_AUTH_TOKEN || '').trim();
    // Convert libsql:// to https:// for HTTP REST API, trim any whitespace
    _url = _url.replace(/\s+/g, '');
    if (_url.startsWith('libsql://')) {
      _url = 'https://' + _url.slice('libsql://'.length);
    }
  }
  return { url: _url, token: _token };
}

interface TursoResponse {
  results: Array<{
    type: string;
    response?: {
      result?: {
        cols: Array<{ name: string }>;
        rows: Array<Array<unknown>>;
        affected_row_count: number;
      };
    };
    error?: { message: string };
  }>;
}

/**
 * Execute a query via Turso HTTP REST API.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const config = getConfig();
  const start = Date.now();

  // Convert $1 style params to ? for SQLite (respecting the numeric index so
  // repeated params like $2, $2 map to the same argument).
  let convertedSql = sql;
  const args: unknown[] = [];

  if (params && params.length > 0) {
    if (/\$\d+/.test(sql)) {
      convertedSql = sql.replace(/\$(\d+)/g, (_match, num: string) => {
        const idx = parseInt(num, 10) - 1;
        args.push(params[idx]);
        return '?';
      });
    } else {
      // SQL already uses positional ? placeholders — pass params as-is.
      args.push(...params);
    }
  }

  // Convert PostgreSQL syntax to SQLite
  convertedSql = pgToSqlite(convertedSql);

  const body = {
    requests: [
      { type: 'execute', stmt: { sql: convertedSql, args: args.length > 0 ? args.map(a => ({ type: getTursoType(a), value: String(a) })) : [] } },
      { type: 'close' },
    ],
  };

  const response = await fetch(`${config.url}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Turso API error (${response.status}): ${text.substring(0, 200)}`);
  }

  const data: TursoResponse = await response.json();
  const result = data.results?.[0];

  if (result?.error) {
    throw new Error(`SQL error: ${result.error.message}`);
  }

  const cols = result?.response?.result?.cols || [];
  const rows = result?.response?.result?.rows || [];
  const affectedCount = result?.response?.result?.affected_row_count || rows.length;

  // Convert rows to objects (Turso API returns typed values like {type:"text",value:"..."})
  const objectRows = rows.map(row => {
    const obj: Record<string, unknown> = {};
    cols.forEach((col, i) => {
      const cell = row[i];
      if (cell && typeof cell === 'object' && 'value' in cell) {
        obj[col.name] = (cell as { value: unknown }).value;
      } else if (cell && typeof cell === 'object' && (cell as { type?: string }).type === 'null') {
        // Turso returns null as {type:"null"} without a value key
        obj[col.name] = null;
      } else {
        obj[col.name] = cell;
      }
    });
    return obj as unknown as T;
  });

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Database] Query executed', { sql: convertedSql.substring(0, 80), rows: objectRows.length, ms: Date.now() - start });
  }

  return { rows: objectRows, rowCount: affectedCount };
}

function getTursoType(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'number') return Number.isInteger(val) ? 'integer' : 'float';
  return 'text';
}

function pgToSqlite(sql: string): string {
  let r = sql;
  r = r.replace(/\bILIKE\b/g, 'LIKE');
  r = r.replace(/NOW\(\)\s*\+\s*INTERVAL\s*'(\d+)\s*(\w+)'/gi, (_, n, u) => `datetime('now', '+${n} ${u}')`);
  // Bare NOW() (PostgreSQL) -> SQLite datetime('now')
  r = r.replace(/\bNOW\(\)\b/gi, "datetime('now')");
  r = r.replace(/jsonb_build_object\s*\(/gi, 'json_object(');
  // Convert all json_agg(...) forms to json_group_array(...) — handle both
  // "json_agg(DISTINCT ...)" and plain "json_agg(...)" (used in subqueries)
  r = r.replace(/json_agg\s*\(\s*DISTINCT\s+/gi, 'json_group_array(DISTINCT ');
  r = r.replace(/json_agg\s*\(/gi, 'json_group_array(');
  r = r.replace(/json_group_array\s*\(\s*DISTINCT\s+json_group_array/gi, 'json_group_array(DISTINCT ');
  r = r.replace(/\s*FILTER\s*\(\s*WHERE\s+[^)]+\)/gi, '');
  r = r.replace(/::\w+/g, '');
  r = r.replace(/\s+RETURNING\s+\w+(?:\s*,\s*\w+)*/gi, '');
  r = r.replace(/TO_CHAR\s*\(\s*(\w+)\s*,\s*'YYYY-MM'\s*\)/gi, "strftime('%Y-%m', $1)");
  return r;
}

export function buildWhereClause(filters: Record<string, unknown>, offset = 1) {
  const conds: string[] = []; const p: unknown[] = []; let i = offset;
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') {
      conds.push(`"${k}" = $${i++}`); p.push(v);
    }
  }
  return { clause: conds.length ? 'WHERE ' + conds.join(' AND ') : '', params: p, nextParamIndex: i };
}

export function buildPaginationClause(sort = 'created_at', order: 'asc'|'desc' = 'desc', page = 1, limit = 20) {
  const s = /^[a-zA-Z_]+$/.test(sort) ? sort : 'created_at';
  const o = order === 'asc' ? 'ASC' : 'DESC';
  const l = Math.min(Math.max(1, limit), 100);
  const off = (Math.max(1, page) - 1) * l;
  return `ORDER BY "${s}" ${o} LIMIT ${l} OFFSET ${off}`;
}

/**
 * Execute operations within a database transaction.
 * Uses BEGIN/COMMIT/ROLLBACK for proper transactional semantics.
 */
export async function transaction<T>(cb: (q: typeof query) => Promise<T>): Promise<T> {
  await query('BEGIN');
  try {
    const result = await cb(query);
    await query('COMMIT');
    return result;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}

export default { query, transaction, buildWhereClause, buildPaginationClause };