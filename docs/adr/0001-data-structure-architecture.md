# ADR 0001: Data Structure Architecture for Teaching Course Builder

**Status:** Accepted

**Date:** 2025-01

**Deciders:** Development Team

**Related:** See detailed analysis in [docs/guides/data-structure-proposal.md](../guides/data-structure-proposal.md)

---

## Context

The Teaching Course builder has a complex hierarchical data structure with three levels:
- **Tile level**: Top-level container for course content
- **Row level**: Accordion-style collapsible sections
- **Column level**: Multi-column layouts within rows

The current implementation has several issues:
1. Mixed type arrays requiring constant type guards
2. Inconsistent property naming (`data`, `items`, `blocks`)
3. No explicit type discriminators
4. Deep nesting making updates difficult
5. Complex TypeScript type checking

The drag-and-drop functionality is already level-aware, with separate collision detection and hover handling for each level. Sorting is restricted within levels (e.g., tile-level blocks can't sort with row-level blocks).

---

## Decision

We will migrate to **Option 2: Fully Separated Arrays** architecture.

### New Structure

```typescript
type Tile = {
  id: number;
  name: string;
  blocks: TileBlock[];  // Separated
  rows: Row[];          // Separated
};

type Row = {
  type: "row";
  id: number;
  name: string;
  blocks: RowBlock[];      // Separated
  layouts: ColumnLayout[]; // Separated
};
```

### Key Principles

1. **Separate arrays by type** - No more mixed `(Block | Row)[]` arrays
2. **Explicit type discriminators** - All items have `type` field
3. **Consistent naming** - Use `children` or specific names like `blocks`, `rows`
4. **Parent references** - Each item tracks its `parentId`
5. **Order field** - Explicit ordering via `order` property

---

## Rationale

### Why Separated Arrays?

1. **Aligns with drag/drop logic**: Our drag-and-drop system already treats blocks and rows as separate concerns with different collision detection rules

2. **Type safety**: Homogeneous arrays eliminate the need for type guards
   ```typescript
   // Before
   tile.data.filter(item => isTileInfoRow(item))

   // After
   tile.rows // TypeScript knows these are all rows
   ```

3. **Clear intent**: Code becomes self-documenting
   ```typescript
   // Before - unclear what's in 'data'
   tile.data.map(...)

   // After - explicit
   tile.blocks.map(...)
   tile.rows.map(...)
   ```

4. **Easier CRUD operations**: Add/remove from specific arrays without filtering
   ```typescript
   // Add a block
   tile.blocks.push(newBlock) // Clear and simple
   ```

### Why Not Normalized (Option 3)?

- Overhead not justified for current scale (typically < 50 items per tile)
- Additional complexity of denormalization selectors
- Current nested structure is intuitive for the domain

### Why Not Minimal Changes (Option 4)?

- Doesn't solve the core mixed-array problem
- Would still require type guards everywhere
- Misses opportunity for clearer architecture

---

## Consequences

### Positive

- ✅ **Better TypeScript experience**: IntelliSense knows exact types
- ✅ **No type guards needed**: Arrays are homogeneous
- ✅ **Clearer code**: Intent is explicit
- ✅ **Easier testing**: Can test blocks and rows independently
- ✅ **Better performance**: No runtime type checking needed
- ✅ **Future-proof**: Easy to add new element types

### Negative

- ⚠️ **Rendering complexity**: Need to merge and sort arrays for display
  ```typescript
  const sorted = [
    ...tile.blocks.map(b => ({ ...b, category: 'block' })),
    ...tile.rows.map(r => ({ ...r, category: 'row' }))
  ].sort((a, b) => a.order - b.order);
  ```
- ⚠️ **More state**: Multiple arrays to manage instead of one
- ⚠️ **Migration effort**: ~1 day of work to refactor

### Neutral

- Neither better nor worse for serialization
- Similar memory footprint

---

## Implementation Plan

### Phase 1: Update Type Definitions (1-2 hours)
- Update `src/types/template.d.ts`
- Add new types with separated arrays
- Keep old types temporarily for gradual migration

### Phase 2: Update Mock Data (30 min)
- Convert existing mock data to new structure
- Verify all test data is migrated

### Phase 3: Update Helper Functions (1 hour)
- Update `dragDropHelpers.ts`
- Update utility functions to work with separated arrays

### Phase 4: Update Components (2-3 hours)
- Update `TileInfoRow.tsx`, `TileInfoBlock.tsx`, etc.
- Update rendering logic to iterate over separated arrays

### Phase 5: Update Drag Handlers (2-3 hours)
- Update drag-and-drop logic
- Update collision detection to use new structure

### Phase 6: Cleanup (30 min)
- Remove old type definitions
- Remove old helper functions
- Update documentation

**Estimated Total Effort:** ~1 day

---

## Alternatives Considered

### Option 1: Discriminated Union with Mixed Arrays
- Still uses mixed arrays like `(Block | Row)[]`
- Adds type discriminators but keeps complexity
- **Rejected**: Doesn't solve core problem

### Option 3: Normalized/Flat Structure
- Flattens all entities into lookup maps
- Uses IDs for relationships
- **Rejected**: Over-engineering for current scale

### Option 4: Minimal Changes
- Add type discriminators to current structure
- Keep mixed arrays and property inconsistencies
- **Rejected**: Misses opportunity for improvement

---

## References

- [Full analysis and comparison](../guides/data-structure-proposal.md)
- [Migration status tracking](../guides/data-structure-migration-status.md)
- Original discussion: PROPOSED_DATA_STRUCTURE.md
