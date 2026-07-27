# ArcDoc Enterprise - Architecture Document

## Overview

ArcDoc Enterprise is built as a **monolithic Next.js application** using the **App Router** architecture. The frontend and API are part of the same project, deployed as a single unit on Vercel.

---

## Architecture Decisions

### Why Next.js App Router?

1. **Single codebase** - No separate frontend/backend; reduces complexity
2. **Server Components** - Default server-side rendering with selective client-side interactivity
3. **API Routes** - Built-in API handling within the same project
4. **Vercel optimized** - Native deployment support, edge functions, analytics
5. **TypeScript** - Full-stack type safety

### Database Strategy

- **PostgreSQL** with raw SQL queries (no ORM)
- Direct `pg` library for connection pooling
- Parameterized queries for SQL injection prevention
- Transaction support for data integrity
- JSONB columns for flexible metadata

### Authentication Flow

```
User → Login Form → POST /api/v1/auth/login
  → Validate credentials
  → Argon2 password verification
  → Generate JWT (access + refresh)
  → Store refresh token in DB
  → Return tokens + user profile
  → Client stores in localStorage
  → Axios interceptor adds Bearer token
  → Middleware validates token on each API call
  → On 401: attempt refresh token → new access token
```

### Permission Model (RBAC)

```
User ─── N:M ─── Role ─── N:M ─── Permission ─── N:M ─── Module
                     │
                     └── Actions (create, read, update, delete, approve, etc.)
```

- Roles are **NOT hardcoded** - managed via admin panel
- Permissions are granular (`module.action`)
- Administrator role has all permissions implicitly
- Sidebar dynamically filters based on user permissions

---

## Layer Architecture

### Presentation Layer (`app/`, `components/`)
- Server Components for data fetching
- Client Components for interactivity (forms, modals)
- Mantine UI for consistent design system
- Responsive layout with AppShell

### Business Logic Layer (`services/`, `hooks/`)
- Custom hooks encapsulate business logic
- API service with Axios interceptors
- Form validation with Zod + React Hook Form

### Data Access Layer (`lib/`)
- PostgreSQL connection pool (`db.ts`)
- Query builders with SQL injection protection
- Transaction support
- Pagination helpers

### Infrastructure Layer (`lib/`, `middleware.ts`)
- Authentication (JWT, Argon2)
- Authorization (RBAC)
- Email service
- Security utilities
- Rate limiting
- Logging/Audit

---

## Data Flow

### Standard CRUD Flow
```
Client Component → React Hook → Axios Service → Next.js API Route
  → Auth Middleware → Route Handler → DB Query → JSON Response
```

### Server Component Data Fetching
```
Server Component → Direct DB Query → Render HTML → Client
```

### Real-time Notifications (Future)
```
WebSocket/SSE → Notification Service → Client Toast/In-App Notification
```

---

## Component Tree

```
RootLayout
├── MantineProvider
│   └── Notifications
└── AppLayout
    ├── Topbar
    │   ├── Logo
    │   ├── Mobile Burger
    │   └── UserMenu
    │       ├── Theme Toggle
    │       └── Profile Dropdown
    ├── Sidebar
    │   └── SidebarNav
    │       └── NavLink (recursive)
    └── Main Content
        └── Page Component
```

---

## Security Architecture

### Defense in Depth

1. **Network Layer**
   - HTTPS enforced (Vercel)
   - HSTS headers
   - CSP headers
   - CORS configured

2. **Application Layer**
   - JWT token validation
   - RBAC permission checks
   - Input validation (Zod)
   - Output sanitization
   - Rate limiting

3. **Data Layer**
   - Parameterized SQL queries
   - Argon2 password hashing
   - No sensitive data in logs
   - Audit trail for all mutations

---

## Scalability Considerations

### Database
- Connection pooling (20 connections)
- Proper indexing on all lookup columns
- JSONB for flexible metadata without schema changes
- Ready for read replicas (queries separated)

### Application
- Server Components reduce client JS
- Lazy loading for route segments
- Code splitting automatically by Next.js
- Edge-compatible API routes

### Multi-tenancy
- `company_id` on all tenant-scoped tables
- System roles (NULL company_id) shared across tenants
- Settings can be global or company-specific
- Designed for 100+ companies with 1000s of users

---

## Deployment Architecture (Vercel)

```
┌──────────────────────────────┐
│        Vercel Edge           │
│  ┌──────────────────────┐   │
│  │   Next.js App         │   │
│  │  ┌──────┐ ┌────────┐ │   │
│  │  │ SSR  │ │  API   │ │   │
│  │  │ Pages│ │ Routes │ │   │
│  │  └──────┘ └────────┘ │   │
│  └──────────────────────┘   │
│           │                  │
│           ▼                  │
│  ┌──────────────────────┐   │
│  │  PostgreSQL (Vercel  │   │
│  │  Postgres / External)│   │
│  └──────────────────────┘   │
│           │                  │
│           ▼                  │
│  ┌──────────────────────┐   │
│  │  Blob Storage (S3)   │   │
│  │  for Digital Files   │   │
│  └──────────────────────┘   │
└──────────────────────────────┘
```

---

## Module Structure

Each business module follows this pattern:

```
module/
├── api/          # API route handlers
├── components/   # React components specific to this module
├── hooks/        # Module-specific hooks
├── services/     # Business logic
├── types/        # Module-specific types
└── validations/  # Zod schemas
```

---

## Future Enhancements

1. **Redis** - Session management and caching
2. **Full-text search** - PostgreSQL tsvector or Elasticsearch
3. **WebSocket** - Real-time notifications
4. **Queue system** - Background jobs (email, document processing)
5. **CDN** - Document delivery optimization
6. **Monitoring** - Sentry, LogRocket, Vercel Analytics