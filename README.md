# ArcDoc Enterprise

**Platformă Enterprise pentru Managementul Arhivei Fizice și Digitale**

---

## 📋 Overview

ArcDoc Enterprise este o platformă modernă, scalabilă, destinată instituțiilor care gestionează arhive fizice și digitale. Platforma deservește atât utilizatori interni (administratori, arhivari, operatori), cât și utilizatori externi (persoane fizice, persoane juridice, instituții) care pot depune și urmări solicitări de documente.

## 🏗️ Tehnologii

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **UI Library** | Mantine UI v8 |
| **Icons** | Tabler Icons |
| **Validation** | Zod v4 |
| **Forms** | React Hook Form |
| **HTTP Client** | Axios |
| **Auth** | JWT + Argon2 |
| **Database** | PostgreSQL (raw SQL queries) |
| **Email** | SMTP (configurable) |
| **Quality** | ESLint + Prettier + Husky |
| **Deployment** | Vercel |

## 📁 Project Structure

```
arcdoc/
├── app/                          # Next.js App Router
│   ├── api/v1/                   # REST API endpoints
│   │   ├── auth/                 # Authentication
│   │   ├── users/                # User management
│   │   ├── archive/              # Archival funds, inventories, units, documents
│   │   ├── requests/             # Document requests
│   │   ├── dashboard/            # Dashboard data
│   │   ├── settings/             # Settings
│   │   ├── notifications/        # Notifications
│   │   ├── audit/                # Audit logs
│   │   ├── reports/              # Reports
│   │   ├── organization/         # Organizational structure
│   │   └── email/                # Email templates
│   ├── (auth)/                   # Authentication pages
│   ├── dashboard/                # Dashboard page
│   ├── arhiva/                   # Archive pages
│   ├── solicitari/               # Requests pages
│   ├── utilizatori/              # Users pages
│   ├── administrare/             # Admin pages
│   ├── setari/                   # Settings pages
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (redirect)
├── components/                   # React components
│   ├── layout/                   # AppShell, Sidebar, Topbar
│   ├── ui/                       # LoadingScreen, ErrorPage
│   ├── forms/                    # Form components
│   └── tables/                   # Table components
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   └── usePermissions.ts         # RBAC permissions hook
├── services/                     # API client
│   └── api.ts                    # Axios instance
├── lib/                          # Core library
│   ├── config.ts                 # App configuration
│   ├── db.ts                     # PostgreSQL connection
│   ├── auth.ts                   # JWT + Argon2 utils
│   ├── api-response.ts           # API response helpers
│   ├── validations.ts            # Zod schemas
│   ├── email.ts                  # Email service
│   ├── security.ts               # Security utilities
│   └── sidebar.config.ts         # Sidebar configuration
├── types/                        # TypeScript types
│   └── index.ts                  # All type definitions
├── utils/                        # Utility functions
├── middleware.ts                  # Next.js middleware
├── docs/                         # Documentation
│   ├── DATABASE.md               # Database schema docs
│   ├── API.md                    # API documentation
│   ├── ARCHITECTURE.md           # Architecture docs
│   └── CONVENTIONS.md            # Code conventions
└── public/                       # Static assets
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd arcdoc

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/arcdoc` |
| `JWT_SECRET` | JWT signing secret | `arcdoc-jwt-secret-development-only` |
| `JWT_REFRESH_SECRET` | JWT refresh secret | `arcdoc-jwt-refresh-secret-dev` |
| `JWT_EXPIRES_IN` | Access token expiration | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `SMTP_HOST` | SMTP server host | `smtp.example.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `noreply@arcdoc.ro` |
| `SMTP_PASS` | SMTP password | - |
| `SMTP_FROM` | Sender email address | `noreply@arcdoc.ro` |

## 📊 Database

The database schema is documented in [docs/DATABASE.md](docs/DATABASE.md).

Key tables:
- `companies` - Multi-tenant companies
- `users` - Internal and external users
- `roles` - Dynamic role definitions
- `permissions` - Granular permissions
- `modules` - Application modules
- `archival_funds` - Archival fund collections
- `inventories` - Inventory registers
- `archival_units` - Individual archival units
- `documents` - Digital/physical documents
- `requests` - Document access requests
- `notifications` - User notifications
- `audit_logs` - Immutable audit trail
- `email_templates` - Email templates
- `communication_history` - Communication logs

## 🔐 Authentication & Authorization

- **JWT** (HS256) for stateless authentication
- **Argon2id** for password hashing (OWASP recommended)
- **Refresh tokens** for seamless session renewal
- **RBAC** with dynamic roles and permissions:
  - Users → Roles → Permissions → Modules → Actions
  - Roles are NOT hardcoded - fully configurable from the admin panel

## 🛡️ Security

- XSS protection via input sanitization
- SQL injection prevention via parameterized queries
- Rate limiting on API routes
- CORS configuration for Vercel deployment
- HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
- CSRF protection via SameSite cookies
- Input validation with Zod schemas

## 📝 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run type-check` | TypeScript type checking |
| `npm run prepare` | Husky prepare script |

## 📚 Documentation

- [Database Schema](docs/DATABASE.md)
- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Code Conventions](docs/CONVENTIONS.md)

## 🎯 Development Stages

| Stage | Description | Status |
|---|---|---|
| **Etapa 1** | Architecture & Foundation | ✅ Current |
| **Etapa 2** | Authentication & User Management | 🔜 Next |
| **Etapa 3** | Archive Management Module | 📋 Planned |
| **Etapa 4** | Requests & Consultations | 📋 Planned |
| **Etapa 5** | Reports & Analytics | 📋 Planned |
| **Etapa 6** | External Portal | 📋 Planned |
| **Etapa 7** | Optimizations & Production | 📋 Planned |

## 📄 License

Proprietary - ArcDoc © 2026. All rights reserved.