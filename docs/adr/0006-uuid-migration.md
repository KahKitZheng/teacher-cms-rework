# ADR 0006: UUID Migration Plan

**Status:** Proposed

**Date:** 2025-01

**Deciders:** Development Team

**Related:**
- [Improvement Questions - Q4](../discussions/improvement-questions.md#q4-uuids-vs-number-ids)
- [Data Structure Architecture](0001-data-structure-architecture.md)

---

## Context

The current system uses **number IDs** (`id: number`) for all entities:

```typescript
type Tile = {
  id: number;
  name: string;
  blocks: TileInfoBlock[];
  rows: TileInfoAccordion[];
};

type TileInfoBlock = {
  id: number;
  parentId: number;
  // ...
};
```

### Current Problems

1. **ID Collisions During Optimistic Updates**
   - Client generates temporary IDs (e.g., `-1`, `-2`) for new items
   - Server assigns real IDs on save
   - Need to update all references after server response
   - Race conditions if multiple items created quickly

2. **Merge Conflicts**
   - Two users create items simultaneously
   - Both get ID `5` from server
   - Need conflict resolution logic

3. **Import/Export Complexity**
   - Exporting a tile with ID `42` into another course
   - Need to reassign all IDs to avoid collisions
   - Must update all parent-child references

4. **Testing Difficulties**
   - Test data must have unique IDs
   - Hard to create isolated test fixtures
   - Mock IDs overlap with real data

### Why UUIDs?

UUIDs solve these problems:

```typescript
type Tile = {
  id: string; // "550e8400-e29b-41d4-a716-446655440000"
  name: string;
  blocks: TileInfoBlock[];
  rows: TileInfoAccordion[];
};
```

**Benefits:**
- ✅ **Globally unique**: No collisions, ever
- ✅ **Client-generated**: Create IDs upfront, no temporary IDs
- ✅ **Optimistic updates**: No need to remap IDs after save
- ✅ **Import/export**: Copy items directly, no ID reassignment
- ✅ **Testing**: Generate test data without collision concerns

---

## Decision

We will **migrate from number IDs to UUIDs** for all entities.

### UUID Format

Use **UUID v4** (random) for simplicity:

```typescript
import { v4 as uuidv4 } from 'uuid';

const newTile: Tile = {
  id: uuidv4(), // "550e8400-e29b-41d4-a716-446655440000"
  name: 'New Tile',
  blocks: [],
  rows: [],
};
```

**Why v4 (random) instead of v7 (timestamp-ordered)?**
- v4: Simple, widely supported, no timestamp concerns
- v7: Sortable by creation time, but adds complexity
- **Decision**: Start with v4, migrate to v7 later if performance requires it

---

## Reference System Analysis

With UUIDs, we need to decide how parent-child relationships work.

### Option 1: Parent-Child References (Current + UUID)

**Structure:**
```typescript
type TileInfoBlock = {
  id: string; // UUID
  parentId: string; // UUID of parent (Tile, Row, or Column)
  parentType: 'tile' | 'row' | 'column';
  order: number;
  // ...
};
```

**Benefits:**
- ✅ **Simple lookups**: Find all children with `filter(b => b.parentId === parent.id)`
- ✅ **Flexible nesting**: Easy to move items between parents
- ✅ **Type safety**: TypeScript knows the parent type
- ✅ **Migration friendly**: Minimal changes from current system

**Downsides:**
- ⚠️ **No path context**: Can't determine full path without traversal
- ⚠️ **Deletion complexity**: Must cascade delete children
- ⚠️ **Circular references**: Possible (though preventable with validation)

**Example Usage:**
```typescript
// Find all blocks in a tile
const tileBlocks = allBlocks.filter(b =>
  b.parentId === tile.id && b.parentType === 'tile'
);

// Move block to different parent
block.parentId = newParent.id;
block.parentType = 'row';
```

---

### Option 2: Full Path Storage

**Structure:**
```typescript
type TileInfoBlock = {
  id: string; // UUID
  path: string[]; // ["tile-uuid", "row-uuid", "column-uuid"]
  // ...
};
```

**Benefits:**
- ✅ **Fast path lookups**: Know exact location immediately
- ✅ **Breadcrumb generation**: Easy to render navigation
- ✅ **Depth calculation**: `path.length` gives nesting level
- ✅ **Subtree queries**: Find all items under path with `startsWith`

**Downsides:**
- ⚠️ **Update complexity**: Moving an item requires updating all children's paths
  ```typescript
  // Moving accordion with 50 children
  // Must update paths for all 50 children!
  const newPath = [...newParentPath, accordion.id];
  accordion.blocks.forEach(block => {
    block.path = [...newPath, block.id];
  });
  ```
- ⚠️ **Storage overhead**: Paths can be large for deep nesting
  ```typescript
  // Deep nesting = long path
  path: [
    "tile-uuid",
    "row-uuid",
    "column-uuid",
    "accordion-uuid",
    "nested-row-uuid",
    "nested-column-uuid"
  ]
  ```
- ⚠️ **Duplication**: Each child stores full ancestor path
- ⚠️ **Consistency**: Paths can become stale if not updated correctly

**Example Usage:**
```typescript
// Get all blocks under a specific row
const rowBlocks = allBlocks.filter(b =>
  b.path.includes(row.id)
);

// Render breadcrumbs
const breadcrumbs = block.path.map(id => ({
  id,
  label: getEntityName(id)
}));

// Move block (must update children!)
block.path = [...newParentPath, block.id];
```

---

### Option 3: Hybrid Approach (Reference + Cached Path)

**Structure:**
```typescript
type TileInfoBlock = {
  id: string;
  parentId: string; // Source of truth
  parentType: 'tile' | 'row' | 'column';

  // Cached for performance
  _computedPath?: string[]; // Recomputed on load/move
};
```

**Benefits:**
- ✅ **Best of both**: Simple references + fast path lookups
- ✅ **Easy updates**: Only update `parentId`, recompute path
- ✅ **No duplication**: Path is computed, not stored
- ✅ **Validation**: Can detect stale paths and recompute

**Downsides:**
- ⚠️ **Recomputation cost**: Need to rebuild paths on load
- ⚠️ **Cache invalidation**: Must invalidate when structure changes
- ⚠️ **Complexity**: Two systems to maintain

**Example Usage:**
```typescript
// Compute path on load
function computePath(block: TileInfoBlock): string[] {
  const path = [block.id];
  let current = block;

  while (current.parentId) {
    const parent = findById(current.parentId);
    path.unshift(parent.id);
    current = parent;
  }

  return path;
}

// Move block
block.parentId = newParent.id;
block._computedPath = computePath(block); // Recompute
```

---

### Recommendation: **Option 1 (Parent-Child References)**

**Why:**

1. **Simplest migration**: Minimal changes to existing code
   - Just change `id: number` → `id: string`
   - Keep `parentId` and `parentType` as-is

2. **Most flexible**: Easy to move items around
   - Moving an accordion = update 1 field
   - No need to update 50 children

3. **Best for our use case**:
   - Drag-and-drop operations are frequent (moving items)
   - Path lookups are infrequent (breadcrumbs, rare)
   - Deep nesting is limited (Tile → Row → Column → Accordion, max ~4 levels)

4. **Path computation is cheap**:
   ```typescript
   // Only compute when needed
   function getPath(blockId: string): string[] {
     const path: string[] = [];
     let current = findById(blockId);

     while (current) {
       path.unshift(current.id);
       current = findById(current.parentId);
     }

     return path;
   }
   ```
   - O(depth) complexity, depth is small (~4 levels)
   - Can memoize results for performance

5. **Future-proof**: Can add cached paths later if needed (Option 3)

---

## Implementation Plan

### Phase 1: Add UUID Support (Non-Breaking)

#### 1.1 Install Dependencies
```bash
npm install uuid
npm install --save-dev @types/uuid
```

#### 1.2 Create ID Generation Utility
```typescript
// src/utils/idGenerator.ts

import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function isValidId(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
```

#### 1.3 Update Type Definitions
```typescript
// src/types/tileInfo.ts

// Before
export type Tile = {
  id: number;
  // ...
};

// After (support both during migration)
export type Tile = {
  id: string | number; // Allow both temporarily
  // ...
};

export type TileInfoBlock = {
  id: string | number;
  parentId: string | number;
  // ...
};
```

---

### Phase 2: Migration Script

#### 2.1 Database Migration
```typescript
// migrations/001_add_uuid_columns.ts

export async function up(db: Database) {
  // Add UUID columns alongside number IDs
  await db.schema.alterTable('tiles', (table) => {
    table.uuid('uuid').nullable();
  });

  await db.schema.alterTable('tile_info_blocks', (table) => {
    table.uuid('uuid').nullable();
    table.uuid('parent_uuid').nullable();
  });

  // Generate UUIDs for existing records
  await db.raw(`
    UPDATE tiles SET uuid = uuid_generate_v4();
    UPDATE tile_info_blocks SET uuid = uuid_generate_v4();
  `);

  // Update parent references
  await db.raw(`
    UPDATE tile_info_blocks tib
    SET parent_uuid = (
      SELECT uuid FROM tiles t WHERE t.id = tib.parent_id
    )
    WHERE tib.parent_type = 'tile';
  `);
}
```

#### 2.2 API Migration
```typescript
// Support both ID formats during transition
export async function getTile(id: string | number): Promise<Tile> {
  if (typeof id === 'number') {
    // Legacy: lookup by number ID
    return db('tiles').where({ id }).first();
  } else {
    // New: lookup by UUID
    return db('tiles').where({ uuid: id }).first();
  }
}
```

---

### Phase 3: Frontend Migration

#### 3.1 Update Create Functions
```typescript
// Before
export function createNewBlock(parentId: number): TileInfoBlock {
  return {
    id: -1, // Temporary ID
    parentId,
    // ...
  };
}

// After
export function createNewBlock(parentId: string): TileInfoBlock {
  return {
    id: generateId(), // Real UUID immediately
    parentId,
    // ...
  };
}
```

#### 3.2 Remove ID Remapping Logic
```typescript
// Before: After save, remap temporary IDs
function handleSaveSuccess(response: SaveResponse) {
  const idMap = response.idMapping; // { -1: 42, -2: 43 }

  // Update all references
  blocks.forEach(block => {
    if (block.id < 0) {
      block.id = idMap[block.id];
    }
    if (block.parentId < 0) {
      block.parentId = idMap[block.parentId];
    }
  });
}

// After: No remapping needed!
function handleSaveSuccess(response: SaveResponse) {
  // UUIDs are stable, nothing to update
}
```

---

### Phase 4: Cleanup

#### 4.1 Remove Number ID Support
```typescript
// src/types/tileInfo.ts

export type Tile = {
  id: string; // Only UUID now
  // ...
};
```

#### 4.2 Drop Old ID Columns
```typescript
// migrations/002_remove_number_ids.ts

export async function up(db: Database) {
  await db.schema.alterTable('tiles', (table) => {
    table.dropColumn('id');
    table.renameColumn('uuid', 'id');
  });

  await db.schema.alterTable('tile_info_blocks', (table) => {
    table.dropColumn('id');
    table.dropColumn('parent_id');
    table.renameColumn('uuid', 'id');
    table.renameColumn('parent_uuid', 'parent_id');
  });
}
```

---

## Migration Timeline

### Week 1: Preparation
- ✅ Install UUID library
- ✅ Create ID generation utility
- ✅ Update TypeScript types to support both formats
- ✅ Write migration script
- ✅ Test migration on development database

### Week 2: Backend Migration
- ✅ Add UUID columns to database
- ✅ Generate UUIDs for existing data
- ✅ Update API to accept both formats
- ✅ Deploy backend changes
- ✅ Monitor for errors

### Week 3: Frontend Migration
- ✅ Update create functions to use UUIDs
- ✅ Remove ID remapping logic
- ✅ Test all CRUD operations
- ✅ Deploy frontend changes
- ✅ Monitor for errors

### Week 4: Cleanup
- ✅ Verify all systems using UUIDs
- ✅ Remove number ID support from types
- ✅ Drop old database columns
- ✅ Update documentation

**Total Duration:** ~4 weeks (can be compressed to 2 weeks if needed)

---

## Rollback Plan

If migration fails:

1. **Backend rollback**: Keep both `id` and `uuid` columns
   - Switch API back to using `id` column
   - UUIDs remain but unused

2. **Frontend rollback**: Revert to temporary IDs
   - Re-enable ID remapping logic
   - Continue using number IDs

3. **Database rollback**: Drop UUID columns
   - Run down migration
   - Remove UUID columns entirely

**Risk:** Low - migration is additive, not destructive

---

## Path Computation Utility

Even with parent-child references, we need path computation for breadcrumbs and debugging.

```typescript
// src/utils/pathUtils.ts

type Entity = {
  id: string;
  parentId?: string;
  parentType?: 'tile' | 'row' | 'column' | 'accordion';
};

export function computePath(
  entityId: string,
  allEntities: Entity[]
): string[] {
  const entityMap = new Map(allEntities.map(e => [e.id, e]));
  const path: string[] = [];

  let current = entityMap.get(entityId);

  while (current) {
    path.unshift(current.id);
    current = current.parentId ? entityMap.get(current.parentId) : undefined;
  }

  return path;
}

export function getAncestors(
  entityId: string,
  allEntities: Entity[]
): Entity[] {
  const path = computePath(entityId, allEntities);
  return path.slice(0, -1).map(id =>
    allEntities.find(e => e.id === id)!
  );
}

export function getDepth(
  entityId: string,
  allEntities: Entity[]
): number {
  return computePath(entityId, allEntities).length;
}

// Memoized version for performance
export const computePathMemo = memoize(computePath, {
  // Cache key: entityId + hash of all entities
  resolver: (entityId, allEntities) =>
    `${entityId}-${hashEntities(allEntities)}`,
});
```

---

## Consequences

### Positive

- ✅ **No ID collisions**: Ever
- ✅ **Optimistic updates**: Create items with real IDs immediately
- ✅ **Import/export**: Copy items directly without ID reassignment
- ✅ **Testing**: Generate test data without collision concerns
- ✅ **Distributed systems**: Multiple servers can generate IDs independently
- ✅ **Offline mode**: Client can create items while offline

### Negative

- ⚠️ **Storage size**: UUIDs are 36 characters vs ~5 for numbers
  - `"550e8400-e29b-41d4-a716-446655440000"` (36 bytes)
  - `12345` (5 bytes)
  - **Impact**: Minimal for our data volumes (~1000 items max)

- ⚠️ **URL length**: UUIDs make URLs longer
  - Before: `/course/42/edit`
  - After: `/course/550e8400-e29b-41d4-a716-446655440000/edit`
  - **Mitigation**: Use short slugs for public URLs

- ⚠️ **Debugging**: Harder to reference items in logs
  - Before: "Block 42 failed"
  - After: "Block 550e8400-e29b-41d4-a716-446655440000 failed"
  - **Mitigation**: Add human-readable names to logs

- ⚠️ **Migration effort**: ~2-4 weeks of work
  - Database migration
  - API updates
  - Frontend updates
  - Testing

### Trade-offs

- **Simplicity vs Robustness**: UUIDs are more complex but eliminate entire classes of bugs
- **Storage vs Reliability**: Slightly larger data size for guaranteed uniqueness
- **Migration Cost vs Long-term Benefit**: Upfront work pays off with simpler code

---

## Alternatives Considered

### Alternative 1: Stick with Number IDs + Better ID Generation

**Approach:**
- Keep number IDs
- Implement server-side ID reservation
- Client reserves ID ranges before creating items

**Rejected:**
- ❌ Still have collision risks
- ❌ Requires roundtrip to server for ID reservation
- ❌ Complex coordination logic
- ❌ Doesn't solve import/export issues

---

### Alternative 2: Composite Keys (Type + Number)

**Approach:**
```typescript
type Block = {
  id: { type: 'block', num: number };
};
```

**Rejected:**
- ❌ Awkward API
- ❌ Still have collision issues within type
- ❌ Doesn't work with standard libraries
- ❌ Complex comparison logic

---

### Alternative 3: ULIDs (Sortable UUIDs)

**Approach:**
- Use ULID instead of UUID
- Sortable by timestamp
- Shorter encoding (26 chars vs 36)

**Deferred:**
- ✅ Could be better long-term
- ⚠️ Less standard than UUID
- ⚠️ Added complexity
- **Decision**: Start with UUID, consider ULID later if needed

---

## Success Metrics

### Measure Before/After

1. **ID collision errors**: Count should go to zero
2. **Import/export success rate**: Should increase to 100%
3. **Optimistic update complexity**: Lines of code should decrease
4. **Test flakiness**: Should decrease (no ID conflicts in tests)

### Target Improvements

- ID collision errors: Current bugs → 0
- Import/export rewrites: 100% of IDs → 0% of IDs
- Optimistic update code: -200 lines (remove remapping)
- Test isolation: 100% (no shared ID state)

---

## Open Questions

1. **UUID version**: Should we use v7 (timestamp-ordered) instead of v4?
   - **Current**: v4 (random)
   - **Consider**: v7 if we need sortability

2. **Display format**: Show full UUID or abbreviate?
   - Full: `550e8400-e29b-41d4-a716-446655440000`
   - Short: `550e8400...`
   - **Recommendation**: Show full in developer tools, short in UI

3. **Indexing**: How to efficiently index UUIDs in database?
   - **Solution**: Use PostgreSQL native UUID type for optimal storage/indexing

---

## References

- [UUID Specification (RFC 4122)](https://tools.ietf.org/html/rfc4122)
- [UUID v7 Draft](https://datatracker.ietf.org/doc/draft-peabody-dispatch-new-uuid-format/)
- [PostgreSQL UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [Improvement Questions - Q4](../discussions/improvement-questions.md#q4-uuids-vs-number-ids)
