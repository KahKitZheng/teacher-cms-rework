# Data Structure Migration Status

## Migration to Fully Recursive Children Structure

This document tracks the progress of migrating from the old data structure (mixed `data` arrays) to a **fully recursive children structure**.

**Note**: The implementation evolved beyond the original ADR 0001 plan. Instead of just separated arrays, the codebase now uses a unified recursive `children` array that supports unlimited nesting levels.

---

## ✅ MIGRATION COMPLETE

### Phase 1: Type Definitions ✅
**File**: [src/types/template.d.ts](../../src/types/template.d.ts)

- ✅ Updated `Tile` to use `children: TileInfoBlock[]` (unified recursive array)
- ✅ Renamed `TileInfoAccordion` to `TileInfoBlockAccordion` (accordions are now blocks)
- ✅ Added `TileInfoBlockAccordion` with recursive `children: TileInfoBlock[]`
- ✅ Added `TileInfoColumnLayout` as a block type with `children: TileInfoBlockColumn[]`
- ✅ Added `TileInfoBlockColumn` with recursive `children: TileInfoBlock[]`
- ✅ Added numeric `level` field (0 = tile, 1+ = nested levels)
- ✅ Added discriminator fields: `type`, `order`, `parentId`
- ✅ Removed deprecated `TileInfoAccordion` and `TileInfoColumn` type aliases

### Phase 2: Mock Data ✅
**File**: [src/pages/TeachingCourse/mock-data/tileInfo.ts](../../src/pages/TeachingCourse/mock-data/tileInfo.ts)

- ✅ Updated to use recursive `children` structure
- ✅ All blocks have `type`, `level`, `order`, `parentId` fields
- ✅ Accordions can nest infinitely within their children arrays
- ✅ Column layouts properly structure columns with recursive children

### Phase 3: Helper Functions ✅
**File**: [src/pages/TeachingCourse/utils/dragDropHelpers.ts](../../src/pages/TeachingCourse/utils/dragDropHelpers.ts)

- ✅ Updated to work with unified `children: TileInfoBlock[]` arrays
- ✅ All type guards use `type` discriminator
- ✅ Updated `getAllRowIds()` to recursively find all accordions
- ✅ Updated `findBlockById()` to recursively search through children
- ✅ Updated `getAllBlocks()` to recursively collect all blocks
- ✅ Updated `getAllRows()` to return `TileInfoBlockAccordion[]`
- ✅ Updated `getAllColumnLayoutIds()` and `getAllColumnLayouts()`
- ✅ Updated `cloneTiles()` to recursively clone children
- ✅ Updated `moveBlockToColumn()` and `moveBlockToRow()` for recursive structure
- ✅ Removed all `(TileInfoBlock | TileInfoAccordion | TileInfoColumnLayout)[]` type unions
- ✅ Changed to use `TileInfoBlock[]` everywhere (since all are blocks in the union)

### Phase 4: Component Updates ✅
**File**: [src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx](../../src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx)

- ✅ Updated all rendering to use `tile.children` and `accordion.children`
- ✅ Updated type guards to use discriminators
- ✅ Updated SortableContext to work with unified children arrays
- ✅ Updated delete handlers to work recursively through children
- ✅ Updated add handlers to add to children arrays
- ✅ Removed all `(TileInfoBlock | TileInfoAccordion | TileInfoColumnLayout)[]` type unions
- ✅ Changed all `TileInfoAccordion` type references to `TileInfoBlockAccordion`

**File**: [src/pages/TeachingCourse/components/TileInfoAccordion/TileInfoAccordion.tsx](../../src/pages/TeachingCourse/components/TileInfoAccordion/TileInfoAccordion.tsx)

- ✅ Updated prop type from `TileInfoAccordion` to `TileInfoBlockAccordion`

**File**: [src/pages/TeachingCourse/components/RecursiveRowRenderer/RecursiveRowRenderer.tsx](../../src/pages/TeachingCourse/components/RecursiveRowRenderer/RecursiveRowRenderer.tsx)

- ✅ Component properly renders recursive accordions

**File**: [src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoOverlay/TileInfoOverlay.tsx](../../src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoOverlay/TileInfoOverlay.tsx)

- ✅ Updated prop type from `TileInfoAccordion` to `TileInfoBlockAccordion`
- ✅ Renders recursive accordion structure in overlay

### Phase 5: Drag Handlers ✅
**File**: [src/pages/TeachingCourse/utils/dragHandlers.ts](../../src/pages/TeachingCourse/utils/dragHandlers.ts)

- ✅ Updated to work with unified children arrays
- ✅ Updated `handleRowDragEnd()` to reorder within children array
- ✅ Updated `handleBlockDragEnd()` to work with recursive structure
- ✅ Updated `handleLayoutDragEnd()` to work with recursive structure
- ✅ Removed all `(TileInfoBlock | TileInfoAccordion | TileInfoColumnLayout)[]` type unions
- ✅ Changed all `TileInfoAccordion` type references to `TileInfoBlockAccordion`
- ✅ Removed unused `isContainer` import

### Phase 6: Build Verification ✅
- ✅ TypeScript compilation successful
- ✅ No type errors (only unused variable warnings)
- ✅ All type annotations consistent
- ✅ Deprecated type aliases removed

---

## Key Structural Changes

### Old Structure (Mixed Arrays):
```typescript
Tile {
  data: (TileInfoAccordion | TileInfoBlock)[]  // Mixed array
}

TileInfoAccordion {
  items: (TileInfoBlock | TileInfoColumnLayout)[]  // Mixed array
}

TileInfoColumnLayout {
  columns: TileInfoColumn[]
}
```

### New Structure (Fully Recursive Children):
```typescript
Tile {
  children: TileInfoBlock[]  // Unified recursive array
}

// TileInfoAccordion renamed to TileInfoBlockAccordion
TileInfoBlockAccordion {
  type: "accordion"
  level: number  // 0 = tile level, 1+ = nested
  children: TileInfoBlock[]  // Recursive! Can contain more accordions
}

TileInfoColumnLayout {
  type: "columnLayout"
  level: number
  children: TileInfoBlockColumn[]  // Columns are also blocks
}

TileInfoBlockColumn {
  type: "column"
  level: number
  children: TileInfoBlock[]  // Recursive! Can contain any blocks
}

// All other blocks
TileInfoBlockText | TileInfoBlockHeading | ... {
  type: "text" | "heading" | ...
  level: number
  order: number
  parentId?: number
}
```

### Union Type:
```typescript
type TileInfoBlock =
  | TileInfoBlockAccordion  // Container
  | TileInfoColumnLayout    // Container
  | TileInfoBlockColumn     // Column
  | TileInfoBlockHeading    // Content
  | TileInfoBlockText       // Content
  | TileInfoBlockParagraph  // Content
  | TileInfoBlockDropdown;  // Content
```

### Rendering Pattern:
```typescript
// Sort and render children
tile.children
  .sort((a, b) => a.order - b.order)
  .map((child) => {
    if (child.type === 'accordion') {
      return <RecursiveAccordionRenderer accordion={child} />
    } else {
      return <TileInfoBlock block={child} />
    }
  })
```

---

## Evolution from ADR 0001

The implementation **evolved beyond** the original ADR 0001 plan:

**ADR 0001 Plan (Separated Arrays)**:
- `tile.blocks` and `tile.rows` as separate arrays
- `row.blocks` and `row.layouts` as separate arrays
- Limited to 2 levels (tile and row)

**Actual Implementation (Fully Recursive)**:
- Unified `children: TileInfoBlock[]` arrays everywhere
- Supports **unlimited nesting** of accordions
- Accordions are now blocks themselves (`TileInfoBlockAccordion`)
- More flexible and extensible architecture

### Why the Evolution?
- **Better recursion support**: Accordions can nest infinitely
- **Simpler type system**: One union type (`TileInfoBlock`) instead of multiple
- **Cleaner code**: No need to manage multiple arrays
- **More flexible**: Easy to add new block types
- **Better component reuse**: Recursive components work naturally

---

## Benefits Achieved

1. ✅ **True recursion**: Accordions can nest indefinitely
2. ✅ **Type-safe**: All blocks use discriminated unions with `type` field
3. ✅ **Numeric levels**: Dynamic level tracking (0, 1, 2, ...)
4. ✅ **Unified arrays**: Single `children` array instead of multiple arrays
5. ✅ **Self-documenting**: Type field makes intent explicit
6. ✅ **Better TypeScript**: No type guards needed in most cases
7. ✅ **Cleaner CRUD**: Add/edit/delete operations are consistent
8. ✅ **Component reuse**: Recursive components work naturally

---

## Migration Complete ✅

**Status**: All phases completed successfully

- ✅ Type definitions updated and cleaned
- ✅ Mock data converted
- ✅ Helper functions rewritten
- ✅ Components updated
- ✅ Drag handlers updated
- ✅ Type consistency enforced
- ✅ Deprecated aliases removed
- ✅ Build verification passed

**No breaking changes remaining**: The codebase is fully migrated to the recursive children structure.

---

## Column ID Format

Columns use the format: `column-{rowId}-{layoutId}-{columnOrder}`

Example: `column-123-456-0` (first column in layout 456 of accordion 123)

---

## Notes

- `TileInfoAccordion` has been renamed to `TileInfoBlockAccordion`
- `TileInfoColumn` type has been completely removed
- All code uses `TileInfoBlock[]` for children arrays
- Level is now numeric (0, 1, 2, ...) instead of string-based
- The structure supports unlimited nesting depth
- This architecture is more powerful than the original ADR 0001 plan

---

## Related Documentation

- [ADR 0001: Data Structure Architecture](../adr/0001-data-structure-architecture.md)
- [Original Data Structure Proposal](./data-structure-proposal.md)
- [Drag Drop Implementation Guide](./drag-drop-implementation.md)
