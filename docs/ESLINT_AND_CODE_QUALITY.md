# ESLint and Code Quality Guide

## Cleaning Up Unused Imports

The ESLint rule `@typescript-eslint/no-unused-vars` has been enabled to catch unused imports and variables. This helps maintain code quality and reduces bundle size.

### Running ESLint

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint -- --fix
```

### Common Unused Import Patterns

1. **Unused React imports after JSX transform:**
   ```typescript
   // Before (after React 17, no longer needed)
   import React from 'react';
   
   // After
   // No import needed - remove it!
   ```

2. **Unused destructured imports:**
   ```typescript
   // Before
   import { Button, Input, Card } from '@/components/ui';
   
   export function MyComponent() {
     return <Button>Click me</Button>; // Input and Card unused
   }
   
   // After
   import { Button } from '@/components/ui';
   
   export function MyComponent() {
     return <Button>Click me</Button>;
   }
   ```

3. **Unused type imports:**
   ```typescript
   // Before
   import { UserType, AdminType } from '@/types';
   
   function getUser(): UserType { // AdminType unused
     return { id: 1, name: 'John' };
   }
   
   // After
   import type { UserType } from '@/types';
   
   function getUser(): UserType {
     return { id: 1, name: 'John' };
   }
   ```

4. **Unused variables:**
   ```typescript
   // Before
   const unused = 'value';
   const used = 'I am used';
   console.log(used);
   
   // After
   const used = 'I am used';
   console.log(used);
   ```

### Prefixing Intentionally Unused Variables

Sometimes you need a variable but don't use it. Prefix it with an underscore:

```typescript
// Intentionally unused parameter
function handler(_event) {
  console.log('Handler called');
}

// Destructuring but not using some properties
const { id, _deprecated, name } = user;
console.log(id, name);
```

## Related Tools

### 1. Automatic Import Cleanup with Pylance

If using VS Code with Pylance, run this refactoring:
- Command: `Pylance: Remove unused imports`
- Or in the editor: Right-click → "Quick Fix" → "Remove unused imports"

### 2. Import Sorting

Keep imports organized with this pattern:
```typescript
// 1. External libraries
import React from 'react';
import { useEffect } from 'react';
import { collection } from 'firebase/firestore';

// 2. Internal components
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';

// 3. Internal hooks
import { useAuth } from '@/hooks/useAuth';

// 4. Internal types
import type { User } from '@/types';

// 5. Internal utilities
import { formatDate } from '@/lib/utils';

// 6. Styles
import './Component.css';
```

## Best Practices

1. **Use unused variable prefix:** If a variable is required (function parameter, destructuring) but intentionally unused, prefix with `_`
2. **Regular cleanup:** Run `npm run lint -- --fix` weekly
3. **Type imports:** Use `import type` for TypeScript types only
4. **Tree-shaking:** Only import what you need
5. **Code review:** Check for unused imports during code review

## Fixed Issues

The following files should be reviewed for unused imports cleanup:

- [ ] `src/App.tsx`
- [ ] `src/main.tsx`
- [ ] `src/pages/*.tsx`
- [ ] `src/components/*.tsx`
- [ ] `src/context/*.tsx`
- [ ] `src/hooks/*.ts`

## Additional ESLint Rules Enabled

- `@typescript-eslint/no-unused-vars`: Warns about unused variables and imports
  - Ignores parameters starting with `_`
  - Ignores variables starting with `_`
  - Ignores caught errors starting with `_`

## Maintenance

Run these commands regularly:

```bash
# Check for issues
npm run lint

# Fix automatically
npm run lint -- --fix

# Run tests
npm test

# Build check
npm run build
```
