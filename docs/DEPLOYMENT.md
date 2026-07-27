# ArcDoc Enterprise - Deployment Guide

## Overview

ArcDoc Enterprise is deployed as a single Next.js application on Vercel. No separate backend servers required.

## Prerequisites

- **Vercel Account** (Pro or Enterprise recommended)
- **PostgreSQL Database** (Vercel Postgres, Neon, or external)
- **S3-compatible Object Storage** (Cloudflare R2, AWS S3, etc.)
- **SMTP Server** (for email notifications)

## Environment Variables

Configure these in Vercel Project Settings → Environment Variables:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret (generate with `openssl rand -base64 32`) | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Yes |
| `NEXT_PUBLIC_APP_URL` | Production URL (e.g., `https://arcdoc.vercel.app`) | Yes |
| `SMTP_HOST` | SMTP server host | Optional |
| `SMTP_PORT` | SMTP server port | Optional |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASS` | SMTP password | Optional |
| `SMTP_FROM` | Sender email address | Optional |
| `AI_PROVIDER` | AI provider (`ollama`, `openai`, `azure`, `gemini`, `claude`) | Optional |
| `AI_API_KEY` | AI provider API key | Optional |
| `AI_BASE_URL` | AI provider base URL | Optional |
| `AI_MODEL` | AI model name | Optional |
| `DEFAULT_TENANT_ID` | Default company ID for multi-tenant | Optional |

## Deployment Steps

### 1. Database Setup

Run the migration SQL files in order:
1. `docs/MIGRATION_V2.sql` - Core tables
2. `docs/MIGRATION_V3.sql` - Organization tables
3. `docs/MIGRATION_V4.sql` - Archive tables
4. `docs/MIGRATION_V5.sql` - Document tables
5. `docs/MIGRATION_V6.sql` - Request tables
6. `docs/MIGRATION_V7.sql` - Templates/Reports
7. `docs/MIGRATION_V8.sql` - Physical archive
8. `docs/MIGRATION_SAAS.sql` - SaaS multi-tenant

### 2. Vercel Project Setup

1. Import your Git repository into Vercel
2. Framework preset: **Next.js**
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Install Command: `npm install`
6. Configure environment variables
7. Deploy

### 3. Object Storage Setup

Configure S3-compatible storage via environment variables. Documents are stored via configurable providers. Provider configuration uses environment variables.

### 4. Post-Deployment

1. Access the application at your Vercel domain
2. Login with admin credentials: `admin@arcdoc.ro` (default password: `Admin123!`)
3. Change the admin password immediately
4. Configure company settings
5. Create departments, locations, and archive structure
6. Add users and assign roles

## Monitoring

- **Vercel Analytics**: Enable in Vercel dashboard
- **Health Check**: `GET /api/v1/admin/health`
- **Vercel Logs**: Available in the Vercel dashboard under "Logs"

## Scaling

Vercel automatically scales based on traffic. For enterprise deployments:
- Upgrade to Vercel Pro/Enterprise for higher bandwidth and compute
- Use Vercel Edge Functions for latency-sensitive endpoints
- Configure PostgreSQL pooling for connection management (consider `DATABASE_URL` pooling)
- Monitor Vercel Analytics for bottleneck identification

## Security Checklist

- [ ] All secrets are stored in Vercel environment variables (not in code)
- [ ] JWT secrets are strong random strings (min 32 chars)
- [ ] Database uses SSL connections
- [ ] Admin password changed from default
- [ ] Rate limiting configured via Vercel WAF or application middleware
- [ ] CORS restricted to production domain
- [ ] .env file NOT committed to Git

## Rollback

1. In Vercel dashboard, go to Deployments
2. Select a previous successful deployment
3. Click "Promote to Production"

## Support Files

- `vercel.json` - Vercel configuration (headers, regions, redirects)
- `next.config.ts` - Next.js configuration
- `.env.example` - Environment variables template