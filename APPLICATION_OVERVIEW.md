# Teaching Course Application - Technical Overview

## Table of Contents
1. [Architecture](#architecture)
2. [Component Hierarchy](#component-hierarchy)
3. [Drag & Drop System](#drag--drop-system)
4. [Styling System](#styling-system)
5. [Type System](#type-system)
6. [Key Utilities](#key-utilities)
7. [Important Patterns](#important-patterns)

---

## Architecture

### Tech Stack
- **Framework**: React with TypeScript
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Styling**: CSS Modules with SCSS
- **Build Tool**: Vite

### Project Structure
```
src/pages/TeachingCourse/
├── components/           # Reusable UI components
│   ├── TileInfoRow/     # Collapsible row component
│   ├── TileInfoBlocks/  # Block components (Text, Dropdown, Overlay)
│   │   ├── TileInfoBase/
│   │   ├── TileInfoText/
│   │   └── TileInfoDropdown/
│   ├── SortableColumnLayout/  # 2-column layout wrapper
│   ├── DroppableColumn/       # Droppable column container
│   ├── DragHandle/           # Draggable grip handle
│   └── InfoBlockActions/     # Action buttons (edit, delete, add)
├── hooks/               # Custom React hooks
│   └── useHoverDetection.ts  # Cursor-based hover detection
├── utils/              # Utility functions
│   ├── dragHandlers.ts        # Drag event handlers
│   ├── collisionDetection.ts # Custom collision logic
│   ├── dragDropHelpers.ts    # Helper functions for drag/drop
│   ├── dragDropStyles.ts     # Opacity and visual feedback
│   └── dragDropConstants.ts  # Constants for drag/drop
├── variants/           # Page variants
│   └── template/
└── mock-data/         # Mock data for development
```

---

## Component Hierarchy

### Three-Level Hierarchy

```
TeachingCourseTemplate (Main Container)
├── DndContext (Drag & Drop Context)
│   ├── SortableContext (Tile Level - Vertical)
│   │   ├── TileInfoBlock (level="tile")
│   │   │   └── TileInfoBaseTemplate
│   │   │       └── TileInfoText / TileInfoDropdown
│   │   └── TileInfoRow (Collapsible Section)
│   │       ├── SortableContext (Row Level)
│   │       │   ├── TileInfoBlock (level="row")
│   │       │   └── SortableColumnLayout
│   │       │       ├── DroppableColumn (Column 1)
│   │       │       │   └── SortableContext (Column Level)
│   │       │       │       └── TileInfoBlock (level="column")
│   │       │       └── DroppableColumn (Column 2)
│   │       │           └── SortableContext (Column Level)
│   │       │               └── TileInfoBlock (level="column")
│   │       └── Droppable (row-dropzone)
│   └── DragOverlay (Visual overlay during drag)
```

### Level Prop

Every draggable block receives a `level` prop:
- `level="tile"` - Block at tile level (outside any row)
- `level="row"` - Block inside a row (outside columns)
- `level="column"` - Block inside a column

This enables level-based collision detection and visual feedback filtering.

---

## Drag & Drop System

### Core Libraries
- **@dnd-kit/core**: Core drag & drop functionality
- **@dnd-kit/sortable**: Sortable lists with smooth animations
- **@dnd-kit/utilities**: CSS transform utilities

### Key Concepts

#### 1. **Sortable Items**
Items that can be dragged and reordered within a sortable context:
- Rows (tile level)
- Tile-level blocks (tile level)
- Row-level blocks (row level)
- Column layouts (row level)
- Column blocks (column level)

#### 2. **Droppable Zones**
Areas where items can be dropped:
- Row drop zones (`row-dropzone-{id}`)
- Column drop zones (`column-{rowId}-{colId}`)

#### 3. **Collision Detection**
Custom collision detection filters targets by:
- **Item type** (row, block, layout)
- **Hierarchy level** (tile, row, column)
- **Container** (same row, same column)

File: `src/pages/TeachingCourse/utils/collisionDetection.ts`

Priority order:
1. Block collisions (for swapping at same level)
2. Row-dropzone collisions (for moving into rows)
3. Column collisions (for moving between columns)

#### 4. **Hover Detection**
Cursor-based detection for precise visual feedback.

File: `src/pages/TeachingCourse/hooks/useHoverDetection.ts`

Features:
- Detects hovered block based on cursor position
- Detects hovered column based on cursor position
- Filters by level compatibility using `getBlockLevel()` and `canDropOnBlock()`
- Returns `{ hoveredColumnId, hoveredBlockId }`

#### 5. **Movement Constraints**
- **Tile-level blocks**: `restrictToVerticalAxis` + `restrictToParentElement`
- **Rows**: `restrictToVerticalAxis` + `restrictToParentElement`
- **Other blocks**: No restrictions

File: `src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx` (lines 472-474)

---

## Styling System

### Opacity During Drag

File: `src/pages/TeachingCourse/utils/dragDropStyles.ts`

#### Constants
```typescript
// dragDropConstants.ts
OPACITY = {
  HIDDEN: 0,      // Item being dragged
  DIMMED: 0.5,    // Other items during drag
  DIMMED_ROW: 0.25, // (Currently unused)
  NORMAL: 1,      // Normal state
}
```

#### Functions

**1. `getBlockContentOpacity()`**
```typescript
getBlockContentOpacity(
  isDragging: boolean,
  activeBlockId: number | null,
  blockId: number,
  isHovered: boolean,
  activeId?: number | null
): number
```
- Returns `OPACITY.HIDDEN` if dragging
- Returns `OPACITY.DIMMED` if another block/row is being dragged
- Returns `OPACITY.NORMAL` otherwise

**2. `getRowOpacity()`**
```typescript
getRowOpacity(
  isDragging: boolean,
  activeId: number | null,
  rowId: number,
  activeBlockId?: number | null
): number
```
- Returns `OPACITY.HIDDEN` if dragging
- Returns `OPACITY.DIMMED` if another row or tile-level block is being dragged
- Returns `OPACITY.NORMAL` otherwise

**3. `getBlockDragStyles()`**
Returns visual feedback styles for hovered blocks:
- `2px solid blue border`
- Semi-transparent blue background (`COLOR_OPACITY.STRONG = 25%`)

**4. `getColumnDropZoneStyles()`**
Returns visual feedback for hovered columns:
- `2px dashed blue border`
- Semi-transparent blue background (`COLOR_OPACITY.MEDIUM = 12%`)

**5. `getRowDropZoneStyles()`**
Returns visual feedback for row drop zones:
- `2px dashed blue border`
- `4px outline offset`
- Light blue background (`COLOR_OPACITY.LIGHT = 6%`)

### Styling Pattern

All draggable components follow this pattern:

```typescript
// Container styles (transform, transitions, pointer events)
const style = {
  transform: isDragOverlay ? undefined : CSS.Transform.toString(transform),
  transition: isDragOverlay ? undefined : transition,
  pointerEvents: getPointerEvents(isDragging, activeBlockId, isDragOverlay),
  ...(isDragOverlay && {
    border: "1px solid var(--primary-color)",
    borderRadius: "8px",
  }),
};

// Content styles (opacity, transitions)
const contentStyle = {
  opacity: isDragOverlay ? 1 : getOpacityFunction(...),
  transition: `opacity ${DRAG_STYLES.TRANSITION}`, // 150ms ease-in-out
};
```

**Key Points:**
- Opacity is applied to content, not container
- Drag handles and action buttons stay at 100% opacity
- Smooth transitions on opacity changes
- Drag overlay has special border styling

---

## Type System

### Core Types

File: `src/types/template.d.ts`

```typescript
// Base block type
type TileInfoBlock = TileInfoBlockText | TileInfoBlockDropdown;

type TileInfoBlockText = {
  id: number;
  name: string;
  type: "text";
  data: string;
};

type TileInfoBlockDropdown = {
  id: number;
  name: string;
  type: "dropdown";
  data: TileInfoSelectOption[];
};

// Row type
type TileInfoRow = {
  id: number;
  name: string;
  items: (TileInfoBlock | TileInfoColumnLayout)[];
};

// Column layout type
type TileInfoColumnLayout = {
  id: number;
  columns: TileInfoColumn[];
};

type TileInfoColumn = {
  id: number;
  blocks: TileInfoBlock[];
};

// Top-level tile type
type Tile = {
  id: number;
  name: string;
  data: (TileInfoRow | TileInfoBlock)[];
};
```

### Location Tracking

```typescript
type BlockLocation = {
  tileIdx: number;   // Always 0 (single tile)
  itemIdx: number;   // Index in tile.data (-1 for tile-level blocks)
  layoutIdx: number; // Index in row.items (-1 if not in layout)
  colIdx: number;    // Index in layout.columns (-1 if not in column)
  blockIdx: number;  // Index in blocks array
};
```

**Level Determination:**
- `itemIdx === -1` → Tile level
- `itemIdx !== -1 && colIdx === -1` → Row level
- `colIdx !== -1` → Column level

---

## Key Utilities

### dragDropHelpers.ts

**1. `findBlockById(tileInfo, blockId)`**
Returns: `{ block, location }` or `null`

**2. `getAllBlocks(tileInfo)`**
Returns all blocks across all levels in flat array

**3. `getAllRowIds(tileInfo)`**
Returns array of all row IDs

**4. `getAllColumnLayoutIds(tileInfo)`**
Returns array of all column layout IDs

**5. `isTileInfoRow(item)`**
Type guard to check if item is a row

### dragHandlers.ts

**1. `handleDragStartUtil(event, tileInfo)`**
Returns: `{ activeId, activeBlockId, activeLayoutId }`

**2. `handleDragEndRow(event, tileInfo)`**
Handles row reordering at tile level

**3. `handleDragEndBlock(event, tileInfo, hoveredColumnId)`**
Handles block drag end with level-based logic:
- Swaps blocks at same level
- Moves blocks into rows (via row-dropzone)
- Moves blocks between columns (via hoveredColumnId)
- **Prevents tile-level blocks from moving into rows/columns**

**4. `handleDragEndColumnLayout(event, tileInfo)`**
Handles column layout reordering within row

### randomId.ts

**`randomId()`**
Generates random 4-digit IDs for new elements

---

## Important Patterns

### 1. Level-Based Restrictions

**Collision Detection:**
```typescript
// Tile-level blocks can only drop on rows or other tile-level blocks
if (activeLevel === "tile") {
  return isRow || (isBlock && containerData?.level === "tile");
}

// Row/column-level blocks can only drop on same level
if (isBlock && activeLevel && containerData?.level) {
  return containerData.level === activeLevel;
}
```

**Hover Detection:**
```typescript
// Filter hover targets by level compatibility
function canDropOnBlock(activeLevel, targetLevel) {
  if (activeLevel === "tile") return targetLevel === "tile";
  return activeLevel === targetLevel;
}
```

### 2. State Management

**Active State Tracking:**
```typescript
const [activeId, setActiveId] = useState<number | null>(null);           // Row drag
const [activeBlockId, setActiveBlockId] = useState<number | null>(null); // Block drag
const [activeLayoutId, setActiveLayoutId] = useState<number | null>(null); // Layout drag
```

**Hover State:**
```typescript
const { hoveredColumnId, hoveredBlockId } = useHoverDetection(activeBlockId, tileInfo);
```

### 3. Props Propagation

Every draggable block receives:
```typescript
<TileInfoBlock
  block={block}
  variant="template"
  activeBlockId={activeBlockId}  // For opacity
  activeId={activeId}            // For row drag opacity
  hoveredBlockId={hoveredBlockId} // For hover feedback
  level="tile" | "row" | "column" // For collision detection
  isDragOverlay={isDragOverlay}   // For overlay styling
  onEditElement={...}
  onDeleteElement={...}
/>
```

### 4. Preventing Unwanted Moves

```typescript
// In dragHandlers.ts
const isTileLevelBlock = sourceResult.location.itemIdx === -1;

// Prevent tile-level blocks from moving into rows
if (isTileLevelBlock && overId.toString().startsWith("row-dropzone")) {
  return null;
}

// Prevent tile-level blocks from moving into columns
if (isTileLevelBlock && hoveredColumnId) {
  return null;
}
```

### 5. Vertical Constraints

```typescript
// In TeachingCourseTemplate.tsx
const isTileLevelBlock = activeBlockId
  ? tileInfo[0].data.some(item => !isTileInfoRow(item) && item.id === activeBlockId)
  : false;

<DndContext
  modifiers={
    activeId || isTileLevelBlock
      ? [restrictToVerticalAxis, restrictToParentElement]
      : []
  }
>
```

### 6. Consistent Styling

All components follow the same styling pattern:
1. Container styles (no opacity)
2. Content styles (with opacity)
3. Drag handles stay visible (100% opacity)
4. Smooth transitions (150ms ease-in-out)

---

## Visual Feedback Summary

| Element | Dragging State | Other Items | Hovered Items |
|---------|---------------|-------------|---------------|
| **Tile-level blocks** | Hidden (overlay) | Dimmed to 50% | Highlighted with border |
| **Rows** | Hidden (overlay) | Dimmed to 50% | Normal |
| **Row-level blocks** | Hidden (overlay) | Dimmed to 50% | Highlighted with border |
| **Column blocks** | Hidden (overlay) | Dimmed to 50% | Highlighted with border |
| **Drag handles** | Always 100% | Always 100% | Always 100% |
| **Action buttons** | Always 100% | Always 100% | Always 100% |

**Color Constants:**
```typescript
COLOR_OPACITY = {
  LIGHT: 6,    // Light background for row drop zones
  MEDIUM: 12,  // Medium background for column hovers
  STRONG: 25,  // Strong background for block hovers
  BORDER: 31,  // Border opacity for drop zones
}
```

---

## Key Files Reference

### Core Logic
- `TeachingCourseTemplate.tsx` - Main container, DndContext setup
- `collisionDetection.ts` - Level-based collision filtering
- `dragHandlers.ts` - Drag event logic, move/swap operations
- `useHoverDetection.ts` - Cursor-based hover detection

### Styling
- `dragDropStyles.ts` - Opacity functions, visual feedback styles
- `dragDropConstants.ts` - Constants for opacity, transitions, selectors

### Components
- `TileInfoRow.tsx` - Collapsible row with drop zone
- `TileInfoBaseTemplate.tsx` - Base draggable block wrapper
- `SortableColumnLayout.tsx` - 2-column layout wrapper
- `DroppableColumn.tsx` - Column drop zone

### Utilities
- `dragDropHelpers.ts` - Block finding, location tracking
- `randomId.ts` - ID generation

---

## Development Notes

### Adding New Block Types

1. Add type to `src/types/template.d.ts`
2. Create component in `src/pages/TeachingCourse/components/TileInfoBlocks/`
3. Add case to `TileInfoBlock.tsx` switch statement
4. Ensure component receives `level`, `activeBlockId`, `activeId`, `hoveredBlockId`
5. Use `TileInfoBaseTemplate` as wrapper

### Modifying Drag Behavior

1. **Collision logic**: Edit `collisionDetection.ts`
2. **Move/swap logic**: Edit `dragHandlers.ts`
3. **Visual feedback**: Edit `dragDropStyles.ts`
4. **Hover detection**: Edit `useHoverDetection.ts`

### Common Pitfalls

1. **Forgetting `level` prop**: Blocks won't be filtered correctly
2. **Not passing `activeId`**: Opacity won't work when dragging rows
3. **Applying opacity to container**: Drag handles will dim
4. **Not checking level in collision**: Cross-level sorting will occur
5. **Missing hover detection filter**: Invalid targets will show feedback
