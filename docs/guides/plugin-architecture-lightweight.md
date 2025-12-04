# Lightweight Plugin Architecture - Implementation Example

This document shows how to implement a lightweight plugin architecture for the Teaching Course builder.

## Overview

- **Simple**: Plain object-based registry, no complex classes
- **Feature flags**: Gate blocks by feature flags or user roles
- **One-time setup**: Initialize once at page load
- **Code splitting**: Lazy-loaded components for better performance

## File Structure

```
src/pages/TeachingCourse/
├── utils/
│   ├── blockRegistry.ts          (Enhanced with plugin features)
│   └── dragDropHelpers.ts        (Existing)
├── components/
│   ├── TileInfoBlock/
│   │   └── TileInfoBlock.tsx     (Simplified - no switch statement)
│   └── ElementPickerModal/
│       └── ElementPickerModal.tsx (Auto-generated from registry)
```

---

## 1. Enhanced Block Registry

```typescript
// src/pages/TeachingCourse/utils/blockRegistry.ts

import { lazy, ComponentType } from 'react';

type BlockCategory = 'container' | 'layout' | 'content';

export type BlockMetadata = {
  category: BlockCategory;
  canHaveChildren: boolean;
  canBeNested: boolean;
  canBeInColumn: boolean;
  canBeAtTileLevel: boolean;
  displayName: string;
  description?: string;
  icon?: string;

  // Component reference
  component: ComponentType<any>;

  // Factory function to create new block instances
  createBlock: (params: {
    id: number;
    parentId: number;
    level: number;
    order: number;
  }, options?: any) => TileInfoBlock;

  // Optional: Feature flag requirement
  featureFlag?: string;

  // Optional: User role requirement
  requiredRole?: 'admin' | 'teacher' | 'student';
};

/**
 * All available block types
 * Add new blocks here - they'll be filtered based on user features/permissions
 */
const ALL_BLOCKS = {
  // Core blocks (always available)
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
    createBlock: ({ id, parentId, level, order }) => ({
      id,
      type: 'text',
      parentId,
      level,
      order,
      name: 'New Text Block',
      description: '',
    }),
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
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoHeading/TileInfoHeading')),
    createBlock: ({ id, parentId, level, order }) => ({
      id,
      type: 'heading',
      parentId,
      level,
      order,
      name: 'New Heading',
    }),
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
    createBlock: ({ id, parentId, level, order }) => ({
      id,
      type: 'dropdown',
      parentId,
      level,
      order,
      name: 'New Dropdown',
      options: [],
    }),
  },

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
    createBlock: ({ id, parentId, level, order }) => ({
      id,
      type: 'accordion',
      parentId,
      level,
      order,
      name: 'New Accordion',
      children: [],
    }),
  },

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
    createBlock: ({ id, parentId, level, order }, options?: { columns?: number }) => {
      const numColumns = options?.columns || 2;
      return {
        id,
        type: 'columnLayout',
        parentId,
        level,
        order,
        children: Array.from({ length: numColumns }, (_, i) => ({
          id: id + i + 1,
          type: 'column',
          parentId: id,
          level,
          order: i,
          children: [],
        })),
      };
    },
  },

  // Feature-gated blocks (examples)
  video: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Video',
    description: 'Embed a video from YouTube or Vimeo',
    icon: 'video',
    featureFlag: 'video_blocks', // ← Only available if this feature is enabled
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoVideo/TileInfoVideo')),
    createBlock: ({ id, parentId, level, order }) => ({
      id,
      type: 'video',
      parentId,
      level,
      order,
      name: 'Video Block',
      videoUrl: '',
      thumbnail: '',
    }),
  },

  quiz: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Quiz',
    description: 'Add a quiz with multiple choice questions',
    icon: 'help-circle',
    featureFlag: 'quiz_blocks', // ← Experimental feature
    requiredRole: 'teacher', // ← Only teachers can add quizzes
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoQuiz/TileInfoQuiz')),
    createBlock: ({ id, parentId, level, order }) => ({
      id,
      type: 'quiz',
      parentId,
      level,
      order,
      name: 'Quiz Block',
      questions: [],
    }),
  },

  // Add more blocks here as needed...
} as const satisfies Record<string, BlockMetadata>;

export type BlockType = keyof typeof ALL_BLOCKS;

/**
 * Context for filtering blocks
 */
export type BlockFilterContext = {
  enabledFeatures?: string[];
  userRole?: 'admin' | 'teacher' | 'student';
};

/**
 * Filter blocks based on user context
 * Call this once at page load
 */
export function getAvailableBlocks(context: BlockFilterContext = {}): Record<string, BlockMetadata> {
  const { enabledFeatures = [], userRole } = context;

  return Object.entries(ALL_BLOCKS)
    .filter(([type, metadata]) => {
      // Check feature flag
      if (metadata.featureFlag && !enabledFeatures.includes(metadata.featureFlag)) {
        return false;
      }

      // Check role requirement
      if (metadata.requiredRole && metadata.requiredRole !== userRole) {
        return false;
      }

      return true;
    })
    .reduce((acc, [type, metadata]) => {
      acc[type] = metadata;
      return acc;
    }, {} as Record<string, BlockMetadata>);
}

/**
 * Initialize the block registry (call once at app load)
 */
let BLOCK_REGISTRY: Record<string, BlockMetadata> = {};

export function initializeBlockRegistry(context: BlockFilterContext): void {
  BLOCK_REGISTRY = getAvailableBlocks(context);
  console.log('Block registry initialized with blocks:', Object.keys(BLOCK_REGISTRY));
}

/**
 * Get the current block registry
 */
export function getBlockRegistry(): Record<string, BlockMetadata> {
  return BLOCK_REGISTRY;
}

/**
 * Get metadata for a block type
 */
export function getBlockMetadata(type: string): BlockMetadata | undefined {
  return BLOCK_REGISTRY[type as BlockType];
}

/**
 * Get component for a block type
 */
export function getBlockComponent(type: string): ComponentType<any> | undefined {
  return getBlockMetadata(type)?.component;
}

/**
 * Create a new block instance
 */
export function createBlock(
  type: string,
  params: { id: number; parentId: number; level: number; order: number },
  options?: any
): TileInfoBlock | null {
  const metadata = getBlockMetadata(type);
  if (!metadata) {
    console.error(`Block type not available: ${type}`);
    return null;
  }
  return metadata.createBlock(params, options);
}

/**
 * Get all available block types
 */
export function getAvailableBlockTypes(): string[] {
  return Object.keys(BLOCK_REGISTRY);
}

/**
 * Get blocks by category
 */
export function getBlocksByCategory(category: BlockCategory): Array<{
  type: string;
  metadata: BlockMetadata;
}> {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([type, metadata]) => ({ type, metadata }));
}

// Existing helper functions (keep these)
export function isContainer(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.category === 'container';
}

export function isContentBlock(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.category === 'content';
}

export function isLayoutBlock(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.category === 'layout';
}

export function canBeInColumn(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.canBeInColumn ?? false;
}
```

---

## 2. Simplified TileInfoBlock (No Switch Statement)

```typescript
// src/pages/TeachingCourse/components/TileInfoBlock/TileInfoBlock.tsx

import { Suspense } from 'react';
import { getBlockComponent } from '../../../utils/blockRegistry';

type TileInfoBlockProps = {
  block: TileInfoBlock;
  variant: 'template' | 'edit' | 'read';
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: 'tile' | 'accordion' | 'column';
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
};

export default function TileInfoBlock(props: Readonly<TileInfoBlockProps>) {
  const { block } = props;

  // Get the component from the registry
  const Component = getBlockComponent(block.type);

  if (!Component) {
    console.error(`No component registered for block type: ${block.type}`);
    return (
      <div style={{ padding: '1rem', border: '1px solid red', color: 'red' }}>
        Unknown block type: {block.type}
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component key={block.id} tileInfo={block} {...props} />
    </Suspense>
  );
}
```

---

## 3. Auto-Generated ElementPickerModal

```typescript
// src/pages/TeachingCourse/components/ElementPickerModal/ElementPickerModal.tsx

import { useState, useEffect, useMemo } from "react";
import Modal from "../../../../components/Modal/Modal";
import { getBlockRegistry, type BlockType } from "../../utils/blockRegistry";
import "./ElementPickerModal.module.scss";

type ElementPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BlockType, options?: { columns?: number }) => void;
  mode: "add" | "edit";
  allowedTypes?: BlockType[];
  initialSelection?: {
    type: BlockType;
    options?: { columns?: number };
  };
};

type Tab = "layout" | "blocks";

export default function ElementPickerModal(props: Readonly<ElementPickerModalProps>) {
  const { isOpen, onClose, onSelect, mode, allowedTypes, initialSelection } = props;

  // Auto-generate available blocks from registry
  const BLOCK_REGISTRY = getBlockRegistry();

  const availableBlocks = useMemo(() => {
    const allTypes = Object.keys(BLOCK_REGISTRY) as BlockType[];
    const filtered = allowedTypes
      ? allTypes.filter(type => allowedTypes.includes(type))
      : allTypes;

    return filtered.map(type => ({
      type,
      ...BLOCK_REGISTRY[type],
    }));
  }, [allowedTypes, BLOCK_REGISTRY]);

  // Determine which tabs to show
  const layoutBlocks = availableBlocks.filter(
    b => b.category === 'container' || b.category === 'layout'
  );
  const contentBlocks = availableBlocks.filter(b => b.category === 'content');

  const showLayoutTab = layoutBlocks.length > 0;
  const showBlocksTab = contentBlocks.length > 0;

  const initialTab: Tab = showLayoutTab ? "layout" : "blocks";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [selectedElement, setSelectedElement] = useState<{
    type: BlockType;
    options?: { columns?: number };
  } | null>(null);
  const [numColumns, setNumColumns] = useState<number>(2);

  // ... (keep existing useEffect hooks and handlers)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "add" ? "Add elements" : "Edit element"}
      size="xlarge"
    >
      <div styleName="container">
        <div styleName="sidebar">
          <div styleName="tabs">
            <button
              styleName={`tab ${activeTab === "layout" ? "active" : ""} ${
                !showLayoutTab ? "disabled" : ""
              }`}
              onClick={() => showLayoutTab && setActiveTab("layout")}
              disabled={!showLayoutTab}
            >
              Layout
            </button>
            <button
              styleName={`tab ${activeTab === "blocks" ? "active" : ""} ${
                !showBlocksTab ? "disabled" : ""
              }`}
              onClick={() => showBlocksTab && setActiveTab("blocks")}
              disabled={!showBlocksTab}
            >
              Blocks
            </button>
          </div>

          <div styleName="elements-list">
            {activeTab === "layout" && showLayoutTab && (
              <>
                {layoutBlocks.map(block => (
                  <BlockPickerItem
                    key={block.type}
                    type={block.type}
                    displayName={block.displayName}
                    description={block.description}
                    icon={block.icon}
                    selected={selectedElement?.type === block.type}
                    onClick={() => setSelectedElement({ type: block.type })}
                    // Special handling for columnLayout
                    {...(block.type === 'columnLayout' && {
                      extraControls: (
                        <div styleName="column-selector">
                          <label>Number of columns:</label>
                          <div styleName="column-buttons">
                            {[2, 3, 4].map(num => (
                              <button
                                key={num}
                                styleName={`column-btn ${numColumns === num ? "active" : ""}`}
                                onClick={() => {
                                  setNumColumns(num);
                                  if (selectedElement?.type === 'columnLayout') {
                                    setSelectedElement({
                                      type: 'columnLayout',
                                      options: { columns: num }
                                    });
                                  }
                                }}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      ),
                    })}
                  />
                ))}
              </>
            )}

            {activeTab === "blocks" && showBlocksTab && (
              <>
                {contentBlocks.map(block => (
                  <BlockPickerItem
                    key={block.type}
                    type={block.type}
                    displayName={block.displayName}
                    description={block.description}
                    icon={block.icon}
                    selected={selectedElement?.type === block.type}
                    onClick={() => setSelectedElement({ type: block.type })}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Preview section */}
        <div styleName="preview">
          {/* Keep existing preview UI */}
        </div>
      </div>
    </Modal>
  );
}

// Reusable block picker item component
function BlockPickerItem({
  type,
  displayName,
  description,
  icon,
  selected,
  onClick,
  extraControls
}: {
  type: string;
  displayName: string;
  description?: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
  extraControls?: React.ReactNode;
}) {
  return (
    <div>
      <button
        styleName={`element-item ${selected ? "selected" : ""}`}
        onClick={onClick}
      >
        <div styleName="element-icon">
          {/* Render icon - can be enhanced with icon component */}
          <span>{icon}</span>
        </div>
        <div styleName="element-info">
          <div styleName="element-name">{displayName}</div>
          {description && (
            <div styleName="element-description">{description}</div>
          )}
        </div>
      </button>
      {extraControls}
    </div>
  );
}
```

---

## 4. Usage in Your App

```typescript
// TeachingCourseTemplate.tsx or App.tsx
import { useEffect } from 'react';
import { initializeBlockRegistry } from './utils/blockRegistry';

function TeachingCourseTemplate() {
  useEffect(() => {
    // Initialize block registry once at page load
    // This determines which blocks are available

    // Example 1: All users get core blocks
    initializeBlockRegistry({
      enabledFeatures: [],
      userRole: 'student',
    });
    // Available: text, heading, dropdown, accordion, columnLayout

    // Example 2: Teachers with experimental features
    // initializeBlockRegistry({
    //   enabledFeatures: ['video_blocks', 'quiz_blocks'],
    //   userRole: 'teacher',
    // });
    // Available: all core blocks + video + quiz

    // Example 3: Fetch from API
    // const user = await fetchCurrentUser();
    // initializeBlockRegistry({
    //   enabledFeatures: user.enabledFeatures,
    //   userRole: user.role,
    // });
  }, []);

  return (
    // Your component JSX
  );
}
```

---

## 5. Creating Blocks with the Registry

```typescript
// Before (manual)
const newBlock = {
  id: nextId,
  type: 'text',
  parentId: parentId,
  level: level,
  order: order,
  name: 'New Text Block',
  description: '',
};

// After (using registry)
import { createBlock } from './utils/blockRegistry';

const newBlock = createBlock('text', {
  id: nextId,
  parentId,
  level,
  order,
});

// With options (e.g., columnLayout)
const newLayout = createBlock('columnLayout', {
  id: nextId,
  parentId,
  level,
  order,
}, { columns: 3 });
```

---

## 6. Adding a New Block Type

### Step 1: Create the component
```typescript
// src/pages/TeachingCourse/components/TileInfoBlocks/TileInfoVideo/TileInfoVideo.tsx
export default function TileInfoVideo(props) {
  const { tileInfo, variant } = props;

  return (
    <div>
      <h3>{tileInfo.name}</h3>
      <input
        type="url"
        value={tileInfo.videoUrl}
        placeholder="Enter video URL"
      />
    </div>
  );
}
```

### Step 2: Register in blockRegistry.ts
```typescript
// Add to ALL_BLOCKS in blockRegistry.ts
video: {
  category: 'content',
  canHaveChildren: false,
  canBeNested: true,
  canBeInColumn: true,
  canBeAtTileLevel: true,
  displayName: 'Video',
  description: 'Embed a video from YouTube or Vimeo',
  icon: 'video',
  featureFlag: 'video_blocks', // Optional: require feature flag
  component: lazy(() => import('../components/TileInfoBlocks/TileInfoVideo/TileInfoVideo')),
  createBlock: ({ id, parentId, level, order }) => ({
    id,
    type: 'video',
    parentId,
    level,
    order,
    name: 'Video Block',
    videoUrl: '',
  }),
},
```

### Step 3: Done! ✅
- TileInfoBlock automatically renders it
- ElementPickerModal automatically shows it
- createBlock function is available

---

## Example Scenarios

### Scenario 1: Role-Based Access
```typescript
// Student view - limited blocks
initializeBlockRegistry({
  userRole: 'student',
  enabledFeatures: [],
});

// Teacher view - all blocks including quiz
initializeBlockRegistry({
  userRole: 'teacher',
  enabledFeatures: ['video_blocks', 'quiz_blocks'],
});
```

### Scenario 2: A/B Testing
```typescript
// Server decides experiment group
const experimentGroup = await getExperimentGroup('video-feature');

initializeBlockRegistry({
  enabledFeatures: experimentGroup === 'test' ? ['video_blocks'] : [],
  userRole: user.role,
});
```

### Scenario 3: Gradual Feature Rollout
```typescript
// Backend controls which features are enabled per user
const userConfig = await fetchUserConfig();

initializeBlockRegistry({
  enabledFeatures: userConfig.enabledFeatures, // e.g., ['video_blocks']
  userRole: userConfig.role,
});
```

---

## Benefits

1. ✅ **Single source of truth** - All block metadata in one place
2. ✅ **No switch statements** - Component lookup is automatic
3. ✅ **Auto-generated UI** - Element picker updates automatically
4. ✅ **Feature flags** - Easy to gate features by role/flags
5. ✅ **Code splitting** - Blocks load on-demand
6. ✅ **Type safe** - TypeScript knows all block types
7. ✅ **Easy testing** - Test block filtering independently

---

## Migration Checklist

- [ ] Update `blockRegistry.ts` with new structure
- [ ] Add `component` and `createBlock` to each block definition
- [ ] Update `TileInfoBlock.tsx` to use registry lookup
- [ ] Update `ElementPickerModal.tsx` to auto-generate from registry
- [ ] Add `initializeBlockRegistry()` call at app startup
- [ ] Replace manual block creation with `createBlock()` function
- [ ] Update type definitions if needed
- [ ] Test with different user roles/features
