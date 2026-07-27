# ArcDoc Enterprise - Code Conventions

## General Principles

- **SOLID** principles
- **Clean Architecture**
- **Single Responsibility** per component
- **Don't Repeat Yourself** (DRY)
- **TypeScript strict mode**
- **Romanian** for UI text, **English** for code

---

## File Naming

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `UserTable.tsx` |
| Hooks | camelCase, `use` prefix | `useAuth.ts` |
| Services | camelCase | `api.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | camelCase | `user.ts` |
| Pages | lowercase/kebab | `forgot-password` |
| API Routes | `route.ts` | `route.ts` |
| Config | camelCase | `sidebar.config.ts` |

---

## Component Structure

```tsx
// 1. Imports (React → Next → Mantine → Icons → Internal)
// 2. Types/Interfaces
// 3. Component definition
// 4. Helper functions
// 5. Export default

'use client'; // or not

import React from 'react';
import { Box, Text } from '@mantine/core';
import { IconName } from '@tabler/icons-react';
import { useSomething } from '@/hooks/useSomething';

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function MyComponent({ title, children }: Props) {
  return <Box>{children}</Box>;
}
```

## API Route Structure

```ts
// route.ts
import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { validateSchema } from '@/lib/validations';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    // 2. Authorize (check permissions)
    // 3. Validate input
    // 4. Execute query
    // 5. Return response
    return successResponse(data);
  } catch (error) {
    return errorResponse('Error message');
  }
}
```

## Database Queries

- Always use **parameterized queries**: `query('SELECT * FROM users WHERE id = $1', [id])`
- Never concatenate user input into SQL strings
- Use `buildWhereClause` and `buildPaginationClause` helpers
- Wrap complex operations in `transaction()`

## TypeScript

- Use strict TypeScript with `strict: true`
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, intersections, and mapped types
- Use `Record<string, unknown>` instead of `Record<string, any>`
- Use optional chaining (`?.`) and nullish coalescing (`??`)

## Error Handling

```ts
// API level
try {
  // logic
} catch (error) {
  console.error('[Module] Error context:', error);
  return serverErrorResponse('User-friendly message');
}

// Component level
try {
  await apiCall();
} catch (error) {
  const message = handleApiError(error);
  showNotification({ color: 'red', message });
}
```

## Git Commits

Format: `type(scope): description`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

Examples:
- `feat(auth): implement JWT login endpoint`
- `fix(sidebar): correct permission filtering`
- `docs(db): update database schema documentation`

## Imports Order

1. React / Next.js
2. Third-party libraries (Mantine, Tabler Icons, etc.)
3. Internal absolute imports (`@/lib/...`, `@/hooks/...`)
4. Internal relative imports
5. Styles

## CSS/Styling

- Use Mantine components with built-in styling
- Use `className` for custom CSS (from globals.css or CSS modules)
- Use Mantine's `style` prop for dynamic inline styles
- Avoid `!important` unless absolutely necessary
- Dark mode: use CSS variables and Mantine's `colorScheme`

## Naming Conventions

- **Variables/Functions**: camelCase
- **Components**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase
- **Files**: PascalCase for components, camelCase for everything else
- **Database tables**: snake_case
- **Database columns**: snake_case

## Testing (Future)

- Unit tests: Jest + React Testing Library
- API tests: Supertest
- E2E tests: Cypress or Playwright
- Test files: `*.test.ts` or `*.spec.ts`