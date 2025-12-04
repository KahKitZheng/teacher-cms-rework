# ADR 0007: Validation System Architecture

**Status:** Proposed

**Date:** 2025-01

**Deciders:** Development Team

**Related:**
- [Improvement Questions - Q5](../discussions/improvement-questions.md#q5-validation-before-save)
- [Data Structure Architecture](0001-data-structure-architecture.md)
- [Data Persistence Architecture](0005-data-persistence-architecture.md)

---

## Context

The current system has **no formal validation layer**. Data can be saved in invalid states:

### Current Problems

1. **No Required Field Validation**
   ```typescript
   // Can save a tile with empty name!
   const tile: Tile = {
     id: 1,
     name: '', // Invalid but allowed
     blocks: [],
     rows: [],
   };
   ```

2. **No Structure Constraints**
   ```typescript
   // Can create invalid hierarchies
   const block: TileInfoBlock = {
     id: 1,
     parentId: 999, // Parent doesn't exist!
     type: 'text',
   };
   ```

3. **No Type Validation**
   ```typescript
   // Can assign invalid types
   const block: TileInfoBlock = {
     type: 'unknown-type', // Not in registry!
   };
   ```

4. **No Business Logic Validation**
   - Maximum nesting depth (prevent 50-level deep structures)
   - Duplicate detection (prevent duplicate block IDs)
   - Circular references (prevent accordion containing itself)

5. **Errors Only at Save Time**
   - User fills out form
   - Clicks save
   - Server returns error
   - User must fix and retry
   - **Bad UX**: No feedback until too late

---

## Decision

We will implement a **TypeScript-Based Validation System** with **runtime validation** at multiple layers.

### Core Principles

1. **Fail Fast**: Validate as early as possible (creation time, not save time)
2. **Type Safety**: Leverage TypeScript for compile-time validation
3. **Runtime Validation**: Use Zod for runtime type checking
4. **Layered Validation**: Multiple validation points (UI, client, server)
5. **Clear Error Messages**: Tell users exactly what's wrong and how to fix it

---

## Validation Architecture

### Layer 1: TypeScript (Compile-Time)

**What it validates:**
- Type correctness
- Required fields at type level
- Enum values

```typescript
// src/types/tileInfo.ts

export type Tile = {
  id: string;
  name: string; // Required by type system
  blocks: TileInfoBlock[]; // Must be array
  rows: TileInfoAccordion[];
};

export type BlockType =
  | 'text'
  | 'heading'
  | 'dropdown'
  | 'accordion'
  | 'columnLayout';

export type TileInfoBlock = {
  id: string;
  type: BlockType; // Only valid types allowed
  parentId: string;
  // ...
};
```

**Benefits:**
- ✅ Catches basic errors at compile time
- ✅ IDE autocomplete and IntelliSense
- ✅ Refactoring safety

**Limitations:**
- ❌ No runtime validation
- ❌ Can't validate business logic
- ❌ Can't validate relationships

---

### Layer 2: Zod Schemas (Runtime Validation)

**What it validates:**
- Runtime type checking
- Required fields
- String constraints (min/max length)
- Number constraints (min/max value)
- Array constraints (min/max items)
- Custom validation logic

```typescript
// src/validation/schemas.ts

import { z } from 'zod';

export const TileSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, 'Tile name is required')
    .max(100, 'Tile name must be less than 100 characters'),
  blocks: z.array(z.lazy(() => TileInfoBlockSchema)),
  rows: z.array(z.lazy(() => TileInfoAccordionSchema)),
});

export const TileInfoBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['text', 'heading', 'dropdown', 'accordion', 'columnLayout']),
  parentId: z.string().uuid(),
  parentType: z.enum(['tile', 'row', 'column']),
  level: z.enum(['tile', 'accordion', 'columnLayout']),
  order: z.number().int().min(0),
  name: z.string().min(1, 'Block name is required'),
});

export const TileInfoTextSchema = TileInfoBlockSchema.extend({
  type: z.literal('text'),
  description: z.string().optional(),
});

export const TileInfoHeadingSchema = TileInfoBlockSchema.extend({
  type: z.literal('heading'),
  variant: z.enum(['h1', 'h2', 'h3', 'h4']).optional(),
  content: z.string().min(1, 'Heading content is required'),
});

// Type inference from schemas
export type Tile = z.infer<typeof TileSchema>;
export type TileInfoBlock = z.infer<typeof TileInfoBlockSchema>;
export type TileInfoText = z.infer<typeof TileInfoTextSchema>;
export type TileInfoHeading = z.infer<typeof TileInfoHeadingSchema>;
```

**Validation Function:**

```typescript
// src/validation/validate.ts

import { ZodSchema, ZodError } from 'zod';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

export type ValidationError = {
  path: string; // "blocks[0].name"
  message: string; // "Block name is required"
  code: string; // "too_small"
};

export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into our error structure
  const errors: ValidationError[] = result.error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return { success: false, errors };
}
```

**Usage:**

```typescript
// Validate before save
const result = validate(TileSchema, tile);

if (!result.success) {
  // Show errors to user
  result.errors.forEach(err => {
    console.error(`${err.path}: ${err.message}`);
  });
  return;
}

// Data is now type-safe and validated
const validTile = result.data;
await api.saveTile(validTile);
```

---

### Layer 3: Business Logic Validation

**What it validates:**
- Nesting depth limits
- Parent-child relationships
- Circular references
- Duplicate prevention
- Block type compatibility

```typescript
// src/validation/businessRules.ts

export type BusinessValidationError = {
  type: 'max_depth' | 'missing_parent' | 'circular_reference' | 'invalid_nesting';
  message: string;
  entityId: string;
  details?: Record<string, any>;
};

export class BusinessValidator {
  private maxDepth = 5;

  validateTile(tile: Tile): BusinessValidationError[] {
    const errors: BusinessValidationError[] = [];

    // Validate nesting depth
    errors.push(...this.validateDepth(tile));

    // Validate parent-child relationships
    errors.push(...this.validateReferences(tile));

    // Validate circular references
    errors.push(...this.validateCircularReferences(tile));

    // Validate block type compatibility
    errors.push(...this.validateBlockTypes(tile));

    return errors;
  }

  private validateDepth(tile: Tile): BusinessValidationError[] {
    const errors: BusinessValidationError[] = [];

    function checkDepth(
      entity: any,
      depth: number,
      path: string[]
    ): void {
      if (depth > this.maxDepth) {
        errors.push({
          type: 'max_depth',
          message: `Maximum nesting depth (${this.maxDepth}) exceeded at ${path.join(' → ')}`,
          entityId: entity.id,
          details: { depth, path },
        });
      }

      // Recursively check children
      if (entity.blocks) {
        entity.blocks.forEach((block: any) =>
          checkDepth(block, depth + 1, [...path, block.name])
        );
      }
      if (entity.rows) {
        entity.rows.forEach((row: any) =>
          checkDepth(row, depth + 1, [...path, row.type])
        );
      }
    }

    checkDepth(tile, 1, [tile.name]);
    return errors;
  }

  private validateReferences(tile: Tile): BusinessValidationError[] {
    const errors: BusinessValidationError[] = [];
    const allIds = new Set<string>();

    // Collect all IDs
    function collectIds(entity: any): void {
      allIds.add(entity.id);
      entity.blocks?.forEach(collectIds);
      entity.rows?.forEach(collectIds);
      entity.columns?.forEach(collectIds);
    }

    collectIds(tile);

    // Check that all parentIds exist
    function checkReferences(entity: any): void {
      if (entity.parentId && !allIds.has(entity.parentId)) {
        errors.push({
          type: 'missing_parent',
          message: `Parent ${entity.parentId} does not exist`,
          entityId: entity.id,
          details: { parentId: entity.parentId },
        });
      }

      entity.blocks?.forEach(checkReferences);
      entity.rows?.forEach(checkReferences);
      entity.columns?.forEach(checkReferences);
    }

    tile.blocks.forEach(checkReferences);
    tile.rows.forEach(checkReferences);

    return errors;
  }

  private validateCircularReferences(tile: Tile): BusinessValidationError[] {
    const errors: BusinessValidationError[] = [];
    const visited = new Set<string>();

    function detectCycle(
      entity: any,
      ancestors: Set<string>
    ): void {
      if (ancestors.has(entity.id)) {
        errors.push({
          type: 'circular_reference',
          message: `Circular reference detected: ${entity.name} contains itself`,
          entityId: entity.id,
          details: { ancestors: Array.from(ancestors) },
        });
        return;
      }

      const newAncestors = new Set(ancestors);
      newAncestors.add(entity.id);

      entity.blocks?.forEach((block: any) => detectCycle(block, newAncestors));
      entity.rows?.forEach((row: any) => detectCycle(row, newAncestors));
    }

    tile.blocks.forEach(block => detectCycle(block, new Set()));
    tile.rows.forEach(row => detectCycle(row, new Set()));

    return errors;
  }

  private validateBlockTypes(tile: Tile): BusinessValidationError[] {
    const errors: BusinessValidationError[] = [];

    function checkBlockType(entity: any, parentType: string): void {
      // Check if block type is allowed in parent
      const allowedTypes = getAllowedBlockTypes(parentType);

      if (!allowedTypes.includes(entity.type)) {
        errors.push({
          type: 'invalid_nesting',
          message: `Block type "${entity.type}" is not allowed inside "${parentType}"`,
          entityId: entity.id,
          details: { blockType: entity.type, parentType },
        });
      }

      entity.blocks?.forEach((block: any) => checkBlockType(block, entity.type));
      entity.rows?.forEach((row: any) => checkBlockType(row, entity.type));
    }

    tile.blocks.forEach(block => checkBlockType(block, 'tile'));
    tile.rows.forEach(row => checkBlockType(row, 'tile'));

    return errors;
  }
}

function getAllowedBlockTypes(parentType: string): string[] {
  const rules: Record<string, string[]> = {
    tile: ['text', 'heading', 'dropdown', 'accordion', 'columnLayout'],
    accordion: ['text', 'heading', 'columnLayout'],
    column: ['text', 'heading', 'dropdown'],
  };

  return rules[parentType] || [];
}
```

---

### Layer 4: UI Validation (Real-Time Feedback)

**What it validates:**
- Form fields as user types
- Immediate feedback
- Visual error indicators

```typescript
// src/hooks/useValidation.ts

import { useState, useEffect } from 'react';
import { ZodSchema } from 'zod';
import { validate, ValidationError } from '../validation/validate';

export function useValidation<T>(
  schema: ZodSchema<T>,
  data: unknown,
  options: {
    validateOnChange?: boolean;
    debounceMs?: number;
  } = {}
) {
  const { validateOnChange = true, debounceMs = 300 } = options;

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (!validateOnChange) return;

    const timeoutId = setTimeout(() => {
      const result = validate(schema, data);

      if (result.success) {
        setErrors([]);
        setIsValid(true);
      } else {
        setErrors(result.errors);
        setIsValid(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [data, schema, validateOnChange, debounceMs]);

  return { errors, isValid };
}
```

**Usage in Component:**

```typescript
// src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoText/edit/TileInfoTextEdit.tsx

export function TileInfoTextEdit({ tileInfo }: Props) {
  const [name, setName] = useState(tileInfo.name);
  const [description, setDescription] = useState(tileInfo.description);

  // Real-time validation
  const { errors, isValid } = useValidation(
    TileInfoTextSchema,
    { ...tileInfo, name, description }
  );

  const nameError = errors.find(e => e.path === 'name');
  const descriptionError = errors.find(e => e.path === 'description');

  return (
    <div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        className={nameError ? 'error' : ''}
      />
      {nameError && (
        <span className="error-message">{nameError.message}</span>
      )}

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        className={descriptionError ? 'error' : ''}
      />
      {descriptionError && (
        <span className="error-message">{descriptionError.message}</span>
      )}

      <button disabled={!isValid}>Save</button>
    </div>
  );
}
```

---

## Validation Flow

### Create New Block

```typescript
// 1. User clicks "Add Text Block"
function handleAddTextBlock() {
  // 2. Create block with defaults
  const newBlock: TileInfoText = {
    id: generateId(),
    type: 'text',
    parentId: tile.id,
    parentType: 'tile',
    level: 'tile',
    order: tile.blocks.length,
    name: 'New Text Block', // Default valid name
    description: '',
  };

  // 3. Validate with Zod
  const validationResult = validate(TileInfoTextSchema, newBlock);

  if (!validationResult.success) {
    // Show validation errors (shouldn't happen with good defaults)
    console.error('Invalid block', validationResult.errors);
    return;
  }

  // 4. Validate business rules
  const businessValidator = new BusinessValidator();
  const businessErrors = businessValidator.validateTile({
    ...tile,
    blocks: [...tile.blocks, newBlock],
  });

  if (businessErrors.length > 0) {
    // Show business rule errors (e.g., max depth exceeded)
    alert(businessErrors[0].message);
    return;
  }

  // 5. Add to state
  setTile({
    ...tile,
    blocks: [...tile.blocks, newBlock],
  });
}
```

### Save Tile

```typescript
async function handleSave() {
  // 1. Validate schema
  const schemaResult = validate(TileSchema, tile);

  if (!schemaResult.success) {
    showValidationErrors(schemaResult.errors);
    return;
  }

  // 2. Validate business rules
  const businessValidator = new BusinessValidator();
  const businessErrors = businessValidator.validateTile(tile);

  if (businessErrors.length > 0) {
    showBusinessErrors(businessErrors);
    return;
  }

  // 3. Server-side validation (final check)
  try {
    await api.saveTile(tile);
    showSuccess('Tile saved successfully');
  } catch (error) {
    if (error.response?.status === 422) {
      // Server validation failed
      showValidationErrors(error.response.data.errors);
    } else {
      showError('Failed to save tile');
    }
  }
}
```

---

## Validation Error Display

### Inline Field Errors

```tsx
<input
  value={name}
  onChange={e => setName(e.target.value)}
  className={cn(
    styles.input,
    nameError && styles.inputError
  )}
  aria-invalid={!!nameError}
  aria-describedby={nameError ? 'name-error' : undefined}
/>
{nameError && (
  <span id="name-error" className={styles.errorMessage}>
    {nameError.message}
  </span>
)}
```

### Toast Notifications

```typescript
function showValidationErrors(errors: ValidationError[]) {
  toast.error(
    <div>
      <strong>Validation failed</strong>
      <ul>
        {errors.map((err, i) => (
          <li key={i}>
            {err.path}: {err.message}
          </li>
        ))}
      </ul>
    </div>,
    { duration: 5000 }
  );
}
```

### Error Summary Panel

```tsx
{errors.length > 0 && (
  <div className={styles.errorSummary}>
    <h3>Please fix the following errors:</h3>
    <ul>
      {errors.map((err, i) => (
        <li key={i}>
          <button onClick={() => scrollToField(err.path)}>
            {err.path}: {err.message}
          </button>
        </li>
      ))}
    </ul>
  </div>
)}
```

---

## Server-Side Validation

Backend must validate **all data** to prevent malicious clients:

```typescript
// backend/routes/tiles.ts

import { TileSchema } from '../validation/schemas';
import { BusinessValidator } from '../validation/businessRules';

router.post('/tiles', async (req, res) => {
  // 1. Schema validation
  const schemaResult = validate(TileSchema, req.body);

  if (!schemaResult.success) {
    return res.status(422).json({
      error: 'Validation failed',
      errors: schemaResult.errors,
    });
  }

  // 2. Business rules validation
  const businessValidator = new BusinessValidator();
  const businessErrors = businessValidator.validateTile(schemaResult.data);

  if (businessErrors.length > 0) {
    return res.status(422).json({
      error: 'Business rule validation failed',
      errors: businessErrors,
    });
  }

  // 3. Authorization check
  const canEdit = await checkPermission(req.user, schemaResult.data.id);
  if (!canEdit) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 4. Save to database
  const savedTile = await db.saveTile(schemaResult.data);

  return res.status(200).json(savedTile);
});
```

---

## Migration Strategy

### Phase 1: Add Zod Schemas (Non-Breaking)

1. Install Zod
   ```bash
   npm install zod
   ```

2. Create validation schemas
   - Define schemas for all types
   - Co-locate with TypeScript types

3. Add validation utility functions
   - `validate()` function
   - Error formatting helpers

4. Test schemas independently
   - Unit tests for each schema
   - Verify error messages

### Phase 2: Add UI Validation

1. Create `useValidation` hook
2. Add validation to form components
3. Display inline errors
4. Disable save when invalid

### Phase 3: Add Business Rule Validation

1. Implement `BusinessValidator` class
2. Add validation before save
3. Display business rule errors
4. Add tests for all rules

### Phase 4: Server-Side Validation

1. Share Zod schemas with backend (monorepo or npm package)
2. Add validation middleware
3. Return 422 errors for invalid data
4. Log validation failures

**Timeline:** ~2 weeks

---

## Consequences

### Positive

- ✅ **Catch errors early**: Before user clicks save
- ✅ **Better UX**: Immediate feedback as user types
- ✅ **Prevent invalid data**: No bad data in database
- ✅ **Type safety**: Runtime validation matches TypeScript types
- ✅ **Clear error messages**: Tell user exactly what's wrong
- ✅ **Testable**: Easy to test validation rules
- ✅ **Shared validation**: Same schemas on client and server
- ✅ **Self-documenting**: Schemas serve as documentation

### Negative

- ⚠️ **Bundle size**: Zod adds ~10KB gzipped
- ⚠️ **Performance**: Validation on every keystroke (mitigated by debouncing)
- ⚠️ **Maintenance**: Must keep schemas in sync with types
- ⚠️ **Learning curve**: Team must learn Zod

### Trade-offs

- **Performance vs UX**: Small performance cost for better user experience
- **Complexity vs Safety**: More validation code, but fewer bugs
- **Bundle size vs Runtime Safety**: Larger bundle, but catch more errors

---

## Alternatives Considered

### Alternative 1: No Validation (Current)

**Rejected:**
- ❌ Allows invalid data in database
- ❌ Poor user experience (errors only at save time)
- ❌ Hard to debug issues

### Alternative 2: Backend-Only Validation

**Rejected:**
- ❌ No real-time feedback
- ❌ Wasted API calls
- ❌ Poor UX (must submit to see errors)

### Alternative 3: Custom Validation Functions

**Rejected:**
- ❌ Reinventing the wheel
- ❌ Hard to maintain
- ❌ No type inference
- ❌ Zod provides better error messages

### Alternative 4: Yup (Alternative to Zod)

**Considered:**
- Similar feature set
- **Rejected**: Zod has better TypeScript integration and type inference

---

## Open Questions

1. **Performance**: Will validation on every keystroke be too slow?
   - **Mitigation**: Debounce validation (300ms default)
   - **Measurement**: Monitor performance with React DevTools

2. **Error message customization**: Should errors be translatable?
   - **Deferred**: Start with English, add i18n later if needed

3. **Partial validation**: Should we allow saving partially valid data as draft?
   - **Recommendation**: Yes, add "Save as Draft" button with relaxed validation

---

## Success Metrics

### Measure Before/After

1. **Invalid data in database**: Count of records with missing required fields
2. **Save error rate**: % of save attempts that fail
3. **User complaints**: Number of "lost data" support tickets
4. **Form completion time**: Time to successfully save a tile

### Target Improvements

- Invalid data in database: Current issues → 0
- Save error rate: -80%
- User complaints about lost data: -90%
- Form completion time: -30% (fewer retry attempts)

---

## References

- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Form Validation Best Practices](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)
- [Improvement Questions - Q5](../discussions/improvement-questions.md#q5-validation-before-save)
