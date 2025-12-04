# Drag and Drop Combinations

This document outlines all possible drag-and-drop combinations in the Teaching Course builder.

## Structure Hierarchy

```
Tile (top-level container)
├── Tile-level Block (direct child of tile, not inside any row)
├── Tile-level Block (another one - can have multiple)
└── Row (collapsible section with header)
    ├── Row-level Block (direct child of row, not inside column layout)
    ├── Row-level Block (another one - can have multiple)
    └── Column Layout (2-column container inside row)
        ├── Column 1
        │   ├── Block (inside column)
        │   └── Block (inside column)
        └── Column 2
            ├── Block (inside column)
            └── Block (inside column)
```

**Key Terms:**
- **Tile-level Block**: A block that sits directly under the tile, outside any row
- **Row-level Block**: A block that sits directly inside a row, but outside any column layout
- **Column Block**: A block that sits inside a column within a column layout

## Sorting Restrictions

**Important**: Elements can **only sort with elements at the same hierarchical level** AND **same category**:

### Three Hierarchical Levels:
1. **Tile Level**: Rows and tile-level blocks can sort together
2. **Row Level**: Row-level blocks and column layouts can sort together (in the same row)
3. **Column Level**: Column blocks can only sort with other column blocks (in the same column)

### Category-Based Restrictions (✨ NEW):
Blocks are organized into three categories defined in the Block Registry:
- **Containers**: Accordion (can hold other blocks)
- **Layout**: Column Layout, Column (structural elements)
- **Content**: Text, Heading, Dropdown, Paragraph (leaf nodes with data)

**Restriction**: Blocks can only swap/reorder with blocks in the **same category**:
- ✅ Accordion ↔ Accordion (container with container)
- ✅ Text ↔ Heading ↔ Dropdown (content with content)
- ❌ Accordion ↔ Text (container cannot swap with content)
- ❌ Column Layout ↔ Text (layout cannot swap with content)

**Why?** This prevents structural blocks (accordions, layouts) from accidentally swapping with data blocks (text, dropdowns), maintaining a clear separation of concerns.

This restriction applies at **all hierarchical levels** (tile, row, and column).

### Summary:
- ✅ **Tile level**: Rows ↔ Tile-level blocks (can sort together, **same category only**)
- ✅ **Row level**: Row-level blocks ↔ Column layouts (can sort together, same row, **same category only**)
- ✅ **Column level**: Column blocks ↔ Column blocks (same column only, **same category only**)
- ❌ **Cross-level**: No sorting between different levels (tile ↔ row ↔ column)
- ❌ **Cross-category**: No sorting between different categories (container ↔ content ↔ layout)

**Exception**: Blocks can be **moved between levels** via drop zones and hover detection (not sorting, just moving).

## 1. Row Dragging

### Row → Row
- **Action**: Reorder at tile level
- **Result**: Rows swap positions in the tile's data array
- **Visual**: Drop indicator shows between rows
- **Allowed**: ✅ Same level

### Row → Tile-level Block
- **Action**: Reorder at tile level
- **Result**: Row and block swap positions in the tile's data array
- **Visual**: Drop indicator shows between items
- **Allowed**: ✅ Same level (both at tile level)

## 2. Tile-level Block Dragging

**Important**: Tile-level blocks are constrained to vertical-only movement and can only sort with items at tile level (rows and other tile-level blocks).

### Tile-level Block → Tile-level Block
- **Action**: Reorder at tile level (vertical only)
- **Result**: Blocks swap positions in the tile's data array
- **Visual**: Hovered block shows blue border and background highlight (only compatible blocks)
- **Allowed**: ✅ Same level, **same category**
- **Movement**: Restricted to vertical axis
- **Note**: Content blocks can only swap with other content blocks

### Tile-level Block → Row
- **Action**: Reorder at tile level (vertical only)
- **Result**: Block and row swap positions in tile's data array
- **Visual**: Hovered row shows visual feedback
- **Allowed**: ✅ Same level (both at tile level)
- **Movement**: Restricted to vertical axis

### Tile-level Block → Row Content Area (drop zone)
- **Action**: NOT ALLOWED
- **Result**: No change
- **Reason**: Tile-level blocks can only sort vertically with rows and other tile-level blocks. They cannot move inside rows.
- **Visual**: No visual feedback (hover detection filters this out)
- **Allowed**: ❌ Tile-level blocks stay at tile level

## 3. Row-level Block Dragging

### Row-level Block → Row-level Block (same row)
- **Action**: Reorder within row
- **Result**: Blocks reorder within the row's items array
- **Visual**: Drop indicator shows between blocks
- **Allowed**: ✅ Same level, same row, **same category**
- **Note**: Content blocks can only swap with other content blocks

### Row-level Block → Row-level Block (different row)
- **Action**: Not allowed for sorting
- **Result**: No change
- **Reason**: Blocks can only sort within the same row
- **Allowed**: ❌ Different containers

### Row-level Block → Column Layout (same row)
- **Action**: Swap positions
- **Result**: Block and layout exchange positions in the row's items array
- **Visual**: Hovered layout shows visual feedback
- **Allowed**: ✅ Same level (both at row level)

### Row-level Block → Column Layout (different row)
- **Action**: Not allowed
- **Result**: No change
- **Reason**: Can only sort within the same row
- **Allowed**: ❌ Different containers

### Row-level Block → Row Drop Zone (same row)
- **Action**: Not allowed (already in the row)
- **Result**: No change

### Row-level Block → Row Drop Zone (different row)
- **Action**: Move into different row
- **Result**: Block is removed from source row and added to target row
- **Visual**: Blue dashed outline with light blue background on target row content area
- **Allowed**: ✅ Moving between rows

## 4. Column Layout Dragging

### Column Layout → Column Layout (same row)
- **Action**: Reorder within row
- **Result**: Layouts reorder within the row's items array
- **Visual**: Drop indicator shows between layouts
- **Allowed**: ✅ Same level, same row

### Column Layout → Column Layout (different row)
- **Action**: Not allowed
- **Result**: No change
- **Reason**: Layouts can only sort within the same row
- **Allowed**: ❌ Different containers

### Column Layout → Row-level Block (same row)
- **Action**: Swap positions
- **Result**: Layout and block exchange positions in the row's items array
- **Visual**: Hovered block shows visual feedback
- **Allowed**: ✅ Same level (both at row level)

### Column Layout → Row-level Block (different row)
- **Action**: Not allowed
- **Result**: No change
- **Reason**: Can only sort within the same row
- **Allowed**: ❌ Different containers

## 5. Column Block Dragging

### Column Block → Column Block (same column)
- **Action**: Reorder within column
- **Result**: Blocks reorder within the same column's blocks array
- **Visual**: Drop indicator shows between blocks
- **Allowed**: ✅ Same level, same column, **same category**
- **Note**: Only content blocks are allowed in columns, so all column blocks have the same category

### Column Block → Column Block (different column, same row)
- **Action**: Not allowed (no cross-column sorting)
- **Result**: No change
- **Reason**: Blocks can only sort within the same column
- **Note**: Use hoveredColumnId to move blocks to different columns
- **Allowed**: ❌ Different containers

### Column Block → Column Block (different row)
- **Action**: Not allowed
- **Result**: No change
- **Reason**: Blocks can only sort within the same column
- **Allowed**: ❌ Different containers

### Column Block → Empty Column
- **Action**: Move to column
- **Result**: Block is removed from source column and added to target column
- **Visual**: Column shows hover state (if hoveredColumnId is tracked)
- **Note**: Prioritizes hoveredColumnId over collision detection
- **Allowed**: ✅ Special case (moving between columns)

### Column Block → Row Drop Zone
- **Action**: Move into row (becomes a row-level block)
- **Result**: Block is removed from column and added to row's items array
- **Visual**: Blue dashed outline with light blue background on row content area
- **Allowed**: ✅ Special case (moving to different level)

## Visual Feedback Summary

| Scenario | Visual Feedback |
|----------|----------------|
| Sorting (same level) | Hovered compatible item shows 2px solid blue border + background |
| Hovering over compatible block | 2px solid blue border + semi-transparent blue background |
| Hovering over empty column | 2px dashed blue border + semi-transparent blue background |
| Hovering over row drop zone | 2px dashed blue border + light blue background (for row/column blocks only) |
| Dragging item | Content dims to 50% opacity, drag overlay follows cursor |
| Dragging row/block (tile level) | All tile-level items dim to 50% opacity |
| Invalid drop target | No visual feedback (hover detection filters incompatible levels) |
| Drag handles/actions | Always stay at 100% opacity during drag |

## Collision Detection Priority

When dragging a **block**, the system checks collisions in this order:

1. **Block collisions** (for reordering/swapping within same level)
2. **Row-dropzone collisions** (for moving into row)
3. **Column collisions** (for moving to different column)

When dragging a **row**, the system checks:

1. **Tile-level collisions** (rows and tile-level blocks - can sort together)

When dragging a **column layout**, the system checks:

1. **Row-level collisions** (row-level blocks and column layouts - can sort together)

## Special Cases

### Sorting by Level
- **Tile level**: Rows and tile-level blocks can sort/swap with each other
- **Row level**: Row-level blocks and column layouts can sort/swap with each other (same row)
- **Column level**: Column blocks can only sort with other column blocks (same column)

### Moving Between Levels
- **Tile-level → Row-level**: ❌ NOT ALLOWED - Tile-level blocks cannot move into rows
- **Row-level → Row-level (different row)**: Drag row-level block over different row's content area
- **Column → Row-level**: Drag column block over row content area
- **Column → Column (different)**: Use hoveredColumnId to move to different column

### Restrictions
- ❌ No sorting between different hierarchical levels (tile ↔ row ↔ column)
- ❌ No sorting between different containers at the same level (different rows, different columns)
- ✅ Sorting is allowed within the same level and same container
- ✅ Moving between levels is allowed via drop zones and hover detection

## Implementation Files

- **Block Registry**: `src/pages/TeachingCourse/utils/blockRegistry.ts` - Defines block categories and metadata
- **Drag Handlers**: `src/pages/TeachingCourse/utils/dragHandlers.ts` - Implements category-based restrictions
- **Collision Detection**: `src/pages/TeachingCourse/utils/collisionDetection.ts` - Custom collision algorithms
- **Helper Functions**: `src/pages/TeachingCourse/utils/dragDropHelpers.ts` - Utility functions for data manipulation
- **Row Component**: `src/pages/TeachingCourse/components/TileInfoAccordion/TileInfoAccordion.tsx` - Accordion/row rendering
- **Layout Component**: `src/pages/TeachingCourse/components/SortableColumnLayout/SortableColumnLayout.tsx` - Column layout rendering

## Recent Changes

### ✨ Category-Based Swap Restrictions (Latest)
- Added `haveSameCategory()` function in `dragHandlers.ts` to enforce category restrictions
- Blocks are now categorized as **container**, **layout**, or **content** via Block Registry
- Containers can only swap with containers, content with content
- Applied to all three reordering scenarios: tile-level, row-level, and column-level
- Prevents accidental structural changes (e.g., swapping an accordion with a text block)

### 🧹 Code Cleanup
- Removed unused backup file `dragDropHelpers.ts.backup`
- Removed unused type guards (`_isTileInfoAccordion`, `_isTileInfoColumnLayout`)
- Removed unused functions (`swapBlocks`, `findRowById`, unused blockRegistry helpers)
- Removed commented-out code and unused `TileInfoParagraph` component
- Improved code maintainability by removing ~200 lines of dead code
