# ArcDoc Enterprise - API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Authenticate user, return tokens | ❌ |
| `POST` | `/auth/register` | Register new external user | ❌ |
| `POST` | `/auth/logout` | Invalidate refresh token | ✅ |
| `POST` | `/auth/refresh-token` | Refresh access token | ❌ |
| `POST` | `/auth/forgot-password` | Send password reset email | ❌ |
| `POST` | `/auth/reset-password` | Reset password with token | ❌ |
| `POST` | `/auth/change-password` | Change password (authenticated) | ✅ |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/users` | List users (paginated, filtered) | ✅ |
| `GET` | `/users/:id` | Get user by ID | ✅ |
| `POST` | `/users` | Create new user | ✅ |
| `PATCH` | `/users/:id` | Update user | ✅ |
| `DELETE` | `/users/:id` | Deactivate user | ✅ |

### Roles (`/api/v1/users/roles`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/users/roles` | List roles | ✅ |
| `POST` | `/users/roles` | Create role | ✅ |
| `PATCH` | `/users/roles/:id` | Update role | ✅ |
| `DELETE` | `/users/roles/:id` | Delete role | ✅ |

### Permissions (`/api/v1/users/permissions`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/users/permissions` | List permissions | ✅ |

### Organization (`/api/v1/organization`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/organization` | Get org structure tree | ✅ |
| `POST` | `/organization` | Create org unit | ✅ |
| `PATCH` | `/organization/:id` | Update org unit | ✅ |
| `DELETE` | `/organization/:id` | Delete org unit | ✅ |

### Archive - Funds (`/api/v1/archive/funds`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/archive/funds` | List archival funds | ✅ |
| `POST` | `/archive/funds` | Create fund | ✅ |
| `PATCH` | `/archive/funds/:id` | Update fund | ✅ |
| `DELETE` | `/archive/funds/:id` | Delete fund | ✅ |

### Archive - Inventories (`/api/v1/archive/inventories`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/archive/inventories` | List inventories | ✅ |
| `POST` | `/archive/inventories` | Create inventory | ✅ |
| `PATCH` | `/archive/inventories/:id` | Update inventory | ✅ |
| `DELETE` | `/archive/inventories/:id` | Delete inventory | ✅ |

### Archive - Units (`/api/v1/archive/units`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/archive/units` | List archival units | ✅ |
| `POST` | `/archive/units` | Create unit | ✅ |
| `PATCH` | `/archive/units/:id` | Update unit | ✅ |
| `DELETE` | `/archive/units/:id` | Delete unit | ✅ |

### Archive - Documents (`/api/v1/archive/documents`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/archive/documents` | List documents | ✅ |
| `POST` | `/archive/documents` | Create document | ✅ |
| `PATCH` | `/archive/documents/:id` | Update document | ✅ |
| `DELETE` | `/archive/documents/:id` | Delete document | ✅ |
| `GET` | `/archive/documents/:id/download` | Download digital file | ✅ |

### Requests (`/api/v1/requests`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/requests` | List requests | ✅ |
| `POST` | `/requests` | Create request | ✅ |
| `PATCH` | `/requests/:id` | Update request | ✅ |
| `POST` | `/requests/:id/approve` | Approve request | ✅ |
| `POST` | `/requests/:id/reject` | Reject request | ✅ |

### Consultations (`/api/v1/requests/consultations`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/requests/consultations` | List consultations | ✅ |
| `POST` | `/requests/consultations` | Register consultation | ✅ |
| `POST` | `/requests/consultations/:id/return` | Return document | ✅ |

### Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/dashboard` | Get dashboard statistics | ✅ |

### Settings (`/api/v1/settings`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/settings` | Get all settings | ✅ |
| `PATCH` | `/settings` | Update settings | ✅ |

### Notifications (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/notifications` | List notifications | ✅ |
| `PATCH` | `/notifications/:id/read` | Mark as read | ✅ |
| `POST` | `/notifications/read-all` | Mark all as read | ✅ |

### Audit (`/api/v1/audit`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/audit` | List audit logs | ✅ |

### Reports (`/api/v1/reports`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/reports/:type` | Generate report | ✅ |
| `GET` | `/reports/:type/export` | Export report (CSV/PDF) | ✅ |

### Email Templates (`/api/v1/email/templates`)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/email/templates` | List email templates | ✅ |
| `POST` | `/email/templates` | Create template | ✅ |
| `PATCH` | `/email/templates/:id` | Update template | ✅ |

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Success with Pagination

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error description"
}
```

---

## HTTP Status Codes

| Code | Description |
|---|---|
| `200` | Success |
| `201` | Created |
| `204` | No Content |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `422` | Validation Error |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

---

## Pagination

All list endpoints support pagination via query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `sort` | string | `created_at` | Sort column |
| `order` | string | `desc` | Sort direction (`asc`/`desc`) |
| `search` | string | - | Search term |

---

**Note:** These endpoints are prepared as infrastructure stubs. Full implementation will be done in Stage 2 (Authentication & User Management) onwards.