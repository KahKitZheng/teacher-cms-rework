# Data Structure Migration Status

## Migration from Mixed Arrays to Separated Arrays

This document tracks the progress of migrating from the old data structure (mixed `data` arrays) to the new separated arrays structure as recommended in PROPOSED_DATA_STRUCTURE.md (Option 2).

---

## ✅ Completed (Phase 1-3)

### Phase 1: Type Definitions ✅
**File**: `src/types/template.d.ts`

- ✅ Updated `Tile` type to use `blocks: TileInfoBlock[]` and `rows: TileInfoRow[]` instead of `data: (TileInfoRow | TileInfoBlock)[]`
- ✅ Updated `TileInfoRow` to use `blocks: TileInfoBlock[]` and `layouts: TileInfoColumnLayout[]` instead of `items: (TileInfoBlock | TileInfoColumnLayout)[]`
- ✅ Updated `TileInfoColumnLayout` to use `leftColumn: TileInfoBlock[]` and `rightColumn: TileInfoBlock[]` instead of `columns: TileInfoColumn[]`
- ✅ Added discriminator fields: `type` and `level` to all types
- ✅ Added `order`, `parentId`, and `columnSide` fields to all block types
- ✅ Marked `TileInfoColumn` as deprecated

### Phase 2: Mock Data ✅
**File**: `src/pages/TeachingCourse/mock-data/tileInfo.ts`

- ✅ Updated `tilesData` to use separated arrays structure
- ✅ All blocks now have required `type`, `level`, `order` fields
- ✅ Column layouts now have `leftColumn` and `rightColumn` instead of `columns`
- ✅ Updated template constants to include new required fields

### Phase 3: Helper Functions ✅
**File**: `src/pages/TeachingCourse/utils/dragDropHelpers.ts`

- ✅ Updated type guards to use `type` discriminator instead of property checking
- ✅ Updated `BlockLocation` type to reflect new structure
- ✅ Updated `ColumnLocation` type for new structure
- ✅ Updated `getAllRowIds()` to use `tile.rows`
- ✅ Updated `findBlockById()` to search through separated arrays
- ✅ Updated `findRowById()` to use `tile.rows`
- ✅ Updated `findColumnByIds()` for new column structure
- ✅ Updated `parseColumnId()` to handle new format: `column-{rowId}-{layoutId}-{side}`
- ✅ Updated `cloneTiles()` to clone separated arrays
- ✅ Updated `getAllBlocks()` to iterate through separated arrays
- ✅ Updated `getAllRows()` to use `tile.rows`
- ✅ Updated `getAllColumnLayoutIds()` for new structure
- ✅ Updated `getAllColumnLayouts()` for new structure
- ⚠️ **TODO**: `swapBlocks()`, `moveBlockToColumn()`, `moveBlockToRow()` marked for rewrite

**File**: `src/pages/TeachingCourse/utils/collisionDetection.ts`
- ✅ No changes needed - relies on updated helper functions

**File**: `src/pages/TeachingCourse/utils/dragDropHelpers.ts` (Additional updates)
- ✅ Rewrote `swapBlocks()` to work with separated arrays using helper function pattern
- ✅ Rewrote `moveBlockToColumn()` to use remove and add pattern
- ✅ Rewrote `moveBlockToRow()` to use remove and add pattern

---

## ✅ Completed (Phase 4)

### Phase 4: Component Updates
**File**: `src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx`

- ✅ Updated type guards to use discriminators
- ✅ Updated `isTileLevelBlock` check to use `tile.blocks`
- ✅ Updated SortableContext items to combine `tile.blocks` and `tile.rows`
- ✅ Updated tile rendering to combine and sort blocks/rows by order
- ✅ Updated row rendering to combine and sort blocks/layouts by order
- ✅ Updated column rendering to use `leftColumn` and `rightColumn`
- ✅ Updated `handleDeleteRow()` to use `tile.rows`
- ✅ Updated `handleDeleteBlock()` to work with separated arrays
- ✅ Updated `handleDeleteColumnLayout()` to use `row.layouts`
- ✅ Updated `createBlock()` signature to include `level`, `order`, `parentId`, `columnSide`
- ✅ Rewrote `handleRowSelect()` to create rows with new structure
- ✅ Rewrote `handleBlockSelect()` to use findBlockById and work with separated arrays
- ✅ Updated `handleColumnLayoutSelect()` to create layouts with leftColumn/rightColumn
- ✅ Updated DroppableColumn component to use new column ID format (column-{rowId}-{layoutId}-{side})
- ✅ Updated all DroppableColumn calls with layoutId and side props

---

## ✅ Completed (Phase 5)

### Phase 5: Drag Handlers
**File**: `src/pages/TeachingCourse/utils/dragHandlers.ts`

- ✅ Updated `isColumnLayoutId()` to work with `row.layouts`
- ✅ Rewrote `handleRowDragEnd()` to use combined array approach with `tile.blocks` and `tile.rows`
- ✅ Rewrote `handleBlockDragEnd()` to work with separated arrays at all levels
- ✅ Rewrote `handleLayoutDragEnd()` to use combined array approach with `row.blocks` and `row.layouts`
- ✅ Updated `swapBlockWithColumnLayout()` to use separated arrays and swap order fields
- ✅ Fixed `findColumnByIds` function calls to use new signature (rowId, layoutId, colIdx)

---

## ✅ Completed (Phase 6)

### Phase 6: TileInfoOverlay Component
**File**: `src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoOverlay/TileInfoOverlay.tsx`

- ✅ Updated type guard to use `type` discriminator
- ✅ Updated activeRow rendering to use combined arrays (blocks and layouts)
- ✅ Updated activeLayout rendering to use leftColumn and rightColumn

---

## 🎯 Next Steps

### Testing Phase:
1. **Install dependencies and run dev server**:
   - Fix npm dependency issue (rollup missing)
   - Start dev server and check for runtime errors

2. **Manual testing**:
   - Test all drag-and-drop combinations:
     * Reorder tile-level blocks with rows
     * Reorder row-level blocks with layouts
     * Reorder blocks within columns
     * Move blocks between columns
     * Move blocks into rows
   - Test add/edit/delete functionality for blocks, rows, and layouts
   - Test element picker modal

3. **Bug fixes**:
   - Fix any runtime errors discovered during testing
   - Ensure visual feedback works correctly during drag operations

---

## Key Structural Changes

### Old Structure:
```typescript
Tile {
  data: (TileInfoRow | TileInfoBlock)[]  // Mixed array
}

TileInfoRow {
  items: (TileInfoBlock | TileInfoColumnLayout)[]  // Mixed array
}

TileInfoColumnLayout {
  columns: TileInfoColumn[]  // Array of column objects
}

TileInfoColumn {
  blocks: TileInfoBlock[]
}
```

### New Structure:
```typescript
Tile {
  blocks: TileInfoBlock[]  // Separated array for tile-level blocks
  rows: TileInfoRow[]      // Separated array for rows
}

TileInfoRow {
  type: "row"
  level: "tile"
  blocks: TileInfoBlock[]           // Separated array for row-level blocks
  layouts: TileInfoColumnLayout[]   // Separated array for layouts
}

TileInfoColumnLayout {
  type: "columnLayout"
  level: "row"
  leftColumn: TileInfoBlock[]   // Direct array for left column blocks
  rightColumn: TileInfoBlock[]  // Direct array for right column blocks
}

TileInfoBlock {
  type: "text" | "dropdown" | ...
  level: "tile" | "row" | "column"
  order: number
  parentId?: number
  columnSide?: "left" | "right"
}
```

### Rendering Pattern:
To render items in order, combine and sort:
```typescript
[
  ...tile.blocks.map(block => ({ ...block, _itemType: 'block' })),
  ...tile.rows.map(row => ({ ...row, _itemType: 'row' }))
].sort((a, b) => a.order - b.order)
```

---

## Benefits Achieved:

1. ✅ **Type-safe discrimination**: Using `type` field instead of property checks
2. ✅ **Explicit levels**: Each item knows its level in the hierarchy
3. ✅ **Better TypeScript**: Separated arrays reduce need for type guards
4. ✅ **Self-documenting**: `tile.blocks` vs `tile.rows` is clearer than `tile.data`
5. ✅ **Easier filtering**: Can filter/map specific arrays directly
6. ✅ **Cleaner CRUD operations**: All add/edit/delete operations now work with separated arrays

---

## Migration Status Summary:

**✅ ALL CODE MIGRATION PHASES COMPLETED**

All code changes for the separated arrays migration have been completed:
- ✅ Type definitions updated
- ✅ Mock data converted
- ✅ All helper functions rewritten
- ✅ All components updated
- ✅ All drag handlers updated
- ✅ DroppableColumn component updated
- ✅ TileInfoOverlay component updated

**Remaining Work**: Testing and bug fixes only

---

## Notes:

- The migration is following Option 2 from PROPOSED_DATA_STRUCTURE.md
- The old `TileInfoColumn` type is deprecated but kept for backwards compatibility
- All new code should use the discriminated union types with separated arrays
- Column IDs now use format: `column-{rowId}-{layoutId}-{side}` where side is "left" or "right"
