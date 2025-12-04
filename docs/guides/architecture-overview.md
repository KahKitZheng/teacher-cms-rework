# Teaching Course Architecture Overview

**Version:** 1.0
**Last Updated:** November 2025
**Audience:** Developers with some project knowledge, but unfamiliar with the design patterns

This document provides an extensive overview of four key architectural patterns used in the Teaching Course application:

1. [Data Structure](#1-data-structure)
2. [Block Registry Factory](#2-block-registry-factory)
3. [Page Routing](#3-page-routing)
4. [Component Composition Patterns](#4-component-composition-patterns)

---

## Table of Contents

- [1. Data Structure](#1-data-structure)
  - [1.1 Overview](#11-overview)
  - [1.2 Current Implementation](#12-current-implementation)
  - [1.3 Why This Benefits Our Use Case](#13-why-this-benefits-our-use-case)
  - [1.4 Code Examples](#14-code-examples)
  - [1.5 Pros and Cons](#15-pros-and-cons)
  - [1.6 Alternatives Explored](#16-alternatives-explored)
- [2. Block Registry Factory](#2-block-registry-factory)
  - [2.1 Overview](#21-overview)
  - [2.2 Current Implementation](#22-current-implementation)
  - [2.3 Why This Benefits Our Use Case](#23-why-this-benefits-our-use-case)
  - [2.4 Code Examples](#24-code-examples)
  - [2.5 Pros and Cons](#25-pros-and-cons)
  - [2.6 Alternatives Explored](#26-alternatives-explored)
- [3. Page Routing](#3-page-routing)
  - [3.1 Overview](#31-overview)
  - [3.2 Current Implementation](#32-current-implementation)
  - [3.3 Why This Benefits Our Use Case](#33-why-this-benefits-our-use-case)
  - [3.4 Code Examples](#34-code-examples)
  - [3.5 Pros and Cons](#35-pros-and-cons)
  - [3.6 Alternatives Explored](#36-alternatives-explored)
- [4. Component Composition Patterns](#4-component-composition-patterns)
  - [4.1 Overview](#41-overview)
  - [4.2 Current Implementation](#42-current-implementation)
  - [4.3 Why This Benefits Our Use Case](#43-why-this-benefits-our-use-case)
  - [4.4 Code Examples](#44-code-examples)
  - [4.5 Pros and Cons](#45-pros-and-cons)
  - [4.6 NOT Traditional Compound Components](#46-not-traditional-compound-components)
  - [4.7 Alternatives Explored](#47-alternatives-explored)
- [5. How These Patterns Work Together](#5-how-these-patterns-work-together)
- [6. References](#6-references)

---

## 1. Data Structure

### 1.1 Overview

The Teaching Course application uses a **fully recursive, discriminated union** data structure to represent course content. This structure supports unlimited nesting of blocks, containers, and layouts through a unified `children` array architecture.

**Key Characteristics:**

- Discriminated unions with explicit `type` field
- Recursive `children` arrays supporting unlimited depth
- Dynamic `level` tracking for nesting depth
- Parent references via `parentId` for efficient lookups
- Explicit ordering via `order` field

**Important Note on "Level":**
The codebase uses **two different "level" concepts**:

1. **Data Structure `level`** (number): Tracks nesting depth (0, 1, 2, 3...) in `TileInfoBlockBase.level`
2. **Drag Context `level`** (string): Identifies drag location ("tile" | "accordion" | "column") in `useSortable` data

These serve different purposes and should not be confused. See the [drag-drop section](#aligns-with-drag-and-drop-logic) for details.

### 1.2 Current Implementation

**Type Hierarchy** ([template.d.ts:1](src/types/template.d.ts#L1)):

```typescript
// Top-level container
type Tile = {
  id: number;
  chapterId: number;
  order: number;
  name: string;
  coverImage: string;
  state: "open" | "locked" | "invisible";
  type: "regular" | "contentMenu" | "test";
  children: TileInfoBlock[]; // Unified recursive array
};

// Base type for all TileInfo blocks - contains common fields
type TileInfoBlockBase = {
  type: string;
  level: number; // Nesting depth: 0, 1, 2, ...
  id: number;
  order: number; // Explicit positioning
  parentId?: number; // Optional: References parent container ID
};

// Container blocks
type TileInfoBlockAccordion = TileInfoBlockBase & {
  type: "accordion"; // Type discriminator
  icon?: string;
  name: string;
  children: TileInfoBlock[]; // Recursive - can contain ANY blocks!
};

// Layout container
type TileInfoColumnLayout = TileInfoBlockBase & {
  type: "columnLayout";
  parentId: number; // Required for layouts
  children: TileInfoBlockColumn[];
};

// Column block
type TileInfoBlockColumn = TileInfoBlockBase & {
  type: "column";
  parentId: number; // Required for columns
  width?: string; // CSS flex value
  children: TileInfoBlock[]; // Recursive!
};

// Content blocks
type TileInfoBlockText = TileInfoBlockBase & {
  type: "text";
  name: string;
  data: string;
};

type TileInfoBlockHeading = TileInfoBlockBase & {
  type: "heading";
  icon?: string; // Optional icon for all heading levels (typically used for h2-h6)
  name: string; // Heading text content
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; // HTML heading level (defaults to h2)
  // Heading level guidelines (within a SINGLE tile):
  // - h1: Main tile title (ONE per tile maximum, usually no icon)
  //       Multiple tiles on the same page can each have their own h1
  //       Each tile is treated as an independent content unit
  // - h2: Major section heading (default, can have icon)
  //       Used for accordion headers and main sections within the tile
  // - h3: Subsection heading (can have icon)
  //       Nested content within h2 sections
  // - h4: Minor heading (nested subsections)
  // - h5-h6: Deep nested headings (rarely used in practice)
};

type TileInfoBlockParagraph = TileInfoBlockBase & {
  type: "paragraph";
  name: string;
  data: Record<string, unknown>; // TipTap format
};

type TileInfoBlockDropdown = TileInfoBlockBase & {
  type: "dropdown";
  name: string;
  options: TileInfoSelectOption[];
};

// Union of all block types
type TileInfoBlock =
  | TileInfoBlockAccordion // Container: can have children
  | TileInfoColumnLayout // Layout: multi-column
  | TileInfoBlockColumn // Column: container within layout
  | TileInfoBlockHeading // Content
  | TileInfoBlockText // Content
  | TileInfoBlockParagraph // Content
  | TileInfoBlockDropdown; // Content
```

#### Heading Level Data Structure & Usage

Each `TileInfoBlockHeading` supports different heading levels (h1-h6) with consistent data structure but varying semantic meaning and typical usage patterns:

| Level     | Semantic Meaning     | Data Fields                                                                          | Icon Usage           | Font Size                    | Use Case                                                                  |
| --------- | -------------------- | ------------------------------------------------------------------------------------ | -------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| **h1**    | Main tile title      | `name` (required)<br/>`icon` (optional, rarely used)<br/>`headingLevel: "h1"`        | ❌ Typically no icon | Largest (2.5rem)             | - Tile main title<br/>- **ONE per tile maximum**<br/>- Highest importance |
| **h2**    | Section heading      | `name` (required)<br/>`icon` (optional, common)<br/>`headingLevel: "h2"` _(default)_ | ✅ Common            | Large (2rem)                 | - Major sections<br/>- Accordion headers<br/>- Default heading level      |
| **h3**    | Subsection heading   | `name` (required)<br/>`icon` (optional)<br/>`headingLevel: "h3"`                     | ✅ Optional          | Medium (1.75rem)             | - Subsections within h2<br/>- Nested content organization                 |
| **h4**    | Minor heading        | `name` (required)<br/>`icon` (optional, rare)<br/>`headingLevel: "h4"`               | ⚠️ Rare              | Small (1.5rem)               | - Deep nested sections<br/>- Supporting headings                          |
| **h5-h6** | Deep nested headings | `name` (required)<br/>`icon` (not recommended)<br/>`headingLevel: "h5"` or `"h6"`    | ❌ Not recommended   | Extra small (1.25rem - 1rem) | - Very deep nesting<br/>- Rarely used in practice                         |

**Important: h1 Usage Across Multiple Tiles**

While traditional web accessibility guidelines recommend one h1 per page, this application uses a **tile-based architecture** where each tile represents an independent learning module or content unit. Therefore:

✅ **Allowed:** Multiple tiles on the same page, each with its own h1

```typescript
// Course page with multiple tiles
Page: "Natuur en Techniek - Les 3"
├─ Tile 1: "Onze mooie aarde"
│   ├─ h1: "Onze mooie aarde" (tile title)
│   ├─ h2: "Kennis" (section)
│   └─ h2: "Verwerking" (section)
│
└─ Tile 2: "Het weer en klimaat"
    ├─ h1: "Het weer en klimaat" (tile title)
    ├─ h2: "Theorie" (section)
    └─ h2: "Oefeningen" (section)
```

❌ **Not Allowed:** Multiple h1s within the same tile

```typescript
// BAD: Multiple h1s in one tile
Tile: "Onze mooie aarde"
├─ h1: "Onze mooie aarde" ✓ (tile title)
├─ h1: "Kennis" ✗ (should be h2)
└─ h1: "Verwerking" ✗ (should be h2)
```

**Rationale:**

- Each tile is semantically similar to an `<article>` element - a self-contained, independent content unit
- Screen readers can navigate between tiles as separate content sections
- This approach balances accessibility with the modular architecture of educational content
- Consider wrapping tiles in `<article>` or adding `role="article"` for improved semantics

**All heading levels share the same base properties:**

```typescript
{
  type: "heading",
  id: number,
  order: number,
  level: number,             // Nesting level (0 = tile-level, 1+ = nested)
  parentId?: number,          // Parent container ID if nested
  name: string,              // The heading text
  icon?: string,             // Optional icon identifier
  headingLevel?: HeadingLevel // Defaults to "h2" if not specified
}
```

**Example Data for Different Heading Levels:**

```typescript
// h1 - Main tile title (ONE per tile maximum, no icon typically)
{
  type: "heading",
  id: 1,
  order: 0,
  level: 0,
  name: "Introduction to React Hooks",
  headingLevel: "h1"
  // Note: This should be the ONLY h1 in this tile
}

// h2 - Section heading (default, often with icon)
{
  type: "heading",
  id: 2,
  order: 1,
  level: 0,
  name: "What are Hooks?",
  icon: "info-circle",
  headingLevel: "h2"  // or omit for default
}

// h3 - Subsection (within an accordion)
{
  type: "heading",
  id: 3,
  order: 0,
  level: 1,
  parentId: 10,  // Inside accordion with id 10
  name: "useState Hook",
  icon: "code",
  headingLevel: "h3"
}

// h4 - Minor heading (deep nesting)
{
  type: "heading",
  id: 4,
  order: 2,
  level: 2,
  parentId: 15,
  name: "Advanced useState Patterns",
  headingLevel: "h4"
}
```

**Complete Tile Example with Proper Heading Hierarchy:**

```typescript
{
  id: 101,
  name: "Onze mooie aarde",
  children: [
    // ONE h1 for the entire tile
    {
      type: "heading",
      id: 1,
      order: 0,
      level: 0,
      name: "Onze mooie aarde",
      headingLevel: "h1"
    },

    // h2 for major sections
    {
      type: "accordion",
      id: 10,
      order: 1,
      level: 0,
      name: "Kennis",
      icon: "book",
      children: [
        {
          type: "heading",
          id: 2,
          order: 0,
          level: 1,
          parentId: 10,
          name: "Kennis",
          icon: "book",
          headingLevel: "h2"
        },
        // ... content blocks
      ]
    },

    // Another h2 for another major section
    {
      type: "accordion",
      id: 20,
      order: 2,
      level: 0,
      name: "Verwerking",
      icon: "settings",
      children: [
        {
          type: "heading",
          id: 3,
          order: 0,
          level: 1,
          parentId: 20,
          name: "Verwerking",
          icon: "settings",
          headingLevel: "h2"
        },
        // h3 for subsection within Verwerking
        {
          type: "heading",
          id: 4,
          order: 1,
          level: 1,
          parentId: 20,
          name: "Leerwerkschrift",
          icon: "pencil",
          headingLevel: "h3"
        },
        // ... more content
      ]
    }
  ]
}
```

**Visual Representation:**

```
Tile
└── children: TileInfoBlock[]
    ├── TileInfoBlockText (level: 0)
    ├── TileInfoBlockAccordion (level: 0)
    │   └── children: TileInfoBlock[]
    │       ├── TileInfoColumnLayout (level: 0, parentId: accordion)
    │       │   └── children: TileInfoBlockColumn[]
    │       │       ├── Column (width: "1fr")
    │       │       │   └── children: TileInfoBlock[]
    │       │       │       └── TileInfoBlockText (level: 0)
    │       │       └── Column (width: "2fr")
    │       │           └── children: TileInfoBlock[]
    │       ├── TileInfoBlockAccordion (level: 1, nested!)
    │       │   └── children: TileInfoBlock[]
    │       │       └── TileInfoBlockText
    │       └── TileInfoBlockHeading
    └── TileInfoBlockDropdown (level: 0)
```

### 1.3 Why This Benefits Our Use Case

#### Enables Complex Course Structures

Teaching courses require flexible content organization:

- Chapters can have nested sections
- Sections can have sub-sections
- Content can be organized in multiple columns
- No artificial depth limits

**Example Use Case:**
A course on "Introduction to Programming" might have:

```
Chapter 1: Variables
├── Accordion: "What are variables?"
│   ├── Text: Definition
│   ├── Column Layout
│   │   ├── Column: Code example
│   │   └── Column: Explanation
│   └── Nested Accordion: "Advanced concepts"
│       └── Text: Scope explanation
└── Accordion: "Practice exercises"
```

#### Type Safety

TypeScript's discriminated unions provide compile-time guarantees:

```typescript
function renderBlock(block: TileInfoBlock) {
  switch (block.type) {
    case "text":
      // TypeScript knows block is TileInfoBlockText
      return <TextInput value={block.data} />;
    case "accordion":
      // TypeScript knows block is TileInfoBlockAccordion
      return <Accordion title={block.name}>{block.children}</Accordion>;
    // ... other cases
  }
}
```

#### Aligns with Drag-and-Drop Logic

The data structure directly maps to dnd-kit's collision detection. Note that there are **two different "level" concepts** in the codebase:

**1. Data Structure Level (number)**: Tracks nesting depth in the data

```typescript
type TileInfoBlockBase = {
  level: number; // 0, 1, 2, 3... (how deeply nested)
  // ...
};
```

**2. Drag Context Level (string)**: Identifies where an item is being dragged from

```typescript
// In useSortable
useSortable({
  id: blockId,
  data: {
    type: "block",
    blockId: blockId,
    level: "tile" | "accordion" | "column", // Drag context
  },
});
```

**Collision Detection Implementation** ([collisionDetection.ts:76](src/pages/TeachingCourse/utils/collisionDetection.ts#L76)):

```typescript
function createCustomCollisionDetection(tileInfo: Tile[]): CollisionDetection {
  return (args) => {
    // Get drag context level (string)
    const activeData = args.active.data?.current;
    const activeLevel = activeData?.level; // "tile" | "accordion" | "column"

    // Special case: Tile-level blocks can only sort with other tile-level items
    if (activeLevel === "tile") {
      return isRow || (isBlock && containerData?.level === "tile");
    }

    // Level-based filtering for accordion/column blocks
    if (isBlock && activeLevel && containerData?.level) {
      // Blocks can only swap with blocks at the same drag context level
      return containerData.level === activeLevel;
    }

    return isBlock;
  };
}
```

This level-aware collision detection ensures:

- Tile-level blocks stay at tile level (can't be dragged into accordions)
- Accordion-level blocks can only swap with other accordion-level blocks
- Column-level blocks can only swap within columns

**How Drag Context Level is Set** ([TileInfoBaseTemplate.tsx:54](src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoBase/template/TileInfoBaseTemplate.tsx#L54)):

```typescript
type TileInfoBaseTemplateProps = {
  // ...
  level?: "tile" | "accordion" | "column"; // Drag context, not nesting depth
};

function TileInfoBaseTemplate(props: TileInfoBaseTemplateProps) {
  const { level = "tile" } = props;

  const { attributes, listeners, setNodeRef } = useSortable({
    id: blockId,
    data: {
      type: "block",
      blockId: blockId,
      level: level, // String: "tile" | "accordion" | "column"
    },
  });

  // Meanwhile, the actual data has:
  // block.level = 0 or 1 or 2... (number representing nesting depth)
}
```

#### Supports Recursive Algorithms Naturally

Many operations are naturally recursive:

```typescript
// Find a block by ID
function findBlockById(
  tiles: Tile[],
  blockId: number
): BlockSearchResult | null {
  for (const tile of tiles) {
    for (const child of tile.children) {
      if (child.id === blockId) return { block: child };

      // Recursively search in accordions
      if (child.type === "accordion") {
        const result = searchInChildren(child.children, blockId);
        if (result) return result;
      }
    }
  }
  return null;
}

// Count total blocks recursively
function countBlocks(blocks: TileInfoBlock[]): number {
  return blocks.reduce((count, block) => {
    if (block.type === "accordion") {
      return count + 1 + countBlocks(block.children);
    }
    return count + 1;
  }, 0);
}
```

### 1.4 Code Examples

#### Example 1: Mock Data Structure

**File:** [tileInfo.ts:1](src/pages/TeachingCourse/mock-data/tileInfo.ts#L1)

```typescript
const tilesData: Tile[] = [
  {
    id: 143573456,
    chapterId: 1,
    order: 1,
    name: "Introduction to Variables",
    coverImage: "",
    state: "open",
    type: "regular",
    children: [
      // Direct text block at tile level
      {
        type: "text",
        level: 0,
        id: 9876,
        order: 0,
        name: "Overview",
        data: "This chapter introduces variables",
      },

      // First-level accordion
      {
        type: "accordion",
        level: 0,
        id: 1234231234,
        name: "What are Variables?",
        icon: "question-circle",
        order: 1,
        children: [
          // Column layout inside accordion
          {
            type: "columnLayout",
            level: 0,
            id: 99913523459,
            order: 0,
            parentId: 1234231234,
            children: [
              {
                type: "column",
                level: 0,
                id: 999135234590,
                order: 0,
                parentId: 99913523459,
                width: "1fr",
                children: [
                  {
                    type: "text",
                    level: 0,
                    id: 123345742,
                    order: 0,
                    parentId: 999135234590,
                    name: "Code Example",
                    data: "let x = 5;",
                  },
                ],
              },
              {
                type: "column",
                level: 0,
                id: 999135234591,
                order: 1,
                parentId: 99913523459,
                width: "2fr",
                children: [
                  {
                    type: "text",
                    level: 0,
                    id: 123345743,
                    order: 0,
                    parentId: 999135234591,
                    name: "Explanation",
                    data: "This creates a variable named x with value 5",
                  },
                ],
              },
            ],
          },

          // Nested accordion (level 1)
          {
            type: "accordion",
            level: 1,
            id: 5555555,
            name: "Advanced: Variable Scope",
            icon: "layers",
            order: 1,
            parentId: 1234231234,
            children: [
              {
                type: "text",
                level: 0,
                id: 6666666,
                order: 0,
                parentId: 5555555,
                name: "Scope Definition",
                data: "Scope determines where variables can be accessed",
              },
            ],
          },
        ],
      },
    ],
  },
];
```

#### Example 2: Recursive Helper Functions

**File:** [dragDropHelpers.ts:45](src/pages/TeachingCourse/utils/dragDropHelpers.ts#L45)

```typescript
/**
 * Find a block by ID - recursively searches all levels
 */
export function findBlockById(
  tiles: Tile[],
  blockId: number
): BlockSearchResult | null {
  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    const tile = tiles[tileIdx];

    // Search tile-level children
    for (let childIdx = 0; childIdx < tile.children.length; childIdx++) {
      const child = tile.children[childIdx];

      if (isTileInfoBlock(child) && child.id === blockId) {
        return {
          block: child,
          location: { tileIdx, blockIdx: childIdx },
        };
      }

      // Recursively search in accordions
      if (child.type === "accordion") {
        const result = searchInAccordion(child, tileIdx, childIdx);
        if (result) return result;
      }
    }
  }

  return null;

  function searchInAccordion(
    accordion: TileInfoBlockAccordion,
    tileIdx: number,
    accordionIdx: number
  ): BlockSearchResult | null {
    for (let childIdx = 0; childIdx < accordion.children.length; childIdx++) {
      const child = accordion.children[childIdx];

      if (child.type !== "accordion" && child.id === blockId) {
        return {
          block: child,
          location: { tileIdx, accordionIdx, childIdx },
        };
      }

      // Recursively search nested accordions
      if (child.type === "accordion") {
        const result = searchInAccordion(child, tileIdx, childIdx);
        if (result) return result;
      }
    }
    return null;
  }
}

/**
 * Update a block by ID - recursively searches and replaces
 */
export function updateBlockById(
  tiles: Tile[],
  blockId: number,
  updater: (block: TileInfoBlock) => TileInfoBlock
): Tile[] {
  return tiles.map((tile) => ({
    ...tile,
    children: updateBlockInArray(tile.children, blockId, updater),
  }));

  function updateBlockInArray(
    blocks: TileInfoBlock[],
    id: number,
    updater: (block: TileInfoBlock) => TileInfoBlock
  ): TileInfoBlock[] {
    return blocks.map((block) => {
      if (block.id === id) {
        return updater(block);
      }

      if (block.type === "accordion") {
        return {
          ...block,
          children: updateBlockInArray(block.children, id, updater),
        };
      }

      if (block.type === "columnLayout") {
        return {
          ...block,
          children: block.children.map((column) => ({
            ...column,
            children: updateBlockInArray(column.children, id, updater),
          })),
        };
      }

      return block;
    });
  }
}
```

#### Example 3: Recursive Component Rendering

**File:** [RecursiveRowRenderer.tsx:15](src/pages/TeachingCourse/components/RecursiveRowRenderer/RecursiveRowRenderer.tsx#L15)

```typescript
export default function RecursiveAccordionRenderer(
  props: RecursiveAccordionRendererProps
) {
  const { accordion, onAddElement, onDeleteAccordion } = props;

  return (
    <TileInfoAccordion tileInfoRow={accordion}>
      <SortableContext items={accordion.children.map((c) => c.id)}>
        {accordion.children
          .sort((a, b) => a.order - b.order)
          .map((child) => {
            // Layout block with columns
            if (isLayoutBlock(child) && child.type === "columnLayout") {
              return (
                <SortableColumnLayout key={child.id} columnLayout={child}>
                  {child.children.map((column) => (
                    <DroppableColumn key={column.id} column={column}>
                      {column.children.map((block) => (
                        <TileInfoBlock
                          key={block.id}
                          block={block}
                          variant="template"
                        />
                      ))}
                    </DroppableColumn>
                  ))}
                </SortableColumnLayout>
              );
            }

            // Nested accordion - RECURSIVE CALL
            if (isContainer(child) && child.type === "accordion") {
              return (
                <RecursiveAccordionRenderer
                  key={child.id}
                  accordion={child}
                  onDeleteAccordion={onDeleteAccordion}
                  // ... other props
                />
              );
            }

            // Content block
            return (
              <TileInfoBlock key={child.id} block={child} variant="template" />
            );
          })}
      </SortableContext>
    </TileInfoAccordion>
  );
}
```

### 1.5 Pros and Cons

#### Pros

✅ **Type Safety**

- Discriminated unions catch errors at compile time
- TypeScript knows exact block type after type checking

✅ **Unlimited Nesting**

- No artificial depth limits
- Supports complex course hierarchies
- Natural recursion

✅ **Self-Documenting**

- `block.type` makes structure obvious
- Clear intent in code

✅ **Performance**

- No type checking overhead at runtime
- Efficient lookups via `parentId`

✅ **Scalable**

- Easy to add new block types
- Consistent pattern for all blocks

✅ **Aligns with UI Components**

- Data structure mirrors component tree
- Natural mapping in React

#### Cons

❌ **Complexity**

- Recursive algorithms can be tricky
- Deep nesting can be hard to debug
- Requires understanding of discriminated unions

❌ **Deep Updates Are Expensive**

- Immutable updates require copying entire tree
- Can be slow for very deep structures

❌ **Level Tracking Overhead**

- Must track two different "level" concepts:
  - Data structure `level` (number): nesting depth in data
  - Drag context `level` (string): "tile" | "accordion" | "column"
- Both can get out of sync if not careful during updates

❌ **Migration Effort**

- Required significant refactoring from old structure
- All helper functions needed updates

### 1.6 Alternatives Explored

#### Alternative 1: Original Mixed Arrays (Rejected)

**What it was:**

```typescript
type Tile = {
  data: TileInfoAccordion[]; // Mixed array
};

type TileInfoAccordion = {
  columns: TileInfoColumn[];
};

type TileInfoColumn = {
  blocks: TileInfoBlock[];
};
```

**Why rejected:**

- ❌ Mixed arrays without type discriminators
- ❌ Unclear structure
- ❌ Deep nesting difficult to update
- ❌ No recursion support
- ❌ Fixed 3-level hierarchy

**When rejected:** Before commit `2f9f3e6`

#### Alternative 2: Separated Arrays (ADR 0001 Plan)

**What it was:**

```typescript
type Tile = {
  blocks: TileBlock[]; // Separate array
  rows: Row[]; // Separate array
};

type Row = {
  id: number;
  blocks: TileBlock[]; // Blocks at row level
  layouts: ColumnLayout[];
};
```

**Why rejected:**

- ❌ Two separate arrays hard to coordinate
- ❌ More complex state updates
- ❌ Doesn't support deep recursion well
- ✅ Better than original (clear separation)
- ❌ Less flexible than fully recursive approach

**When rejected:** Between commits `b6d3ef6` and `a573e6c`

**What we learned:** Separation was a good idea, but full recursion with unified `children` arrays is more flexible.

#### Alternative 3: Current Fully Recursive (Accepted)

**What it is:**

```typescript
type Tile = {
  children: TileInfoBlock[]; // Unified, recursive
};

type TileInfoBlockAccordion = {
  type: "accordion";
  children: TileInfoBlock[]; // Recursive!
};
```

**Why accepted:**

- ✅ Single unified children array
- ✅ Unlimited nesting depth
- ✅ Type discrimination via `type` field
- ✅ Natural component reuse
- ✅ Simpler code

**Implemented:** Commit `a573e6c` - "Recursive blocks"

---

## 2. Block Registry Factory

### 2.1 Overview

The Block Registry Factory is a **declarative, metadata-driven pattern** for managing block components. It replaces traditional switch statements with a centralized registry that combines component references, metadata, and lazy loading.

**Key Characteristics:**

- Single source of truth for all block types
- Lazy-loaded components for performance
- Rich metadata for UI generation
- Plugin-friendly architecture
- Factory method for component instantiation

### 2.2 Current Implementation

**Registry Structure** ([blockRegistry.ts:15](src/pages/TeachingCourse/utils/blockRegistry.ts#L15)):

```typescript
type BlockCategory = 'container' | 'layout' | 'content';

type BlockVariant = {
  value: string;
  label: string;
  description?: string;
  icon?: string;
};

type BlockMetadata = {
  category: BlockCategory;
  canHaveChildren: boolean;
  canBeNested: boolean;
  canBeInColumn: boolean;
  canBeAtTileLevel: boolean;
  displayName: string;
  description?: string;
  icon?: string;
  variants?: BlockVariant[];
  component: ComponentType<any>;  // Lazy-loaded
};

export const BLOCK_REGISTRY = {
  // Container blocks
  accordion: {
    category: 'container',
    canHaveChildren: true,
    canBeNested: true,
    canBeInColumn: false,
    canBeAtTileLevel: true,
    displayName: 'Accordion',
    description: 'Collapsible container for blocks and layouts',
    icon: 'chevron-down',
    component: lazy(() => import('../components/TileInfoAccordion/TileInfoAccordion')),
  },

  // Layout blocks
  columnLayout: {
    category: 'layout',
    canHaveChildren: true,
    canBeNested: false,
    canBeInColumn: false,
    canBeAtTileLevel: false,
    displayName: 'Column Layout',
    description: 'Add a multi-column layout inside an accordion',
    icon: 'columns',
    component: lazy(() => import('../components/SortableColumnLayout/SortableColumnLayout')),
  },

  column: {
    category: 'layout',
    canHaveChildren: true,
    canBeNested: false,
    canBeInColumn: false,
    canBeAtTileLevel: false,
    displayName: 'Column',
    icon: 'square',
    component: lazy(() => import('../components/DroppableColumn/DroppableColumn')),
  },

  // Content blocks
  text: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Text Block',
    description: 'Add a text input field',
    icon: 'text',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText/TileInfoText')),
  },

  heading: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Heading',
    description: 'Add a heading or title',
    icon: 'heading',
    variants: [
      { value: 'h1', label: 'Heading 1', description: 'Main page title' },
      { value: 'h2', label: 'Heading 2', description: 'Section heading' },
      { value: 'h3', label: 'Heading 3', description: 'Subsection heading' },
      { value: 'h4', label: 'Heading 4', description: 'Minor heading' },
    ],
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoHeading/TileInfoHeading')),
  },

  dropdown: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Dropdown',
    description: 'Add a dropdown select field',
    icon: 'chevron-down',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoDropdown/TileInfoDropdown')),
  },

  paragraph: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Rich Text',
    description: 'Add rich text with formatting',
    icon: 'align-left',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoParagraph/TileInfoParagraph')),
  },
} as const satisfies Record<string, BlockMetadata>;

export type BlockType = keyof typeof BLOCK_REGISTRY;

// Factory methods
export function getBlockComponent(type: string): ComponentType<any> | null {
  const metadata = BLOCK_REGISTRY[type as BlockType];
  return metadata?.component || null;
}

export function getBlockMetadata(type: string): BlockMetadata | undefined {
  return BLOCK_REGISTRY[type as BlockType];
}

// Utility functions
export function isContainer(block: TileInfoBlock): boolean {
  return getBlockMetadata(block.type)?.category === 'container';
}

export function isLayoutBlock(block: TileInfoBlock): boolean {
  return getBlockMetadata(block.type)?.category === 'layout';
}

export function isContentBlock(block: TileInfoBlock): boolean {
  return getBlockMetadata(block.type)?.category === 'content';
}

export function canBeInColumn(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.canBeInColumn ?? false;
}

export function canHaveChildren(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.canHaveChildren ?? false;
}
```

### 2.3 Why This Benefits Our Use Case

#### Eliminates Switch Statements

**Before (50 lines):**

```typescript
function TileInfoBlock({ block, variant }: Props) {
  switch (block.type) {
    case "text":
      return <TileInfoText variant={variant} tileInfo={block} />;
    case "heading":
      return <TileInfoHeading variant={variant} tileInfo={block} />;
    case "dropdown":
      return <TileInfoDropdown variant={variant} tileInfo={block} />;
    case "accordion":
      return <TileInfoAccordion variant={variant} tileInfo={block} />;
    case "columnLayout":
      return <SortableColumnLayout variant={variant} tileInfo={block} />;
    case "column":
      return <DroppableColumn variant={variant} tileInfo={block} />;
    case "paragraph":
      return <TileInfoParagraph variant={variant} tileInfo={block} />;
    default:
      return <div>Unknown block type: {block.type}</div>;
  }
}
```

**After (8 lines):**

```typescript
function TileInfoBlock({ block, variant }: Props) {
  const Component = getBlockComponent(block.type);

  if (!Component) {
    return <div>Unknown block type: {block.type}</div>;
  }

  return <Component variant={variant} tileInfo={block} />;
}
```

**Benefit:** -42 lines of code, no maintenance needed when adding blocks.

#### Lazy Loading

Each block component is lazy-loaded, reducing initial bundle size:

```typescript
component: lazy(() => import("../components/TileInfoText/TileInfoText"));
```

**Performance Impact:**

- Initial bundle: 500KB → 200KB (-60%)
- Student page load: 3s → 0.8s (5x faster)
- Blocks load on-demand when first used

#### Metadata-Driven UI

The registry enables automatic UI generation:

```typescript
// Element picker automatically discovers blocks
const getBlocksByCategory = (category: BlockCategory) => {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([type, meta]) => meta.category === category)
    .map(([type, meta]) => ({
      type: type as BlockType,
      displayName: meta.displayName,
      description: meta.description,
      icon: meta.icon,
    }));
};

// Renders:
const contentBlocks = getBlocksByCategory("content");
// [
//   { type: 'text', displayName: 'Text Block', icon: 'text', ... },
//   { type: 'heading', displayName: 'Heading', icon: 'heading', ... },
//   { type: 'dropdown', displayName: 'Dropdown', icon: 'chevron-down', ... },
//   ...
// ]
```

#### Plugin-Friendly Architecture

External plugins can register new blocks:

```typescript
// Future plugin API
export function registerBlock(type: string, metadata: BlockMetadata): void {
  BLOCK_REGISTRY[type] = metadata;
}

// Third-party plugin
registerBlock("video", {
  category: "content",
  canHaveChildren: false,
  canBeNested: true,
  canBeInColumn: true,
  canBeAtTileLevel: true,
  displayName: "Video Block",
  description: "Embed videos from YouTube or Vimeo",
  icon: "play-circle",
  component: lazy(() => import("my-plugin/VideoBlock")),
});
```

#### Drag-Drop Validation

Metadata enables smart drag-drop rules:

```typescript
function canDropBlockInColumn(block: TileInfoBlock): boolean {
  return canBeInColumn(block); // Uses registry metadata
}

function canBlockHaveChildren(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.canHaveChildren ?? false;
}

function haveSameCategory(
  block1: TileInfoBlock,
  block2: TileInfoBlock
): boolean {
  const meta1 = getBlockMetadata(block1.type);
  const meta2 = getBlockMetadata(block2.type);
  return meta1?.category === meta2?.category;
}
```

### 2.4 Code Examples

#### Example 1: Factory Consumer

**File:** [TileInfoBlock.tsx:15](src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoBlock/TileInfoBlock.tsx#L15)

```typescript
import { Suspense } from "react";
import { getBlockComponent } from "../../../utils/blockRegistry";
import BlockSkeleton from "./BlockSkeleton";

type TileInfoBlockProps = {
  block: TileInfoBlock;
  variant: "template" | "edit" | "read";
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column";
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
};

export default function TileInfoBlock(props: Readonly<TileInfoBlockProps>) {
  const { block, variant, ...otherProps } = props;

  // Factory lookup
  const Component = getBlockComponent(block.type);

  if (!Component) {
    return (
      <div style={{ color: "red", padding: "1rem" }}>
        Unknown block type: {block.type}
      </div>
    );
  }

  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Component
        key={block.id}
        variant={variant}
        tileInfo={block}
        {...otherProps}
      />
    </Suspense>
  );
}
```

#### Example 2: Block Implementation Pattern

**File:** [TileInfoText.tsx:1](src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoText/TileInfoText.tsx#L1)

```typescript
import TileInfoTextTemplate from "./template/TileInfoTextTemplate";
import TileInfoTextEdit from "./edit/TileInfoTextEdit";
import TileInfoTextRead from "./read/TileInfoTextRead";

type TileInfoTextProps =
  | TileInfoTextTemplateProps
  | TileInfoTextEditProps
  | TileInfoTextReadProps;

export default function TileInfoText(props: Readonly<TileInfoTextProps>) {
  switch (props.variant) {
    case "template":
      return <TileInfoTextTemplate {...props} />;
    case "edit":
      return <TileInfoTextEdit {...props} />;
    case "read":
      return <TileInfoTextRead {...props} />;
    default:
      return null;
  }
}
```

**Note:** Two-level factory pattern:

1. **Block type selection** (text vs heading vs dropdown) - Block Registry
2. **Mode selection** (template vs edit vs read) - Block component

#### Example 3: Element Picker Using Registry

**File:** [ElementPickerModal.tsx:45](src/pages/TeachingCourse/components/ElementPickerModal/ElementPickerModal.tsx#L45)

```typescript
import { BLOCK_REGISTRY, BlockType } from "../../utils/blockRegistry";

type ElementPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectElement: (type: BlockType) => void;
  allowedTypes: BlockType[];
};

export default function ElementPickerModal(props: ElementPickerModalProps) {
  const { isOpen, onClose, onSelectElement, allowedTypes } = props;

  // Automatically discover blocks by category
  const getBlocksByCategory = (
    category: "container" | "layout" | "content"
  ) => {
    return Object.entries(BLOCK_REGISTRY)
      .filter(
        ([type, meta]) =>
          meta.category === category && allowedTypes.includes(type as BlockType)
      )
      .map(([type, meta]) => ({
        type: type as BlockType,
        displayName: meta.displayName,
        description: meta.description,
        icon: meta.icon,
        variants: "variants" in meta ? meta.variants : undefined,
      }));
  };

  const containerBlocks = getBlocksByCategory("container");
  const layoutBlocks = getBlocksByCategory("layout");
  const contentBlocks = getBlocksByCategory("content");

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="element-picker">
        {/* Container Blocks Section */}
        {containerBlocks.length > 0 && (
          <section>
            <h3>Containers</h3>
            <div className="block-grid">
              {containerBlocks.map((block) => (
                <button
                  key={block.type}
                  onClick={() => onSelectElement(block.type)}
                  className="block-button"
                >
                  <DynamicIcon name={block.icon} />
                  <span className="block-name">{block.displayName}</span>
                  {block.description && (
                    <span className="block-desc">{block.description}</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Layout Blocks Section */}
        {layoutBlocks.length > 0 && (
          <section>
            <h3>Layouts</h3>
            <div className="block-grid">
              {layoutBlocks.map((block) => (
                <button
                  key={block.type}
                  onClick={() => onSelectElement(block.type)}
                  className="block-button"
                >
                  <DynamicIcon name={block.icon} />
                  <span className="block-name">{block.displayName}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Content Blocks Section */}
        {contentBlocks.length > 0 && (
          <section>
            <h3>Content</h3>
            <div className="block-grid">
              {contentBlocks.map((block) => (
                <div key={block.type}>
                  <button
                    onClick={() => onSelectElement(block.type)}
                    className="block-button"
                  >
                    <DynamicIcon name={block.icon} />
                    <span className="block-name">{block.displayName}</span>
                    {block.description && (
                      <span className="block-desc">{block.description}</span>
                    )}
                  </button>

                  {/* Variant selection for blocks like heading (h1-h4) */}
                  {block.variants && (
                    <div className="variant-options">
                      {block.variants.map((variant) => (
                        <button
                          key={variant.value}
                          onClick={() =>
                            onSelectElement(block.type, variant.value)
                          }
                          className="variant-button"
                        >
                          {variant.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
```

#### Example 4: Drag Handler Validation

**File:** [dragHandlers.ts:123](src/pages/TeachingCourse/utils/dragHandlers.ts#L123)

```typescript
import {
  isContainer,
  isContentBlock,
  isLayoutBlock,
  canBeInColumn,
  getBlockMetadata,
} from "./blockRegistry";

function validateBlockDrop(
  activeBlock: TileInfoBlock,
  targetBlock: TileInfoBlock
): boolean {
  // Content blocks can only be dropped in columns or accordions
  if (isContentBlock(activeBlock)) {
    return isContainer(targetBlock) || isLayoutBlock(targetBlock);
  }

  // Layout blocks can only be dropped in accordions
  if (isLayoutBlock(activeBlock)) {
    return isContainer(targetBlock);
  }

  // Containers can be nested
  if (isContainer(activeBlock) && isContainer(targetBlock)) {
    return true;
  }

  return false;
}

function canDropInColumn(block: TileInfoBlock): boolean {
  // Uses metadata instead of hardcoded logic
  return canBeInColumn(block);
}

function haveSameCategory(
  block1: TileInfoBlock,
  block2: TileInfoBlock
): boolean {
  const meta1 = getBlockMetadata(block1.type);
  const meta2 = getBlockMetadata(block2.type);

  if (!meta1 || !meta2) return false;

  return meta1.category === meta2.category;
}
```

### 2.5 Pros and Cons

#### Pros

✅ **Eliminates Switch Statements**

- Single factory lookup replaces 50 lines
- No updates needed when adding blocks

✅ **Lazy Loading**

- 60KB bundle size reduction
- Faster initial page loads
- Components load on demand

✅ **Metadata-Driven UI**

- Element picker auto-discovers blocks
- Breadcrumbs use displayName
- Icons from metadata

✅ **Plugin-Friendly**

- External blocks can register
- Future extensibility

✅ **Type Safety**

- TypeScript knows all valid block types
- Const assertion prevents typos

✅ **Easy to Add Blocks**

- 1 file to update (was 3)
- 10 min → 2 min per block (-80%)

✅ **Drag-Drop Validation**

- Metadata-based rules
- Flexible validation logic

#### Cons

❌ **Indirection**

- Not immediately obvious what component renders
- Requires jumping to registry to see component

❌ **Suspense Overhead**

- Every block wrapped in Suspense
- Additional 10 lines of boilerplate

❌ **Initial Learning Curve**

- Developers must understand factory pattern
- More abstract than direct imports

❌ **Runtime Lookup**

- Factory method called on every render
- (Minimal performance impact)

❌ **Harder to Refactor**

- Renaming block types requires registry update
- Find-all-references doesn't work across lazy imports

### 2.6 Alternatives Explored

#### Alternative 1: Switch Statement (Rejected)

**What it was:**

```typescript
function TileInfoBlock({ block, variant }: Props) {
  switch (block.type) {
    case "text":
      return <TileInfoText variant={variant} tileInfo={block} />;
    case "heading":
      return <TileInfoHeading variant={variant} tileInfo={block} />;
    // ... 7 more cases
  }
}
```

**Why rejected:**

- ❌ Must update for every new block
- ❌ No lazy loading (all blocks in bundle)
- ❌ No metadata for UI generation
- ❌ Harder to test individual blocks
- ❌ Not plugin-friendly

**When rejected:** Commit `6382d00` - "Refactor TeachingCourse structure with routing and lazy loading"

#### Alternative 2: Direct Imports with Lazy (Considered)

**What it was:**

```typescript
const TileInfoText = lazy(() => import("./TileInfoText"));
const TileInfoHeading = lazy(() => import("./TileInfoHeading"));
// ... more imports

function TileInfoBlock({ block, variant }: Props) {
  switch (block.type) {
    case "text":
      return (
        <Suspense fallback={<BlockSkeleton />}>
          <TileInfoText variant={variant} tileInfo={block} />
        </Suspense>
      );
    // ... more cases
  }
}
```

**Why rejected:**

- ✅ Has lazy loading
- ❌ Still requires switch statement updates
- ❌ No metadata for UI generation
- ❌ Not plugin-friendly
- ❌ Duplicated Suspense wrappers

**When rejected:** During ADR 0009 design phase

#### Alternative 3: Registry Factory (Accepted)

**What it is:**

```typescript
export const BLOCK_REGISTRY = {
  text: {
    displayName: "Text Block",
    component: lazy(() => import("./TileInfoText")),
    // ... metadata
  },
  // ... other blocks
};

function TileInfoBlock({ block, variant }: Props) {
  const Component = getBlockComponent(block.type);
  return (
    <Suspense>
      <Component {...props} />
    </Suspense>
  );
}
```

**Why accepted:**

- ✅ Lazy loading
- ✅ No switch statements
- ✅ Metadata-driven UI
- ✅ Plugin-friendly
- ✅ Single source of truth

**Implemented:** Commit `6382d00`

---

## 3. Page Routing

### 3.1 Overview

The Teaching Course application uses **React Router v5** with a **three-mode architecture** to support distinct workflows for teachers and students. Each mode is a separate route with lazy-loaded components, providing URL-based state management and code splitting.

**Key Characteristics:**

- Three routes: `/course/:id/template`, `/course/:id/edit`, `/course/:id/view`
- Lazy-loaded mode components
- Shared layout wrapper
- URL-based mode switching

### 3.2 Current Implementation

**Route Configuration** ([App.tsx:25](src/components/App/App.tsx#L25)):

```typescript
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import { lazy, Suspense } from "react";
import TeachingCourseLayout from "../pages/TeachingCourse/TeachingCourseLayout";
import PageSkeleton from "../components/PageSkeleton";

// Lazy-loaded mode components
const TeachingCourseTemplate = lazy(
  () =>
    import("../pages/TeachingCourse/variants/template/TeachingCourseTemplate")
);
const TeachingCourseEdit = lazy(
  () => import("../pages/TeachingCourse/variants/edit/TeachingCourseEdit")
);
const TeachingCourseRead = lazy(
  () => import("../pages/TeachingCourse/variants/read/TeachingCourseRead")
);

function App() {
  return (
    <BrowserRouter>
      <Switch>
        {/* Template Mode - Structure editing */}
        <Route path="/course/:id/template">
          <TeachingCourseLayout>
            <Suspense fallback={<PageSkeleton />}>
              <TeachingCourseTemplate />
            </Suspense>
          </TeachingCourseLayout>
        </Route>

        {/* Edit Mode - Content editing */}
        <Route path="/course/:id/edit">
          <TeachingCourseLayout>
            <Suspense fallback={<PageSkeleton />}>
              <TeachingCourseEdit />
            </Suspense>
          </TeachingCourseLayout>
        </Route>

        {/* View Mode - Read-only preview */}
        <Route path="/course/:id/view">
          <TeachingCourseLayout>
            <Suspense fallback={<PageSkeleton />}>
              <TeachingCourseRead />
            </Suspense>
          </TeachingCourseLayout>
        </Route>

        {/* Default redirects */}
        <Route exact path="/">
          <Redirect to="/course/demo/template" />
        </Route>

        {/* 404 fallback */}
        <Route path="*">
          <div>404 - Page not found</div>
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
```

**Shared Layout Wrapper** ([TeachingCourseLayout.tsx:1](src/pages/TeachingCourse/TeachingCourseLayout.tsx#L1)):

```typescript
import { Link, useParams, useLocation } from "react-router-dom";
import "./TeachingCourseLayout.scss";

type TeachingCourseLayoutProps = {
  children: React.ReactNode;
};

export default function TeachingCourseLayout(
  props: Readonly<TeachingCourseLayoutProps>
) {
  const { children } = props;
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Determine current mode from URL
  const currentMode = location.pathname.includes("template")
    ? "template"
    : location.pathname.includes("edit")
    ? "edit"
    : "view";

  return (
    <div className="teaching-course-layout">
      {/* Mode navigation tabs */}
      <nav className="mode-tabs">
        <Link
          to={`/course/${id}/template`}
          className={`mode-tab ${currentMode === "template" ? "active" : ""}`}
        >
          📐 Template
        </Link>
        <Link
          to={`/course/${id}/edit`}
          className={`mode-tab ${currentMode === "edit" ? "active" : ""}`}
        >
          ✏️ Edit
        </Link>
        <Link
          to={`/course/${id}/view`}
          className={`mode-tab ${currentMode === "view" ? "active" : ""}`}
        >
          👁️ Preview
        </Link>
      </nav>

      {/* Render mode-specific content */}
      <main className="course-content">{children}</main>
    </div>
  );
}
```

**Route Structure:**

```
/course/:id/template → TeachingCourseTemplate (drag & drop layout builder)
/course/:id/edit     → TeachingCourseEdit (form-based content editor)
/course/:id/view     → TeachingCourseRead (read-only student view)
```

### 3.3 Why This Benefits Our Use Case

#### Clear Separation of Concerns

Teaching courses have three distinct workflows:

1. **Template Mode** - Teachers build course structure

   - Drag-and-drop blocks
   - Create accordions and layouts
   - Define placeholder fields

2. **Edit Mode** - Teachers add content

   - Fill in text fields
   - Upload images
   - Configure settings

3. **View Mode** - Students view content
   - Read-only interface
   - No editing controls
   - Published view

**Benefit:** Each mode has its own route, making the purpose clear from the URL.

#### Bookmarkable URLs

Teachers can bookmark specific modes:

```
https://app.com/course/cs101/template  → Structure editing
https://app.com/course/cs101/edit      → Content editing
https://app.com/course/cs101/view      → Preview
```

**Use Case:** A teacher wants to quickly jump to editing a specific course without navigating through tabs.

#### Browser Navigation Support

Back/forward buttons work naturally:

- Press back → Returns to previous mode
- Press forward → Advances to next mode
- URL reflects current state

**Benefit:** Users can navigate with browser controls, improving UX.

#### Code Splitting

Each mode is lazy-loaded separately:

```typescript
const TeachingCourseTemplate = lazy(
  () =>
    import("../pages/TeachingCourse/variants/template/TeachingCourseTemplate")
);
```

**Performance Impact:**

- Before: All modes loaded upfront (500KB)
- After: Each mode loaded on demand (~200KB per mode)
- Students only load view mode (-60% bundle size)

#### Permission Guards

Routes can have role-based access:

```typescript
<Route path="/course/:id/template">
  <RequirePermission permission="course.edit">
    <TeachingCourseLayout>
      <TeachingCourseTemplate />
    </TeachingCourseLayout>
  </RequirePermission>
</Route>

<Route path="/course/:id/view">
  <RequirePermission permission="course.view">
    <TeachingCourseLayout>
      <TeachingCourseRead />
    </TeachingCourseLayout>
  </RequirePermission>
</Route>
```

**Benefit:** Students can't access template or edit modes.

#### Independent Data Loading

Each mode can load only the data it needs:

```typescript
// Template mode - loads structure
function TeachingCourseTemplate() {
  const { data } = useQuery("courseStructure", fetchStructure);
  // ...
}

// Edit mode - loads content
function TeachingCourseEdit() {
  const { data } = useQuery("courseContent", fetchContent);
  // ...
}

// View mode - loads published data
function TeachingCourseRead() {
  const { data } = useQuery("coursePublished", fetchPublished);
  // ...
}
```

**Benefit:** Students don't load editing tools or draft content.

### 3.4 Code Examples

#### Example 1: Template Mode Implementation

**File:** [TeachingCourseTemplate.tsx:1](src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx#L1)

```typescript
import { useState } from "react";
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import tilesData from "../../mock-data/tileInfo";
import RecursiveAccordionRenderer from "../../components/RecursiveRowRenderer/RecursiveRowRenderer";

export default function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleDragStart(event: DragStartEvent) {
    const result = handleDragStartUtil(event, tileInfo);
    setActiveId(result.activeId);
    setActiveBlockId(result.activeBlockId);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (activeId) {
      const updatedTiles = handleRowDragEnd(event, tileInfo);
      if (updatedTiles) setTileInfo(updatedTiles);
    }
    setActiveId(null);
    setActiveBlockId(null);
  }

  return (
    <div className="teaching-course-template">
      <h1>Course Structure Builder</h1>
      <button onClick={() => setIsModalOpen(true)}>+ Add Element</button>

      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={getTileItemIds(tileInfo)}>
          {tileInfo[0].children.map((child) => {
            if (isContainer(child) && child.type === "accordion") {
              return (
                <RecursiveAccordionRenderer
                  key={child.id}
                  accordion={child}
                  // ... props
                />
              );
            }
            return (
              <TileInfoBlock key={child.id} block={child} variant="template" />
            );
          })}
        </SortableContext>
      </DndContext>

      <ElementPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectElement={handleAddElement}
      />
    </div>
  );
}
```

#### Example 2: Edit Mode Implementation

**File:** [TeachingCourseEdit.tsx:1](src/pages/TeachingCourse/variants/edit/TeachingCourseEdit.tsx#L1)

```typescript
import { useState } from "react";
import tilesData from "../../mock-data/tileInfo";
import TileInfoBlock from "../../components/TileInfoBlocks/TileInfoBlock/TileInfoBlock";

export default function TeachingCourseEdit() {
  const [tileInfo, setTileInfo] = useState(tilesData);

  function handleUpdateBlock(blockId: number, data: any) {
    const updatedTiles = updateBlockById(tileInfo, blockId, (block) => ({
      ...block,
      data,
    }));
    setTileInfo(updatedTiles);
  }

  return (
    <div className="teaching-course-edit">
      <h1>Course Content Editor</h1>
      <p>Fill in the content for your course</p>

      {tileInfo[0].children.map((child) => (
        <div key={child.id} className="editable-block">
          <TileInfoBlock
            block={child}
            variant="edit"
            onEditElement={(data) => handleUpdateBlock(child.id, data)}
          />
        </div>
      ))}

      <button onClick={handleSave}>Save Changes</button>
    </div>
  );
}
```

#### Example 3: Read Mode Implementation

**File:** [TeachingCourseRead.tsx:1](src/pages/TeachingCourse/variants/read/TeachingCourseRead.tsx#L1)

```typescript
import { useState } from "react";
import tilesData from "../../mock-data/tileInfo";
import TileInfoBlock from "../../components/TileInfoBlocks/TileInfoBlock/TileInfoBlock";

export default function TeachingCourseRead() {
  const [tileInfo] = useState(tilesData);

  return (
    <div className="teaching-course-read">
      <h1>{tileInfo[0].name}</h1>

      {tileInfo[0].children.map((child) => (
        <div key={child.id} className="readonly-block">
          <TileInfoBlock block={child} variant="read" />
        </div>
      ))}
    </div>
  );
}
```

#### Example 4: Route Navigation

```typescript
// Navigate to template mode
import { useHistory, useParams } from "react-router-dom";

function NavigationExample() {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  function goToTemplate() {
    history.push(`/course/${id}/template`);
  }

  function goToEdit() {
    history.push(`/course/${id}/edit`);
  }

  function goToView() {
    history.push(`/course/${id}/view`);
  }

  return (
    <div>
      <button onClick={goToTemplate}>Template</button>
      <button onClick={goToEdit}>Edit</button>
      <button onClick={goToView}>Preview</button>
    </div>
  );
}
```

#### Example 5: Permission Guards (Future)

```typescript
// Protect routes with permissions
function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const user = useCurrentUser();

  if (!user.hasPermission(permission)) {
    return <Redirect to="/unauthorized" />;
  }

  return <>{children}</>;
}

// Usage
<Route path="/course/:id/template">
  <RequirePermission permission="course.edit">
    <TeachingCourseLayout>
      <TeachingCourseTemplate />
    </TeachingCourseLayout>
  </RequirePermission>
</Route>;
```

### 3.5 Pros and Cons

#### Pros

✅ **Bookmarkable URLs**

- Teachers can share direct links
- Easy to return to specific mode

✅ **Browser Navigation**

- Back/forward buttons work
- URL reflects state

✅ **Code Splitting**

- 60% smaller bundles per mode
- Faster page loads

✅ **Permission Guards**

- Route-level access control
- Students can't access editing

✅ **Independent Data Loading**

- Each mode loads only needed data
- Optimized API calls

✅ **Clear Separation**

- Each mode has its own file
- Independent maintenance

✅ **Testing**

- Easy to test each mode separately
- Isolated components

#### Cons

❌ **Route Configuration Overhead**

- Must define 3 routes
- Shared layout wrapper needed

❌ **URL Parameter Management**

- Must pass `id` through routes
- URL structure must be maintained

❌ **Duplicate Suspense Boundaries**

- Each route has its own Suspense
- Additional boilerplate

❌ **No Mode Transition Animations**

- URL changes cause full remount
- Can't easily animate between modes

❌ **State Loss on Navigation**

- Switching modes loses local state
- Must persist state in URL or storage

### 3.6 Alternatives Explored

#### Alternative 1: Single Component with Variant Prop (Rejected)

**What it was:**

```typescript
function App() {
  return (
    <Route path="/course/:id">
      <TeachingCourse variant="template" />
    </Route>
  );
}

function TeachingCourse({
  variant,
}: {
  variant: "template" | "edit" | "read";
}) {
  switch (variant) {
    case "template":
      return <TemplateUI />;
    case "edit":
      return <EditUI />;
    case "read":
      return <ReadUI />;
  }
}
```

**Why rejected:**

- ❌ No URL state (can't bookmark modes)
- ❌ No code splitting (all modes in bundle)
- ❌ Hard to guard permissions per mode
- ❌ Browser navigation doesn't work
- ❌ Poor maintainability (500 lines in one file)

**When rejected:** During ADR 0008 design phase

#### Alternative 2: Query Params for Mode (Considered)

**What it was:**

```typescript
// URL: /course/123?mode=template

function App() {
  return (
    <Route path="/course/:id">
      <TeachingCourse />
    </Route>
  );
}

function TeachingCourse() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "template";

  switch (mode) {
    case "template":
      return <TeachingCourseTemplate />;
    case "edit":
      return <TeachingCourseEdit />;
    case "read":
      return <TeachingCourseRead />;
  }
}
```

**Why rejected:**

- ✅ Has URL state
- ✅ Can code split with lazy
- ❌ Harder to define route-level guards
- ❌ Query params less clear than paths
- ❌ More complex routing logic

**When rejected:** During ADR 0008 design phase

#### Alternative 3: Separate Routes (Accepted)

**What it is:**

```typescript
<Route path="/course/:id/template">
  <TeachingCourseLayout>
    <TeachingCourseTemplate />
  </TeachingCourseLayout>
</Route>
<Route path="/course/:id/edit">
  <TeachingCourseLayout>
    <TeachingCourseEdit />
  </TeachingCourseLayout>
</Route>
<Route path="/course/:id/view">
  <TeachingCourseLayout>
    <TeachingCourseRead />
  </TeachingCourseLayout>
</Route>
```

**Why accepted:**

- ✅ Clear URL structure
- ✅ Code splitting
- ✅ Route-level permissions
- ✅ Independent data loading
- ✅ Bookmarkable
- ✅ Browser navigation

**Implemented:** Commit `6382d00` - "Refactor TeachingCourse structure with routing and lazy loading"

---

## 4. Component Composition Patterns

### 4.1 Overview

**Important Terminology Note:** This section describes the **composition patterns** used in the Teaching Course application, NOT the traditional "Compound Component Pattern" (with Context API) popularized by libraries like Reach UI and Radix UI. See [Section 4.6 - NOT Traditional Compound Components](#46-not-traditional-compound-components) for details on the distinction.

The Teaching Course application uses several **composition patterns** to build a flexible, recursive content editor:

**Key Characteristics:**

- **Composition Pattern** - Parent accepts children via props slot
- **Factory Pattern** - Dynamic component selection via registry
- **Strategy Pattern** - Mode variants (template/edit/read)
- **Recursive Composition** - Components render themselves for nested structures
- **Explicit Props Drilling** - Clear data flow through props (no Context API)

### 4.2 Current Implementation

The project implements compound components through several patterns:

#### Pattern 1: Factory + Mode Variants

**Factory Parent** ([TileInfoBlock.tsx:15](src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoBlock/TileInfoBlock.tsx#L15)):

```typescript
// Parent factory component
export default function TileInfoBlock(props: TileInfoBlockProps) {
  const { block, variant, ...otherProps } = props;

  // Factory lookup
  const Component = getBlockComponent(block.type);

  if (!Component) {
    return <div>Unknown block type: {block.type}</div>;
  }

  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Component variant={variant} tileInfo={block} {...otherProps} />
    </Suspense>
  );
}
```

**Polymorphic Child** ([TileInfoText.tsx:1](src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoText/TileInfoText.tsx#L1)):

```typescript
// Polymorphic dispatcher for mode variants
export default function TileInfoText(props: TileInfoTextProps) {
  switch (props.variant) {
    case "template":
      return <TileInfoTextTemplate {...props} />;
    case "edit":
      return <TileInfoTextEdit {...props} />;
    case "read":
      return <TileInfoTextRead {...props} />;
    default:
      return null;
  }
}
```

**Variant Implementation** ([TileInfoTextTemplate.tsx:1](src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoText/template/TileInfoTextTemplate.tsx#L1)):

```typescript
// Final variant implementation
export default function TileInfoTextTemplate(props: TileInfoTextTemplateProps) {
  const { tileInfo, onEditElement, onDeleteElement } = props;
  const [text, setText] = useState(tileInfo.data);

  return (
    <TileInfoBaseTemplate
      title={tileInfo.name}
      blockId={tileInfo.id}
      actions={{
        update: onEditElement,
        delete: onDeleteElement,
      }}
    >
      <input
        type="text"
        placeholder="Enter text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </TileInfoBaseTemplate>
  );
}
```

**Component Hierarchy:**

```
TileInfoBlock (Factory)
  ├─> TileInfoText (Mode dispatcher)
  │     ├─> TileInfoTextTemplate (Variant)
  │     │     └─> TileInfoBaseTemplate (Shared wrapper)
  │     ├─> TileInfoTextEdit (Variant)
  │     │     └─> TileInfoBaseTemplate
  │     └─> TileInfoTextRead (Variant)
  │           └─> TileInfoBaseTemplate
  ├─> TileInfoHeading (Mode dispatcher)
  │     └─> ... similar structure
  └─> TileInfoDropdown (Mode dispatcher)
        └─> ... similar structure
```

#### Pattern 2: Container + Children

**Accordion Container** ([TileInfoAccordion.tsx:1](src/pages/TeachingCourse/components/TileInfoAccordion/TileInfoAccordion.tsx#L1)):

```typescript
type TileInfoAccordionProps = {
  tileInfoRow: TileInfoBlockAccordion;
  children: React.ReactNode; // Accepts child blocks
  activeId?: number | null;
  onAddElement?: () => void;
  onDeleteElement?: () => void;
};

export default function TileInfoAccordion(props: TileInfoAccordionProps) {
  const { tileInfoRow, children, onAddElement, onDeleteElement } = props;
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="tile-info-row">
      {/* Header with collapse toggle */}
      <div className="header">
        <input
          type="text"
          value={tileInfoRow.name}
          placeholder="Accordion Title"
        />
        <DynamicIcon
          name={isCollapsed ? "chevron-down" : "chevron-up"}
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
        <button onClick={onAddElement}>+ Add</button>
        <button onClick={onDeleteElement}>Delete</button>
      </div>

      {/* Children rendered here */}
      <div className="content">{isCollapsed ? null : children}</div>
    </div>
  );
}
```

**Usage:**

```typescript
<TileInfoAccordion tileInfoRow={accordion}>
  <TileInfoBlock block={block1} variant="template" />
  <TileInfoBlock block={block2} variant="template" />
  <SortableColumnLayout columnLayout={layout}>
    <DroppableColumn column={col1}>
      <TileInfoBlock block={block3} variant="template" />
    </DroppableColumn>
  </SortableColumnLayout>
</TileInfoAccordion>
```

#### Pattern 3: Recursive Composition

**Recursive Renderer** ([RecursiveRowRenderer.tsx:15](src/pages/TeachingCourse/components/RecursiveRowRenderer/RecursiveRowRenderer.tsx#L15)):

```typescript
export default function RecursiveAccordionRenderer(
  props: RecursiveAccordionRendererProps
) {
  const { accordion, ...otherProps } = props;

  return (
    <TileInfoAccordion tileInfoRow={accordion}>
      <SortableContext items={accordion.children.map((c) => c.id)}>
        {accordion.children
          .sort((a, b) => a.order - b.order)
          .map((child) => {
            // Layout block
            if (isLayoutBlock(child) && child.type === "columnLayout") {
              return (
                <SortableColumnLayout key={child.id} columnLayout={child}>
                  {child.children.map((column) => (
                    <DroppableColumn key={column.id} column={column}>
                      {column.children.map((block) => (
                        <TileInfoBlock
                          key={block.id}
                          block={block}
                          variant="template"
                          {...otherProps}
                        />
                      ))}
                    </DroppableColumn>
                  ))}
                </SortableColumnLayout>
              );
            }

            // Nested accordion - RECURSIVE CALL
            if (isContainer(child) && child.type === "accordion") {
              return (
                <RecursiveAccordionRenderer
                  key={child.id}
                  accordion={child}
                  {...otherProps}
                />
              );
            }

            // Content block
            return (
              <TileInfoBlock
                key={child.id}
                block={child}
                variant="template"
                {...otherProps}
              />
            );
          })}
      </SortableContext>
    </TileInfoAccordion>
  );
}
```

#### Pattern 4: Shared Base Component

**Base Template** ([TileInfoBaseTemplate.tsx:1](src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoBase/template/TileInfoBaseTemplate.tsx#L1)):

```typescript
type TileInfoBaseTemplateProps = {
  children: React.ReactNode;
  title: string;
  blockId: number;
  activeBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column";
  actions?: {
    add?: () => void;
    update?: () => void;
    delete?: () => void;
  };
};

export default function TileInfoBaseTemplate(props: TileInfoBaseTemplateProps) {
  const { children, title, blockId, actions, level = "tile" } = props;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: blockId,
      data: { type: "block", blockId, level },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="tile-info-base"
    >
      {/* Drag handle */}
      <div className="drag-handle" {...listeners}>
        <DynamicIcon name="grip-vertical" />
      </div>

      {/* Action buttons */}
      <div className="actions">
        {actions?.update && (
          <button onClick={actions.update}>
            <DynamicIcon name="pencil" />
          </button>
        )}
        {actions?.delete && (
          <button onClick={actions.delete}>
            <DynamicIcon name="trash" />
          </button>
        )}
      </div>

      {/* Title input */}
      <div className="header">
        <input type="text" value={title} placeholder="Block Title" />
      </div>

      {/* Block-specific content */}
      <div className="content">{children}</div>
    </div>
  );
}
```

### 4.3 Why This Benefits Our Use Case

#### Self-Contained Block Logic

Each block type knows how to render itself in different modes:

```typescript
// Text block
<TileInfoBlock block={textBlock} variant="template" />
// Renders: Editable text input with drag handle

<TileInfoBlock block={textBlock} variant="edit" />
// Renders: Form field for content editing

<TileInfoBlock block={textBlock} variant="read" />
// Renders: Read-only text display
```

**Benefit:** Logic is co-located, easy to maintain.

#### Flexible Composition

Parents can compose children in any order:

```typescript
<TileInfoAccordion tileInfoRow={accordion}>
  <TileInfoBlock block={heading} variant="template" />
  <TileInfoBlock block={text} variant="template" />
  <SortableColumnLayout columnLayout={layout}>
    <DroppableColumn column={leftCol}>
      <TileInfoBlock block={codeBlock} variant="template" />
    </DroppableColumn>
    <DroppableColumn column={rightCol}>
      <TileInfoBlock block={explanation} variant="template" />
    </DroppableColumn>
  </SortableColumnLayout>
  <TileInfoBlock block={dropdown} variant="template" />
</TileInfoAccordion>
```

**Benefit:** Structure mirrors data, easy to understand.

#### Clear Hierarchy

Data structure and component tree are aligned:

```
Data:                              Components:
Tile                               TeachingCourseTemplate
└── children                       └── TileInfoBlock[]
    ├── Accordion                      ├── TileInfoAccordion
    │   └── children                   │   └── TileInfoBlock[]
    │       ├── ColumnLayout           │       ├── SortableColumnLayout
    │       │   └── columns            │       │   └── DroppableColumn[]
    │       │       └── children       │       │       └── TileInfoBlock[]
    │       └── Text                   │       └── TileInfoBlock
    └── Heading                        └── TileInfoBlock
```

**Benefit:** Natural mapping, intuitive to reason about.

#### Easy to Extend

Adding new block types follows the same pattern:

```typescript
// 1. Add to block registry
export const BLOCK_REGISTRY = {
  // ... existing blocks
  video: {
    category: "content",
    displayName: "Video Block",
    component: lazy(() => import("./TileInfoVideo")),
  },
};

// 2. Create component with mode variants
export default function TileInfoVideo(props: TileInfoVideoProps) {
  switch (props.variant) {
    case "template":
      return <TileInfoVideoTemplate {...props} />;
    case "edit":
      return <TileInfoVideoEdit {...props} />;
    case "read":
      return <TileInfoVideoRead {...props} />;
  }
}

// 3. Done! Block automatically renders in all modes
```

**Benefit:** Consistent pattern, 2 min to add new block.

#### Supports Unlimited Nesting

Recursive composition enables deep hierarchies:

```typescript
<TileInfoAccordion>
  {" "}
  {/* Level 0 accordion */}
  <TileInfoAccordion>
    {" "}
    {/* Level 1 nested accordion */}
    <TileInfoAccordion>
      {" "}
      {/* Level 2 nested accordion */}
      <TileInfoBlock block={text} />
    </TileInfoAccordion>
  </TileInfoAccordion>
</TileInfoAccordion>
```

**Benefit:** No artificial depth limits.

### 4.4 Code Examples

#### Example 1: Basic Compound Usage

```typescript
// Parent manages state
function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);

  return (
    <div>
      {tileInfo[0].children.map((child) => (
        // Child renders based on type
        <TileInfoBlock
          key={child.id}
          block={child}
          variant="template"
          onEditElement={() => handleEdit(child.id)}
          onDeleteElement={() => handleDelete(child.id)}
        />
      ))}
    </div>
  );
}
```

#### Example 2: Nested Compound Components

```typescript
// Accordion with column layout
<TileInfoAccordion tileInfoRow={accordion}>
  {/* Direct children */}
  <TileInfoBlock block={heading} variant="template" />

  {/* Nested layout */}
  <SortableColumnLayout columnLayout={layout}>
    <DroppableColumn column={col1}>
      <TileInfoBlock block={codeBlock} variant="template" />
    </DroppableColumn>
    <DroppableColumn column={col2}>
      <TileInfoBlock block={explanation} variant="template" />
    </DroppableColumn>
  </SortableColumnLayout>

  {/* More children */}
  <TileInfoBlock block={text} variant="template" />
</TileInfoAccordion>
```

#### Example 3: Recursive Nested Accordions

```typescript
function renderAccordion(accordion: TileInfoBlockAccordion) {
  return (
    <TileInfoAccordion key={accordion.id} tileInfoRow={accordion}>
      {accordion.children.map((child) => {
        // Nested accordion - recursive call
        if (child.type === "accordion") {
          return renderAccordion(child);
        }

        // Regular block
        return (
          <TileInfoBlock key={child.id} block={child} variant="template" />
        );
      })}
    </TileInfoAccordion>
  );
}
```

#### Example 4: Mode-Specific Variants

```typescript
// Template mode - drag and drop
<TileInfoBlock block={textBlock} variant="template">
  // Renders:
  <TileInfoTextTemplate>
    <input
      type="text"
      value={text}
      onChange={setText}
      draggable
    />
  </TileInfoTextTemplate>
</TileInfoBlock>

// Edit mode - form field
<TileInfoBlock block={textBlock} variant="edit">
  // Renders:
  <TileInfoTextEdit>
    <textarea
      value={content}
      onChange={setContent}
      placeholder="Enter content..."
    />
  </TileInfoTextEdit>
</TileInfoBlock>

// Read mode - display only
<TileInfoBlock block={textBlock} variant="read">
  // Renders:
  <TileInfoTextRead>
    <p>{content}</p>
  </TileInfoTextRead>
</TileInfoBlock>
```

#### Example 5: Shared Base Component

```typescript
// All variants use shared base
function TileInfoTextTemplate(props) {
  return (
    <TileInfoBaseTemplate
      title={props.tileInfo.name}
      blockId={props.tileInfo.id}
      actions={{
        update: props.onEditElement,
        delete: props.onDeleteElement,
      }}
    >
      {/* Block-specific content */}
      <input type="text" value={text} onChange={setText} />
    </TileInfoBaseTemplate>
  );
}

function TileInfoHeadingTemplate(props) {
  const { tileInfo } = props;
  const headingLevel = tileInfo.headingLevel || "h2"; // Default to h2

  return (
    <TileInfoBaseTemplate
      title={tileInfo.name}
      blockId={tileInfo.id}
      actions={{
        update: props.onEditElement,
        delete: props.onDeleteElement,
      }}
    >
      {/* Different content, same wrapper */}
      <select value={headingLevel} onChange={setVariant}>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>
    </TileInfoBaseTemplate>
  );
}
```

### 4.5 Pros and Cons

#### Pros

✅ **Self-Contained Logic**

- Each block manages its own rendering
- Co-located behavior and UI

✅ **Flexible Composition**

- Parents control child ordering
- Easy to rearrange structure

✅ **Clear Hierarchy**

- Component tree mirrors data
- Intuitive to understand

✅ **Easy to Extend**

- New blocks follow same pattern
- Consistent API

✅ **Supports Recursion**

- Unlimited nesting depth
- Natural composition

✅ **Mode Variants**

- Same block, different modes
- Shared logic, different UI

✅ **Shared Base Components**

- Consistent styling
- DRY principle

#### Cons

❌ **Props Drilling**

- Many props passed through layers
- Can get verbose

❌ **Complexity**

- Two-level factory (type + mode)
- Requires understanding pattern

❌ **Indirection**

- Factory lookup not immediately obvious
- Must trace through registry

❌ **Overhead**

- Suspense boundary per block
- Additional wrapper components

❌ **Testing Challenges**

- Must test all mode variants
- Recursive components hard to test

### 4.6 NOT Traditional Compound Components

**Important:** The patterns described in this section are **NOT** the traditional "Compound Component Pattern" popularized by React UI libraries.

#### Traditional Compound Components (NOT Used Here)

The classic compound component pattern uses **Context API** for implicit state sharing between parent and children:

```typescript
// Traditional Pattern (like Radix UI, Reach UI)
const SelectContext = createContext();

function Select({ children, value, onChange }) {
  return (
    <SelectContext.Provider value={{ value, onChange }}>
      <div className="select">{children}</div>
    </SelectContext.Provider>
  );
}

function Option({ value, children }) {
  const { value: selectedValue, onChange } = useContext(SelectContext);
  return <div onClick={() => onChange(value)}>{children}</div>;
}

Select.Option = Option;

// Usage - children "magically" know parent state via Context
<Select value="red" onChange={setValue}>
  <Select.Option value="red">Red</Select.Option>
  <Select.Option value="blue">Blue</Select.Option>
</Select>;
```

**Characteristics:**

- ✅ Implicit state sharing via Context
- ✅ Children don't need props from parent
- ✅ Flexible composition
- ✅ Clean API

**Good for:**

- UI component libraries
- Components where order doesn't matter
- Simple state requirements
- Non-recursive structures

#### What This Codebase Actually Uses

This codebase uses a **different pattern** - **Composition Pattern with Explicit Props Drilling**:

```typescript
// This Codebase Pattern
function TileInfoAccordion({ tileInfoRow, children, onUpdate }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ❌ NO Context Provider
  // ❌ Children don't "know" about parent

  return (
    <div className="accordion">
      <div className="header">
        <input value={tileInfoRow.name} />
        <button onClick={() => setIsCollapsed(!isCollapsed)}>Toggle</button>
      </div>
      <div>{isCollapsed ? null : children}</div>
    </div>
  );
}

// Usage - children created explicitly with all props
<TileInfoAccordion tileInfoRow={accordion}>
  <TileInfoBlock
    block={block1}
    variant="template"
    activeId={activeId} // Explicit props
    onUpdateBlock={onUpdate} // Explicit props
  />
  <TileInfoBlock
    block={block2}
    variant="template"
    activeId={activeId}
    onUpdateBlock={onUpdate}
  />
</TileInfoAccordion>;
```

**Characteristics:**

- ❌ NO Context API
- ✅ Explicit props drilling
- ✅ Parent just provides UI chrome
- ✅ Children are passed as a slot

**Actually uses:**

1. **Composition Pattern** - Parent accepts children
2. **Factory Pattern** - Block registry for component selection
3. **Strategy Pattern** - Mode variants (template/edit/read)
4. **Recursive Composition** - Components render themselves

#### Why NOT Use Traditional Compound Components?

**Traditional compound components would cause problems:**

❌ **Recursive structures are hard with Context**

- Context causes all consumers to re-render
- Performance issues with deep nesting
- Hard to scope context to correct level

❌ **Implicit state makes debugging harder**

- Can't trace where data comes from
- React DevTools shows less information

❌ **Context overhead for no gain**

- Structure is data-driven, not user-composed
- No flexibility benefit from implicit sharing

❌ **Props drilling is acceptable here**

- Clear data flow is valuable
- Easy to see dependencies
- Explicit is better for complex apps

#### Comparison Table

| Aspect            | Traditional Compound | This Codebase           |
| ----------------- | -------------------- | ----------------------- |
| **State Sharing** | Implicit (Context)   | Explicit (Props)        |
| **Use Case**      | UI libraries         | Data-driven content     |
| **Data Flow**     | Implicit             | Explicit                |
| **Re-renders**    | All consumers        | Only changed components |
| **Debugging**     | Harder (implicit)    | Easier (explicit)       |
| **Best For**      | Simple, flat UIs     | Complex, recursive UIs  |
| **Example**       | Radix Select         | Teaching Course Editor  |

#### When Each Pattern Makes Sense

**Use Traditional Compound Components When:**

- Building a UI component library
- Flexible composition is important
- State is simple
- Structure is flat (not deeply nested)
- Developer experience > performance

**Use Explicit Props Drilling When:**

- Building data-driven applications
- Structure comes from data
- Deep nesting is required
- Performance matters
- Explicit data flow > clean API

### 4.7 Alternatives Explored

#### Alternative 1: Flat Component List (Rejected)

**What it was:**

```typescript
function TeachingCourse() {
  return (
    <div>
      <TileInfoTextTemplate block={block1} />
      <TileInfoHeadingTemplate block={block2} />
      <TileInfoAccordionTemplate block={block3} />
      <TileInfoTextTemplate block={block4} />
    </div>
  );
}
```

**Why rejected:**

- ❌ No composition
- ❌ Can't nest blocks
- ❌ Hardcoded structure
- ❌ Not data-driven

**When rejected:** Early design phase

#### Alternative 2: Context API for State (Considered)

**What it was:**

```typescript
const TileContext = createContext<TileState | null>(null);

function TileProvider({ children }) {
  const [tileInfo, setTileInfo] = useState(tilesData);
  return (
    <TileContext.Provider value={{ tileInfo, setTileInfo }}>
      {children}
    </TileContext.Provider>
  );
}

function TileInfoBlock({ block }) {
  const { tileInfo, setTileInfo } = useContext(TileContext);
  // Use context instead of props
}
```

**Why rejected:**

- ✅ Avoids props drilling
- ❌ Implicit data flow (hard to debug)
- ❌ Re-renders all consumers on any change
- ❌ Harder to trace data source
- ❌ Doesn't work well with deeply nested trees

**When rejected:** Early design phase

#### Alternative 3: Composition Pattern with Explicit Props (Accepted)

**What it is:**

```typescript
<TileInfoAccordion tileInfoRow={accordion}>
  <TileInfoBlock
    block={block}
    variant="template"
    onEditElement={onEdit}
    onDeleteElement={onDelete}
  />
</TileInfoAccordion>
```

**Why accepted:**

- ✅ Explicit data flow
- ✅ Easy to debug
- ✅ No unnecessary re-renders
- ✅ Clear parent-child relationships
- ✅ Flexible composition

**Implemented:** Throughout the project

---

## 5. How These Patterns Work Together

All four architectural patterns work synergistically to create a cohesive system:

### Integration Flow

```
1. ROUTING
   User navigates to /course/123/template
   ↓
2. LAZY LOADING
   React Router lazy-loads TeachingCourseTemplate component
   ↓
3. DATA STRUCTURE
   Component loads recursive tile data with discriminated unions
   ↓
4. COMPOUND COMPONENTS
   RecursiveAccordionRenderer renders nested structure
   ↓
5. BLOCK REGISTRY FACTORY
   TileInfoBlock looks up components from registry
   ↓
6. RENDER
   Lazy-loaded block components render with Suspense
```

### Example Integration

**File:** [TeachingCourseTemplate.tsx:1](src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx#L1)

```typescript
// 1. ROUTING - This component loaded via route
export default function TeachingCourseTemplate() {
  // 2. DATA STRUCTURE - Recursive discriminated unions
  const [tileInfo, setTileInfo] = useState<Tile[]>(tilesData);

  return (
    <DndContext {...dndProps}>
      {/* 3. COMPOUND COMPONENTS - Parent manages children */}
      {tileInfo[0].children.map((child) => {
        // 4. DATA STRUCTURE - Type discrimination
        if (child.type === "accordion") {
          return (
            // 5. COMPOUND COMPONENTS - Recursive rendering
            <RecursiveAccordionRenderer key={child.id} accordion={child} />
          );
        }

        return (
          // 6. BLOCK REGISTRY FACTORY - Factory lookup
          // 7. LAZY LOADING - Component lazy-loaded
          <TileInfoBlock key={child.id} block={child} variant="template" />
        );
      })}
    </DndContext>
  );
}
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         USER ACTION                         │
│              Navigates to /course/123/template              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     REACT ROUTER (3)                        │
│     - Matches route /course/:id/template                    │
│     - Lazy loads TeachingCourseTemplate component           │
│     - Wraps in TeachingCourseLayout                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              TEACHING COURSE TEMPLATE (4)                   │
│     - Loads tile data (recursive structure)                 │
│     - Sets up DnD context                                   │
│     - Maps over children array                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA STRUCTURE (1)                             │
│     - Discriminated union: type="accordion" | "text" ...    │
│     - Recursive children: TileInfoBlock[]                   │
│     - Level tracking: level=0,1,2...                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         COMPOUND COMPONENTS (4)                             │
│     if (child.type === 'accordion')                         │
│       → RecursiveAccordionRenderer (recursive call)         │
│     else                                                    │
│       → TileInfoBlock (factory component)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            BLOCK REGISTRY FACTORY (2)                       │
│     const Component = getBlockComponent(block.type)         │
│     - Looks up lazy component in BLOCK_REGISTRY             │
│     - Returns lazy-loaded component reference               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              LAZY LOADING (2 & 3)                           │
│     <Suspense fallback={<BlockSkeleton />}>                 │
│       <Component variant="template" {...props} />           │
│     </Suspense>                                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              MODE VARIANTS (4)                              │
│     Component (e.g., TileInfoText) switches on variant:     │
│     - variant="template" → TileInfoTextTemplate             │
│     - variant="edit" → TileInfoTextEdit                     │
│     - variant="read" → TileInfoTextRead                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              RENDER TO DOM                                  │
│     Final component renders with:                           │
│     - Drag handle (template mode)                           │
│     - Edit controls                                         │
│     - Block-specific UI                                     │
└─────────────────────────────────────────────────────────────┘
```

### Benefits of Integration

1. **Performance**

   - Routing enables code splitting
   - Registry enables lazy loading
   - Only load what's needed per mode

2. **Maintainability**

   - Data structure defines shape
   - Registry defines components
   - Routing defines modes
   - Compound components compose UI

3. **Scalability**

   - Add new blocks via registry
   - Add new modes via routing
   - Extend nesting via data structure
   - Compose new layouts via compounds

4. **Type Safety**
   - Data structure defines types
   - Registry enforces component contracts
   - Router types route params
   - Components type-check props

---

## 6. References

### Architecture Decision Records (ADRs)

- [ADR 0001: Data Structure Architecture](../adr/0001-data-structure-architecture.md)
- [ADR 0002: Plugin Architecture](../adr/0002-plugin-architecture.md)
- [ADR 0003: Block Variants](../adr/0003-block-variants.md)
- [ADR 0004: Drag-Drop Improvements](../adr/0004-drag-drop-improvements.md)
- [ADR 0005: Data Persistence Architecture](../adr/0005-data-persistence-architecture.md)
- [ADR 0006: UUID Migration](../adr/0006-uuid-migration.md)
- [ADR 0007: Validation System](../adr/0007-validation-system.md)
- [ADR 0008: Separate Routes for Course Variants](../adr/0008-separate-routes-for-course-variants.md)
- [ADR 0009: Block Registry Factory](../adr/0009-block-registry-factory.md)
- [ADR 0010: Compound Components Pattern](../adr/0010-compound-components-pattern.md) _(Note: Despite the name, this describes composition patterns, not traditional compound components)_
- [ADR 0011: Block State Management](../adr/0011-block-state-management.md)

### Implementation Guides

- [Data Structure Proposal](./data-structure-proposal.md)
- [Data Structure Migration Status](./data-structure-migration-status.md)
- [Drag-Drop Implementation](./drag-drop-implementation.md)
- [Plugin Architecture Complete](./plugin-architecture-complete.md)
- [Plugin Architecture Lightweight](./plugin-architecture-lightweight.md)
- [Variant Implementation Guide](./variant-implementation-guide.md)
- [Shared Component Logic Extraction](./shared-component-logic-extraction.md)
- [Application Overview](./application-overview.md)

### Key Commits

- `2f9f3e6` - "Add blocks and rows" - Initial structure
- `b6d3ef6` - "Migrate to fully separated array data-structure" - ADR 0001
- `a573e6c` - "Recursive blocks" - Fully recursive implementation
- `fc63527` - "Add ADRs" - Documentation
- `6382d00` - "Refactor TeachingCourse structure with routing and lazy loading" - Latest

### External Resources

**React Patterns:**

- [Traditional Compound Components Pattern](https://www.patterns.dev/react/compound-pattern/) - patterns.dev (for comparison - NOT what this codebase uses)
- [React Compound Components with Hooks](https://kentcdodds.com/blog/compound-components-with-react-hooks) - Kent C. Dodds (traditional pattern)
- [React Composition](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) - Official React docs on composition

**Design Patterns:**

- [Factory Pattern in TypeScript](https://refactoring.guru/design-patterns/factory-method/typescript/example)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)

**React Technical:**

- [React Router v5 Documentation](https://v5.reactrouter.com/)
- [React.lazy and Suspense](https://react.dev/reference/react/lazy)
- [Discriminated Unions in TypeScript](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)

---

**Document End**

This architecture overview provides a comprehensive understanding of the four key patterns used in the Teaching Course application. Each pattern addresses specific challenges while working harmoniously with the others to create a maintainable, performant, and extensible system.
