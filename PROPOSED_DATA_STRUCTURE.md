# Proposed Data Structure Improvements

## Current Issues Summary

1. ❌ Mixed type arrays require constant type guards
2. ❌ Inconsistent property naming (`data`, `items`, `blocks`)
3. ❌ No explicit type discriminators
4. ❌ Implicit hierarchy levels
5. ❌ Deep nesting makes updates difficult
6. ❌ No parent references for efficient lookups

---

## Option 1: Discriminated Union with Separated Arrays (RECOMMENDED)

### Key Changes:
- Add explicit `type` field to ALL items
- Separate blocks and rows into different arrays at tile level
- Consistent naming with `children`
- Explicit `level` field on all content

### New Structure

```typescript
// Base types with discriminators
type ContentItem = TileBlock | Row | RowBlock | ColumnLayout | ColumnBlock;

type TileBlock = {
  type: "block";
  level: "tile";
  id: number;
  blockType: "text" | "dropdown";
  name: string;
  data: string | TileInfoSelectOption[];
  order: number;
};

type Row = {
  type: "row";
  level: "tile";
  id: number;
  name: string;
  icon?: string;
  order: number;
  children: (RowBlock | ColumnLayout)[]; // Still mixed, but explicit
};

type RowBlock = {
  type: "block";
  level: "row";
  id: number;
  blockType: "text" | "dropdown";
  name: string;
  data: string | TileInfoSelectOption[];
  order: number;
  parentId: number; // References row.id
};

type ColumnLayout = {
  type: "columnLayout";
  level: "row";
  id: number;
  order: number;
  parentId: number; // References row.id
  leftColumn: ColumnBlock[];
  rightColumn: ColumnBlock[];
};

type ColumnBlock = {
  type: "block";
  level: "column";
  id: number;
  blockType: "text" | "dropdown";
  name: string;
  data: string | TileInfoSelectOption[];
  order: number;
  parentId: number; // References columnLayout.id
  columnSide: "left" | "right";
};

type Tile = {
  id: number;
  name: string;
  children: (TileBlock | Row)[]; // Still mixed, but now type-safe
};
```

### Benefits:
✅ **Type-safe discrimination**: `item.type === "block"` works everywhere
✅ **Explicit levels**: Each item knows its level
✅ **Parent references**: Easy to find parent without traversal
✅ **Better TypeScript**: No need for type guards
✅ **Self-documenting**: Structure is clearer

### Migration Impact:
- 🔄 Medium effort - Need to update type definitions
- 🔄 Update all components to check `item.type` instead of using type guards
- 🔄 Update mock data to include type/level fields
- ✅ No change to rendering logic flow

---

## Option 2: Fully Separated Arrays (BEST for Complex Operations)

### Key Changes:
- **Completely separate** blocks and rows/layouts at each level
- No more mixed arrays
- Explicit ordering

### New Structure

```typescript
type TileBlock = {
  type: "block";
  level: "tile";
  id: number;
  blockType: "text" | "dropdown";
  name: string;
  data: string | TileInfoSelectOption[];
  order: number;
};

type Row = {
  type: "row";
  level: "tile";
  id: number;
  name: string;
  icon?: string;
  order: number;
  // Separated arrays:
  blocks: RowBlock[];
  layouts: ColumnLayout[];
};

type RowBlock = {
  type: "block";
  level: "row";
  id: number;
  blockType: "text" | "dropdown";
  name: string;
  data: string | TileInfoSelectOption[];
  order: number;
  parentId: number;
};

type ColumnLayout = {
  type: "columnLayout";
  level: "row";
  id: number;
  order: number;
  parentId: number;
  leftColumn: ColumnBlock[];
  rightColumn: ColumnBlock[];
};

type ColumnBlock = {
  type: "block";
  level: "column";
  id: number;
  blockType: "text" | "dropdown";
  name: string;
  data: string | TileInfoSelectOption[];
  order: number;
  parentId: number;
  columnSide: "left" | "right";
};

type Tile = {
  id: number;
  name: string;
  // Separated arrays:
  blocks: TileBlock[];
  rows: Row[];
};
```

### Rendering Logic

```typescript
// Old way (mixed):
{tileInfo[0].data.map(item =>
  isTileInfoRow(item) ? <Row .../> : <Block .../>
)}

// New way (separated):
{[
  ...tileInfo[0].blocks.map(block => <Block key={block.id} {...block} />),
  ...tileInfo[0].rows.map(row => <Row key={row.id} {...row} />)
].sort((a, b) => a.order - b.order)}
```

### Benefits:
✅ **No type guards needed**: Arrays are homogeneous
✅ **Clearer intent**: `tile.blocks` vs `tile.rows`
✅ **Easier filtering**: `tile.blocks.filter(...)` instead of `tile.data.filter(isTileInfoRow)`
✅ **Better for CRUD**: Add/remove from specific arrays
✅ **Type safety**: TypeScript knows exact type in each array

### Trade-offs:
⚠️ **Ordering complexity**: Need to merge and sort for rendering
⚠️ **More arrays**: More state to manage
✅ **Clearer data model**: Worth the complexity

### Migration Impact:
- 🔧 High effort - Major refactor of data structure
- 🔧 Update all drag handlers to work with separated arrays
- 🔧 Update all components
- 🔧 Update mock data significantly
- ✅ Cleaner codebase long-term

---

## Option 3: Normalized/Flat Structure (BEST for Large Scale)

### Key Changes:
- Flatten all entities into lookup maps
- Use IDs to reference relationships
- Like a database structure

### New Structure

```typescript
type NormalizedState = {
  tiles: Record<number, TileEntity>;
  rows: Record<number, RowEntity>;
  blocks: Record<number, BlockEntity>;
  layouts: Record<number, LayoutEntity>;
};

type TileEntity = {
  id: number;
  name: string;
  childIds: number[]; // References blocks and rows by ID
  childTypes: ("block" | "row")[]; // Parallel array for types
};

type RowEntity = {
  type: "row";
  id: number;
  name: string;
  parentId: number; // Tile ID
  childIds: number[]; // References blocks and layouts by ID
  childTypes: ("block" | "layout")[];
  order: number;
};

type BlockEntity = {
  type: "block";
  id: number;
  level: "tile" | "row" | "column";
  blockType: "text" | "dropdown";
  name: string;
  data: string | TileInfoSelectOption[];
  parentId: number; // References parent (tile/row/layout)
  parentType: "tile" | "row" | "layout";
  order: number;
  columnSide?: "left" | "right"; // If in column
};

type LayoutEntity = {
  type: "layout";
  id: number;
  parentId: number; // Row ID
  leftColumnIds: number[]; // Block IDs
  rightColumnIds: number[]; // Block IDs
  order: number;
};
```

### Benefits:
✅ **Fast lookups**: O(1) access to any entity by ID
✅ **Easy updates**: Update one entity without cloning tree
✅ **No deep nesting**: Flat structure
✅ **Easy relationships**: Clear parent/child via IDs
✅ **Scalable**: Works well with 1000s of blocks
✅ **Redux-friendly**: Follows Redux normalized pattern

### Trade-offs:
⚠️ **More complex selectors**: Need to denormalize for rendering
⚠️ **More boilerplate**: Need helper functions to traverse
⚠️ **Harder to visualize**: Structure not immediately obvious

### Migration Impact:
- 🔧🔧 Very high effort - Complete rewrite
- 🔧 Need denormalization selectors
- 🔧 Update ALL components and handlers
- 🔧 Complex migration from current data
- ✅ Best for long-term scalability

---

## Option 4: Minimal Changes (Quick Wins)

If you want to keep the current structure but improve it:

### Changes:

```typescript
// 1. Add type discriminators
type TileInfoRow = {
  type: "row"; // ADD THIS
  id: number;
  name: string;
  items: (TileInfoBlock | TileInfoColumnLayout)[];
  order: number;
};

type TileInfoColumnLayout = {
  type: "columnLayout"; // ADD THIS
  id: number;
  columns: TileInfoColumn[];
  order: number;
};

type TileInfoBlock = {
  type: "block"; // Already exists
  blockType: "text" | "dropdown"; // RENAME from 'type'
  id: number;
  name: string;
  data: string | TileInfoSelectOption[];
  order: number;
};

// 2. Add level field (computed or stored)
type TileInfoBlock = {
  // ... other fields
  level?: "tile" | "row" | "column"; // Optional, can compute
};

// 3. Consistent naming
type Tile = {
  id: number;
  name: string;
  children: (TileInfoRow | TileInfoBlock)[]; // RENAME from 'data'
};

type TileInfoRow = {
  type: "row";
  id: number;
  name: string;
  children: (TileInfoBlock | TileInfoColumnLayout)[]; // RENAME from 'items'
};
```

### Benefits:
✅ **Low effort**: Minimal changes
✅ **Quick wins**: Better type discrimination
✅ **No breaking changes**: Can add fields without refactor

### Type Guards Replacement:

```typescript
// Old:
function isTileInfoRow(item: any): item is TileInfoRow {
  return "items" in item;
}

// New:
function isTileInfoRow(item: TileInfoRow | TileInfoBlock): item is TileInfoRow {
  return item.type === "row";
}

// Even better - no type guard needed:
if (item.type === "row") {
  // TypeScript knows it's a row
}
```

---

## Comparison Matrix

| Feature | Current | Option 1 | Option 2 | Option 3 | Option 4 |
|---------|---------|----------|----------|----------|----------|
| Type Safety | ⚠️ | ✅ | ✅✅ | ✅✅ | ✅ |
| Easy Updates | ❌ | ⚠️ | ✅ | ✅✅ | ❌ |
| Clear Intent | ❌ | ✅ | ✅✅ | ⚠️ | ⚠️ |
| TypeScript DX | ❌ | ✅ | ✅✅ | ✅ | ⚠️ |
| Migration Effort | N/A | Medium | High | Very High | Low |
| Scalability | ⚠️ | ✅ | ✅ | ✅✅ | ⚠️ |
| Performance | ✅ | ✅ | ✅ | ✅✅ | ✅ |
| Complexity | High | Medium | Medium | High | Medium |

---

## 🎯 My Recommendation

**For your use case, I recommend Option 2: Fully Separated Arrays**

### Why?

1. **Your drag/drop logic already separates by level**
   - You have separate collision detection for tile/row/column
   - You filter by level in hover detection
   - Separated arrays match your mental model

2. **Your sorting restrictions align with separated arrays**
   - Tile-level blocks can't sort with row-level blocks
   - Having them in separate arrays makes this explicit

3. **Reasonable migration effort**
   - Not as complex as normalization
   - Clearer than current structure
   - Better TypeScript support

4. **Future-proof**
   - Easy to add new block types
   - Easy to add CRUD operations
   - Clear data ownership

### Implementation Plan

#### Phase 1: Update Types (1-2 hours)
```typescript
// src/types/template.d.ts
type Tile = {
  id: number;
  name: string;
  blocks: TileBlock[];
  rows: Row[];
};

type Row = {
  type: "row";
  id: number;
  name: string;
  blocks: RowBlock[];
  layouts: ColumnLayout[];
};
```

#### Phase 2: Update Mock Data (30 min)
Convert existing mock data to new structure

#### Phase 3: Update Helpers (1 hour)
Update `dragDropHelpers.ts` to work with new structure

#### Phase 4: Update Components (2-3 hours)
Update rendering to iterate over separated arrays

#### Phase 5: Update Drag Handlers (2-3 hours)
Update drag logic to work with separated arrays

**Total: ~1 day of work**

---

## Quick Wins (If Not Ready for Full Refactor)

If you want to improve the current structure without major changes:

### 1. Add Type Discriminators (30 min)
```typescript
type: "row" | "block" | "columnLayout"
```

### 2. Add Level Field (30 min)
```typescript
level: "tile" | "row" | "column"
```

### 3. Rename for Consistency (1 hour)
- `data` → `children`
- `items` → `children`
- `blocks` → `children`

### 4. Add Order Everywhere (30 min)
Ensure all items have explicit `order` field

**Total: ~2-3 hours for significant improvement**

---

## Questions to Consider

1. **Do you need to support more than 2 columns?**
   - If no: Make it explicit with `leftColumn`/`rightColumn`
   - If yes: Keep current `columns` array

2. **Will you have 100+ blocks per tile?**
   - If yes: Consider Option 3 (normalized)
   - If no: Option 2 is fine

3. **Do you need undo/redo?**
   - If yes: Normalized structure helps
   - If no: Nested is fine

4. **Will you add more hierarchy levels?**
   - If yes: Consider more flexible structure
   - If no: Current 3 levels are fine

5. **Do you need to serialize/save to backend?**
   - If yes: Ensure structure is JSON-friendly
   - Consider how backend expects data
