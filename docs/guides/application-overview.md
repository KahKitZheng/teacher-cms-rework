# Teaching Course Application - Technical Overview

## Table of Contents
1. [Architecture](#architecture)
2. [Data Structure](#data-structure)
3. [Component Hierarchy](#component-hierarchy)
4. [Block Registry System](#block-registry-system)
5. [Drag & Drop System](#drag--drop-system)
6. [Styling System](#styling-system)
7. [Type System](#type-system)
8. [Key Utilities](#key-utilities)
9. [Important Patterns](#important-patterns)

---

## Architecture

### Tech Stack
- **Framework**: React with TypeScript
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Styling**: CSS Modules with SCSS
- **Build Tool**: Vite
- **Lazy Loading**: React.lazy() + Suspense

### Project Structure
```
src/pages/TeachingCourse/
├── TeachingCourseLayout.tsx    # Route wrapper with mode tabs
├── components/                  # Reusable UI components
│   ├── TileInfoRow/            # Accordion container (formerly row)
│   ├── TileInfoBlocks/         # Block components
│   │   ├── TileInfoBlock/      # Block factory (uses registry)
│   │   │   ├── TileInfoBlock.tsx
│   │   │   └── BlockSkeleton.tsx  # Loading state
│   │   ├── TileInfoBase/       # Base draggable wrapper
│   │   ├── TileInfoText/       # Text block
│   │   ├── TileInfoHeading/    # Heading block (h1-h4)
│   │   ├── TileInfoDropdown/   # Dropdown block
│   │   └── TileInfoOverlay/    # Drag overlay renderer
│   ├── SortableColumnLayout/   # Column layout wrapper
│   ├── DroppableColumn/        # Column container
│   ├── DragHandle/             # Drag grip handle
│   ├── InfoBlockActions/       # Action buttons (edit, delete, add)
│   ├── ElementPickerModal/     # Block type picker
│   ├── RecursiveRowRenderer/   # Recursive accordion renderer
│   └── DropZone/               # Drop zone indicator
├── hooks/                       # Custom React hooks
│   └── useHoverDetection.ts    # Cursor-based hover detection
├── utils/                       # Utility functions
│   ├── blockRegistry.ts        # Block factory & metadata registry
│   ├── dragHandlers.ts         # Drag event handlers
│   ├── collisionDetection.ts   # Custom collision logic
│   ├── dragDropHelpers.ts      # Helper functions for drag/drop
│   ├── dragDropStyles.ts       # Opacity and visual feedback
│   ├── dragDropConstants.ts    # Constants for drag/drop
│   └── randomId.ts             # ID generation
├── variants/                    # Page mode variants
│   ├── template/               # Template mode (structure editing)
│   ├── edit/                   # Edit mode (content editing)
│   └── read/                   # Preview mode (read-only)
└── mock-data/                   # Mock data for development
    └── tileInfo.ts
```

### Application Modes

The application has three modes accessible via tabs in [TeachingCourseLayout.tsx](../../src/pages/TeachingCourse/TeachingCourseLayout.tsx):
- **Template Mode** (`/course/:id/template`) - Structure editing with drag & drop
- **Edit Mode** (`/course/:id/edit`) - Content editing
- **Preview Mode** (`/course/:id/view`) - Read-only preview

---

## Data Structure

### Recursive Children Architecture

The application uses a **fully recursive structure** with unified `children` arrays:

```typescript
Tile {
  id: number;
  name: string;
  children: TileInfoBlock[];  // Unified recursive array
}

// Accordion block (formerly TileInfoRow)
TileInfoBlockAccordion {
  type: "accordion";
  level: number;              // 0 = tile level, 1+ = nested
  id: number;
  order: number;
  parentId?: number;          // References parent accordion
  name: string;
  children: TileInfoBlock[];  // Recursive! Can contain nested accordions
}

// Column layout
TileInfoColumnLayout {
  type: "columnLayout";
  level: number;
  id: number;
  order: number;
  parentId: number;
  children: TileInfoBlockColumn[];
}

// Column
TileInfoBlockColumn {
  type: "column";
  level: number;
  id: number;
  order: number;
  parentId: number;
  children: TileInfoBlock[];  // Recursive! Can contain any blocks
}

// Content blocks (text, heading, dropdown, etc.)
TileInfoBlockText | TileInfoBlockHeading | TileInfoBlockDropdown {
  type: "text" | "heading" | "dropdown";
  level: number;
  id: number;
  order: number;
  parentId?: number;
  name: string;
  data: string | Record<string, unknown> | TileInfoSelectOption[];
}
```

### Key Principles

1. **Single array type**: Everything is `TileInfoBlock[]` (no mixed arrays)
2. **Unlimited nesting**: Accordions can nest infinitely
3. **Numeric levels**: 0 for tile level, 1+ for nested levels
4. **Order field**: Used for sorting within parent
5. **Parent tracking**: `parentId` references parent container

**See**: [Data Structure Migration Status](data-structure-migration-status.md) for migration history

---

## Component Hierarchy

### Three-Level Hierarchy

```
TeachingCourseLayout (Route wrapper with mode tabs)
└── TeachingCourseTemplate (Main container for template mode)
    ├── DndContext (Drag & Drop Context)
    │   ├── SortableContext (Tile Level - Vertical)
    │   │   ├── RecursiveAccordionRenderer (level="tile")
    │   │   │   └── TileInfoRow (Accordion)
    │   │   │       ├── SortableContext (Accordion Level)
    │   │   │       │   ├── TileInfoBlock (level="accordion")
    │   │   │       │   ├── RecursiveAccordionRenderer (Nested accordions)
    │   │   │       │   └── SortableColumnLayout
    │   │   │       │       ├── DroppableColumn (Column 1)
    │   │   │       │       │   └── SortableContext (Column Level)
    │   │   │       │       │       └── TileInfoBlock (level="column")
    │   │   │       │       └── DroppableColumn (Column 2)
    │   │   │       │           └── SortableContext (Column Level)
    │   │   │       │               └── TileInfoBlock (level="column")
    │   │   │       └── DropZone (accordion-dropzone)
    │   │   └── TileInfoBlock (level="tile")
    │   └── DragOverlay (Visual overlay during drag)
    │       └── TileInfoOverlay (Renders dragged item)
    └── ElementPickerModal (Block type picker)
```

### Level Prop

Every draggable block receives a `level` prop for collision detection:
- `level="tile"` - Block at tile level (outside any accordion)
- `level="accordion"` - Block inside an accordion (outside columns)
- `level="column"` - Block inside a column

**Note**: The type system uses numeric levels (0, 1, 2+), but the component props use string levels for collision detection compatibility.

---

## Block Registry System

### Overview

The block registry ([blockRegistry.ts](../../src/pages/TeachingCourse/utils/blockRegistry.ts)) is a **factory pattern** that:
1. Maps block types to React components
2. Provides metadata for each block type
3. Enables lazy loading (code splitting)
4. Supports plugin registration

**See**: [ADR 0009: Block Registry Factory](../adr/0009-block-registry-factory.md)

### Registry Structure

```typescript
export const BLOCK_REGISTRY = {
  accordion: {
    category: 'container',
    canHaveChildren: true,
    canBeNested: true,
    canBeInColumn: false,
    canBeAtTileLevel: true,
    displayName: 'Accordion',
    icon: 'chevron-down',
    component: lazy(() => import('../components/TileInfoRow/TileInfoRow')),
  },
  text: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Text Block',
    icon: 'text',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText')),
  },
  // ... other blocks
}
```

### Key Functions

**1. `getBlockComponent(type)`** - Get lazy component for block type
**2. `getBlockMetadata(type)`** - Get metadata for block type
**3. `isContainer(block)`** - Check if block can contain children
**4. `isContentBlock(block)`** - Check if block is a leaf node
**5. `canBeInColumn(block)`** - Check if block can be placed in columns

### TileInfoBlock Factory

The [TileInfoBlock.tsx](../../src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoBlock/TileInfoBlock.tsx) component uses the registry:

```typescript
export default function TileInfoBlock({ block, variant, ...props }) {
  const Component = getBlockComponent(block.type);

  if (!Component) {
    return <div>Unknown block type: {block.type}</div>;
  }

  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Component
        tileInfo={block}
        variant={variant}
        {...props}
      />
    </Suspense>
  );
}
```

**Benefits**:
- No switch statement needed
- Automatic code splitting
- Easy to add new blocks (just update registry)
- Plugin-friendly architecture

---

## Drag & Drop System

### Core Libraries
- **@dnd-kit/core**: Core drag & drop functionality
- **@dnd-kit/sortable**: Sortable lists with smooth animations
- **@dnd-kit/utilities**: CSS transform utilities

### Key Concepts

#### 1. **Sortable Items**
Items that can be dragged and reordered:
- Accordions (tile level and nested)
- Tile-level blocks
- Accordion-level blocks
- Column layouts
- Column blocks

#### 2. **Droppable Zones**
Areas where items can be dropped:
- Accordion drop zones (`accordion-dropzone-{id}`)
- Column drop zones (`column-{layoutId}-{columnOrder}`)

#### 3. **Collision Detection**

Custom collision detection ([collisionDetection.ts](../../src/pages/TeachingCourse/utils/collisionDetection.ts)) filters targets by:
- **Item type** (accordion, block, layout)
- **Hierarchy level** (tile, accordion, column)
- **Container** (same accordion, same column)

**Rules**:
- Accordions: Drop on other accordions or tile-level blocks
- Tile-level blocks: Drop on accordions or other tile-level blocks (vertical only)
- Accordion-level blocks: Drop on other accordion-level blocks, columns, or accordion dropzones
- Column-level blocks: Drop on other column-level blocks or columns
- Column layouts: Drop on other layouts or accordion-level blocks

**File**: [collisionDetection.ts](../../src/pages/TeachingCourse/utils/collisionDetection.ts)

#### 4. **Hover Detection**

Cursor-based detection for precise visual feedback.

**File**: [useHoverDetection.ts](../../src/pages/TeachingCourse/hooks/useHoverDetection.ts)

**Features**:
- Detects hovered block based on cursor position
- Detects hovered column based on cursor position
- Filters by level compatibility using `getBlockLevel()` and `canDropOnBlock()`
- Returns `{ hoveredColumnId, hoveredBlockId }`

**Level Determination**:
```typescript
function getBlockLevel(blockId, tileInfo): "tile" | "accordion" | "column" {
  const result = findBlockById(tileInfo, blockId);
  const { location } = result;

  if (location.itemIdx === -1) return "tile";
  if (location.colIdx !== -1) return "column";
  return "accordion";
}
```

**Compatibility Check**:
```typescript
function canDropOnBlock(activeLevel, targetLevel): boolean {
  if (activeLevel === "tile") return targetLevel === "tile";
  return activeLevel === targetLevel;
}
```

#### 5. **Movement Constraints**

Applied via modifiers in [TeachingCourseTemplate.tsx](../../src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx):

```typescript
<DndContext
  modifiers={
    activeId || isTileLevelBlock
      ? [restrictToVerticalAxis, restrictToParentElement]
      : []
  }
>
```

**Constraints**:
- **Tile-level blocks & accordions**: Vertical axis only + parent element boundary
- **Other blocks**: No restrictions (can move freely)

---

## Styling System

### Opacity During Drag

**File**: [dragDropStyles.ts](../../src/pages/TeachingCourse/utils/dragDropStyles.ts)

#### Constants

```typescript
// dragDropConstants.ts
OPACITY = {
  HIDDEN: 0,      // Item being dragged
  DIMMED: 0.5,    // Other items during drag
  NORMAL: 1,      // Normal state
}

COLOR_OPACITY = {
  LIGHT: 6,    // Light background for accordion drop zones
  MEDIUM: 12,  // Medium background for column hovers
  STRONG: 25,  // Strong background for block hovers
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
- Returns `OPACITY.DIMMED` if another block/accordion is being dragged
- Returns `OPACITY.NORMAL` otherwise

**2. `getRowOpacity()` (for accordions)**
```typescript
getRowOpacity(
  isDragging: boolean,
  activeId: number | null,
  rowId: number,
  activeBlockId?: number | null
): number
```
- Returns `OPACITY.HIDDEN` if dragging
- Returns `OPACITY.DIMMED` if another accordion or tile-level block is being dragged
- Returns `OPACITY.NORMAL` otherwise

**3. `getBlockDragStyles()`**
Returns visual feedback styles for hovered blocks:
- `2px solid primary-color outline`
- Semi-transparent background (`COLOR_OPACITY.STRONG = 25%`)

**4. `getColumnDropZoneStyles()`**
Returns visual feedback for hovered columns:
- `2px dashed primary-color border`
- Semi-transparent background (`COLOR_OPACITY.MEDIUM = 12%`)

**5. `getRowDropZoneStyles()`** (accordion dropzones)
Returns visual feedback for accordion drop zones:
- `2px dashed primary-color border`
- `4px outline offset`
- Light background (`COLOR_OPACITY.LIGHT = 6%`)

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

**Key Points**:
- Opacity is applied to content, not container
- Drag handles and action buttons stay at 100% opacity
- Smooth transitions on opacity changes
- Drag overlay has special border styling

---

## Type System

### Core Types

**File**: [template.d.ts](../../src/types/template.d.ts)

```typescript
// Tile (top-level container)
type Tile = {
  id: number;
  chapterId: number;
  order: number;
  name: string;
  coverImage: string;
  state: "open" | "locked" | "invisible";
  type: "regular" | "contentMenu" | "test";
  children: TileInfoBlock[];  // Unified recursive array
};

// Accordion block (formerly TileInfoRow)
type TileInfoBlockAccordion = {
  type: "accordion";
  level: number;        // 0 = tile level, 1+ = nested
  id: number;
  order: number;
  parentId?: number;    // References parent accordion
  name: string;
  children: TileInfoBlock[];  // Recursive!
};

// Column layout
type TileInfoColumnLayout = {
  type: "columnLayout";
  level: number;
  id: number;
  order: number;
  parentId: number;
  children: TileInfoBlockColumn[];
};

// Column
type TileInfoBlockColumn = {
  type: "column";
  level: number;
  id: number;
  order: number;
  parentId: number;
  width?: string;       // CSS width/flex value
  children: TileInfoBlock[];  // Recursive!
};

// Content blocks
type TileInfoBlockText = {
  type: "text";
  level: number;
  id: number;
  order: number;
  parentId?: number;
  name: string;
  data: string;
};

type TileInfoBlockHeading = {
  type: "heading";
  level: number;
  id: number;
  order: number;
  parentId?: number;
  name: string;
};

type TileInfoBlockDropdown = {
  type: "dropdown";
  level: number;
  id: number;
  order: number;
  parentId?: number;
  name: string;
  options: TileInfoSelectOption[];
};

// Union type
type TileInfoBlock =
  | TileInfoBlockAccordion
  | TileInfoColumnLayout
  | TileInfoBlockColumn
  | TileInfoBlockHeading
  | TileInfoBlockText
  | TileInfoBlockParagraph
  | TileInfoBlockDropdown;
```

### Location Tracking (for drag & drop helpers)

```typescript
type BlockLocation = {
  tileIdx: number;   // Always 0 (single tile)
  itemIdx: number;   // Index in tile.children (-1 for tile-level blocks)
  layoutIdx: number; // Index in accordion.children (-1 if not in layout)
  colIdx: number;    // Index in layout.columns (-1 if not in column)
  blockIdx: number;  // Index in blocks array
};
```

**Level Determination**:
- `itemIdx === -1` → Tile level
- `itemIdx !== -1 && colIdx === -1` → Accordion level
- `colIdx !== -1` → Column level

---

## Key Utilities

### blockRegistry.ts

**File**: [blockRegistry.ts](../../src/pages/TeachingCourse/utils/blockRegistry.ts)

**1. `getBlockComponent(type)`** - Get lazy component for block type
**2. `getBlockMetadata(type)`** - Get metadata for block type
**3. `isContainer(block)`** - Check if block can contain children
**4. `isContentBlock(block)`** - Check if block is a leaf node
**5. `isLayoutBlock(block)`** - Check if block is a layout block
**6. `canBeInColumn(block)`** - Check if block can be placed in columns

### dragDropHelpers.ts

**File**: [dragDropHelpers.ts](../../src/pages/TeachingCourse/utils/dragDropHelpers.ts)

**1. `findBlockById(tileInfo, blockId)`**
Returns: `{ block, location }` or `null`

**2. `getAllBlocks(tileInfo)`**
Returns all blocks across all levels in flat array

**3. `getAllRowIds(tileInfo)`**
Returns array of all accordion IDs (renamed from rows)

**4. `getAllRows(tileInfo)`**
Returns array of all `TileInfoBlockAccordion` objects

**5. `getAllColumnLayoutIds(tileInfo)`**
Returns array of all column layout IDs

**6. `cloneTiles(tileInfo)`**
Deep clone of tile structure

**7. `moveBlockToColumn(tileInfo, blockId, targetColumnId)`**
Move block into a column

**8. `moveBlockToRow(tileInfo, blockId, targetRowId)`**
Move block into an accordion

### dragHandlers.ts

**File**: [dragHandlers.ts](../../src/pages/TeachingCourse/utils/dragHandlers.ts)

**1. `handleDragStart(event, tileInfo)`**
Returns: `{ activeId, activeBlockId, activeLayoutId }`

**2. `handleRowDragEnd(event, tileInfo)`**
Handles accordion reordering at tile level

**3. `handleBlockDragEnd(event, tileInfo, hoveredBlockId, hoveredColumnId)`**
Handles block drag end with level-based logic:
- Swaps blocks at same level
- Moves blocks into accordions (via accordion-dropzone)
- Moves blocks between columns (via hoveredColumnId)
- **Prevents tile-level blocks from moving into accordions/columns**

**4. `handleLayoutDragEnd(event, tileInfo)`**
Handles column layout reordering within accordion

### randomId.ts

**File**: [randomId.ts](../../src/pages/TeachingCourse/utils/randomId.ts)

**`randomId()`** - Generates random 4-digit IDs for new elements

---

## Important Patterns

### 1. Level-Based Restrictions

**Collision Detection**:
```typescript
// Tile-level blocks can only drop on accordions or other tile-level blocks
if (activeLevel === "tile") {
  return isAccordion || (isBlock && containerData?.level === "tile");
}

// Accordion/column-level blocks can only drop on same level
if (isBlock && activeLevel && containerData?.level) {
  return containerData.level === activeLevel;
}
```

**Hover Detection**:
```typescript
// Filter hover targets by level compatibility
function canDropOnBlock(activeLevel, targetLevel) {
  if (activeLevel === "tile") return targetLevel === "tile";
  return activeLevel === targetLevel;
}
```

### 2. State Management

**Active State Tracking**:
```typescript
const [activeId, setActiveId] = useState<number | null>(null);           // Accordion drag
const [activeBlockId, setActiveBlockId] = useState<number | null>(null); // Block drag
const [activeLayoutId, setActiveLayoutId] = useState<number | null>(null); // Layout drag
```

**Hover State**:
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
  activeId={activeId}            // For accordion drag opacity
  hoveredBlockId={hoveredBlockId} // For hover feedback
  level="tile" | "accordion" | "column" // For collision detection
  isDragOverlay={isDragOverlay}   // For overlay styling
  onEditElement={...}
  onDeleteElement={...}
  onAddElement={...}
/>
```

### 4. Preventing Unwanted Moves

```typescript
// In dragHandlers.ts
const isTileLevelBlock = sourceResult.location.itemIdx === -1;

// Prevent tile-level blocks from moving into accordions
if (isTileLevelBlock && overId.toString().startsWith("accordion-dropzone")) {
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
  ? tileInfo[0].children.some(child => !isContainer(child) && child.id === activeBlockId)
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

### 7. Recursive Rendering

Accordions render recursively to support unlimited nesting:

```typescript
// In RecursiveAccordionRenderer.tsx
export default function RecursiveAccordionRenderer({ accordion, ...props }) {
  return (
    <TileInfoRow
      tileInfo={accordion}
      {...props}
    >
      {/* Children are rendered recursively */}
      {accordion.children
        .sort((a, b) => a.order - b.order)
        .map(child => {
          if (child.type === 'accordion') {
            return <RecursiveAccordionRenderer accordion={child} {...props} />
          } else {
            return <TileInfoBlock block={child} {...props} />
          }
        })}
    </TileInfoRow>
  );
}
```

---

## Visual Feedback Summary

| Element | Dragging State | Other Items | Hovered Items |
|---------|---------------|-------------|---------------|
| **Tile-level blocks** | Hidden (overlay) | Dimmed to 50% | Highlighted with outline |
| **Accordions** | Hidden (overlay) | Dimmed to 50% | Normal |
| **Accordion-level blocks** | Hidden (overlay) | Dimmed to 50% | Highlighted with outline |
| **Column blocks** | Hidden (overlay) | Dimmed to 50% | Highlighted with outline |
| **Drag handles** | Always 100% | Always 100% | Always 100% |
| **Action buttons** | Always 100% | Always 100% | Always 100% |

**Color Constants**:
```typescript
COLOR_OPACITY = {
  LIGHT: 6,    // Light background for accordion drop zones
  MEDIUM: 12,  // Medium background for column hovers
  STRONG: 25,  // Strong background for block hovers
}
```

---

## Key Files Reference

### Core Logic
- [TeachingCourseLayout.tsx](../../src/pages/TeachingCourse/TeachingCourseLayout.tsx) - Route wrapper with mode tabs
- [TeachingCourseTemplate.tsx](../../src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx) - Main container, DndContext setup
- [blockRegistry.ts](../../src/pages/TeachingCourse/utils/blockRegistry.ts) - Block factory & metadata
- [collisionDetection.ts](../../src/pages/TeachingCourse/utils/collisionDetection.ts) - Level-based collision filtering
- [dragHandlers.ts](../../src/pages/TeachingCourse/utils/dragHandlers.ts) - Drag event logic, move/swap operations
- [useHoverDetection.ts](../../src/pages/TeachingCourse/hooks/useHoverDetection.ts) - Cursor-based hover detection

### Styling
- [dragDropStyles.ts](../../src/pages/TeachingCourse/utils/dragDropStyles.ts) - Opacity functions, visual feedback styles
- [dragDropConstants.ts](../../src/pages/TeachingCourse/utils/dragDropConstants.ts) - Constants for opacity, transitions, selectors

### Components
- [TileInfoBlock.tsx](../../src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoBlock/TileInfoBlock.tsx) - Block factory component
- [BlockSkeleton.tsx](../../src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoBlock/BlockSkeleton.tsx) - Loading skeleton
- [TileInfoRow.tsx](../../src/pages/TeachingCourse/components/TileInfoRow/TileInfoRow.tsx) - Accordion container with drop zone
- [RecursiveRowRenderer.tsx](../../src/pages/TeachingCourse/components/RecursiveRowRenderer/RecursiveRowRenderer.tsx) - Recursive accordion renderer
- [TileInfoBaseTemplate.tsx](../../src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoBase/template/TileInfoBaseTemplate.tsx) - Base draggable block wrapper
- [SortableColumnLayout.tsx](../../src/pages/TeachingCourse/components/SortableColumnLayout/SortableColumnLayout.tsx) - Column layout wrapper
- [DroppableColumn.tsx](../../src/pages/TeachingCourse/components/DroppableColumn/DroppableColumn.tsx) - Column drop zone
- [ElementPickerModal.tsx](../../src/pages/TeachingCourse/components/ElementPickerModal/ElementPickerModal.tsx) - Block type picker

### Utilities
- [dragDropHelpers.ts](../../src/pages/TeachingCourse/utils/dragDropHelpers.ts) - Block finding, location tracking
- [randomId.ts](../../src/pages/TeachingCourse/utils/randomId.ts) - ID generation

### Types
- [template.d.ts](../../src/types/template.d.ts) - Type definitions

---

## Development Notes

### Adding New Block Types

1. Add block to [blockRegistry.ts](../../src/pages/TeachingCourse/utils/blockRegistry.ts):
```typescript
export const BLOCK_REGISTRY = {
  // ... existing blocks
  myNewBlock: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'My New Block',
    description: 'Description of the block',
    icon: 'icon-name',
    component: lazy(() => import('../components/TileInfoBlocks/MyNewBlock')),
  },
};
```

2. Add type to [template.d.ts](../../src/types/template.d.ts):
```typescript
type TileInfoBlockMyNew = {
  type: "myNewBlock";
  level: number;
  id: number;
  order: number;
  parentId?: number;
  name: string;
  // ... other fields
};

type TileInfoBlock =
  | TileInfoBlockAccordion
  | TileInfoColumnLayout
  | TileInfoBlockColumn
  | TileInfoBlockHeading
  | TileInfoBlockText
  | TileInfoBlockMyNew  // Add here
  | TileInfoBlockDropdown;
```

3. Create component in `src/pages/TeachingCourse/components/TileInfoBlocks/MyNewBlock/`

4. Ensure component receives standard props: `variant`, `tileInfo`, `activeBlockId`, `activeId`, `hoveredBlockId`, `level`, `isDragOverlay`, `onEditElement`, `onDeleteElement`, `onAddElement`

5. Use `TileInfoBaseTemplate` as wrapper if the block should be draggable

**That's it!** The block will automatically:
- Appear in ElementPickerModal
- Support drag & drop
- Work with lazy loading
- Integrate with collision detection

### Modifying Drag Behavior

1. **Collision logic**: Edit [collisionDetection.ts](../../src/pages/TeachingCourse/utils/collisionDetection.ts)
2. **Move/swap logic**: Edit [dragHandlers.ts](../../src/pages/TeachingCourse/utils/dragHandlers.ts)
3. **Visual feedback**: Edit [dragDropStyles.ts](../../src/pages/TeachingCourse/utils/dragDropStyles.ts)
4. **Hover detection**: Edit [useHoverDetection.ts](../../src/pages/TeachingCourse/hooks/useHoverDetection.ts)

### Common Pitfalls

1. **Forgetting `level` prop**: Blocks won't be filtered correctly in collision detection
2. **Not passing `activeId`**: Opacity won't work when dragging accordions
3. **Applying opacity to container**: Drag handles will dim (apply to content only)
4. **Not checking level in collision**: Cross-level sorting will occur
5. **Missing hover detection filter**: Invalid targets will show feedback
6. **Not using lazy loading**: Bundle size will increase significantly
7. **Mixing level types**: Type system uses numbers (0, 1, 2+), but components use strings ("tile", "accordion", "column")

### Terminology

| Old Term | New Term | Notes |
|----------|----------|-------|
| Row | Accordion | Renamed to better reflect collapsible container behavior |
| TileInfoRow | TileInfoBlockAccordion | Now part of the block union type |
| Row level | Accordion level | Used in component props for collision detection |
| `data` array | `children` array | Unified recursive array for all containers |
| String levels ("tile", "row", "column") | Numeric levels (0, 1, 2+) | Type system uses numbers, but components still use strings for compatibility |

---

## Related Documentation

- [ADR 0001: Data Structure Architecture](../adr/0001-data-structure-architecture.md) - Original data structure proposal
- [ADR 0002: Plugin Architecture](../adr/0002-plugin-architecture.md) - Plugin system architecture
- [ADR 0008: Separate Routes for Course Variants](../adr/0008-separate-routes-for-course-variants.md) - Routing architecture
- [ADR 0009: Block Registry Factory](../adr/0009-block-registry-factory.md) - Block registry pattern
- [ADR 0010: Compound Components Pattern](../adr/0010-compound-components-pattern.md) - Tile templates for faster course creation
- [Data Structure Migration Status](data-structure-migration-status.md) - Migration history and current status
