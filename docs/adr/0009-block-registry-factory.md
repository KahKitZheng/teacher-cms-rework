# ADR 0009: Block Registry Factory Pattern

**Status:** Proposed

**Date:** 2025-01

**Deciders:** Development Team

**TL;DR:** Replace the switch statement in `TileInfoBlock` with a registry-based factory. This eliminates ~30 lines of switch code, enables lazy loading (-60KB), and makes adding blocks easier. Element picker integration is a bonus but not required.

**Related:**
- [Component Architecture Questions](../discussions/component-architecture-questions.md#q10-block-factory-pattern)
- [Plugin Architecture](0002-plugin-architecture.md)
- [Block Variants](0003-block-variants.md)

---

## Context

Currently, `TileInfoBlock.tsx` uses a **switch statement** to render different block types:

```typescript
export default function TileInfoBlock({ block, variant }: Props) {
  switch (block.type) {
    case 'text':
      return <TileInfoText tileInfo={block} variant={variant} />;
    case 'heading':
      return <TileInfoHeading tileInfo={block} variant={variant} />;
    case 'dropdown':
      return <TileInfoDropdown tileInfo={block} variant={variant} />;
    case 'accordion':
      return <TileInfoRow tileInfo={block} variant={variant} />;
    default:
      return <div>Unknown block type: {block.type}</div>;
  }
}
```

### Problems

1. ❌ **Must update switch every time** you add a block
2. ❌ **Hard to extend from outside** (no plugin support)
3. ❌ **No lazy loading** (all blocks imported upfront)
4. ❌ **Difficult to test** individual blocks
5. ❌ **Disconnected from registry** (metadata in one file, components in another)

---

## Decision

Use the **Block Registry** as a component factory with lazy loading.

**Core benefits** (work with or without element picker):
1. Eliminates switch statement in `TileInfoBlock`
2. Enables lazy loading (-60KB bundle size)
3. Makes adding new blocks easier (1 file instead of 3)

**Bonus benefits** (if you add metadata):
4. Element picker can auto-discover blocks
5. Breadcrumbs can show friendly names
6. Analytics can track block usage

### Minimal Registry (Core Implementation)

Start here if you **don't have an element picker**. The simplest implementation that solves the switch statement problem:

```typescript
// src/utils/blockRegistry.ts

import { lazy, ComponentType } from 'react';

type BlockConfig = {
  component: ComponentType<any>;
};

export const BLOCK_REGISTRY: Record<string, BlockConfig> = {
  text: {
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText')),
  },
  heading: {
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoHeading')),
  },
  dropdown: {
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoDropdown')),
  },
  accordion: {
    component: lazy(() => import('../components/TileInfoRow')),
  },
  columnLayout: {
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoColumnLayout')),
  },
};

export function getBlockComponent(type: string): ComponentType<any> | null {
  return BLOCK_REGISTRY[type]?.component || null;
}

export function getAllBlockTypes(): string[] {
  return Object.keys(BLOCK_REGISTRY);
}

// ✨ Plugin registration API
export function registerBlock(type: string, config: BlockConfig): void {
  BLOCK_REGISTRY[type] = config;
}
```

### Extended Registry (With Metadata)

**Use this version if you have an element picker** or need friendly display names.

If you need additional metadata (e.g., for element picker, breadcrumbs, analytics):

```typescript
// src/utils/blockRegistry.ts

import { lazy, ComponentType } from 'react';

type BlockMetadata = {
  component: ComponentType<any>;
  // Optional metadata
  displayName?: string;
  description?: string;
  icon?: string;
  category?: 'content' | 'layout' | 'container';
  variants?: Array<{ value: string; label: string }>;
};

export const BLOCK_REGISTRY: Record<string, BlockMetadata> = {
  text: {
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText')),
    displayName: 'Text Block',
    description: 'Basic text content',
    icon: 'Type',
    category: 'content',
  },
  heading: {
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoHeading')),
    displayName: 'Heading',
    description: 'Section headings',
    icon: 'Heading',
    category: 'content',
    variants: [
      { value: 'h1', label: 'Heading 1' },
      { value: 'h2', label: 'Heading 2' },
      { value: 'h3', label: 'Heading 3' },
      { value: 'h4', label: 'Heading 4' },
    ],
  },
  // ... other blocks
};

export function getBlockComponent(type: string): ComponentType<any> | null {
  return BLOCK_REGISTRY[type]?.component || null;
}

export function getBlockMetadata(type: string): BlockMetadata | null {
  return BLOCK_REGISTRY[type] || null;
}

export function getAllBlockTypes(): string[] {
  return Object.keys(BLOCK_REGISTRY);
}

// ✨ Plugin registration API
export function registerBlock(type: string, metadata: BlockMetadata): void {
  if (BLOCK_REGISTRY[type]) {
    console.warn(`Block type "${type}" already registered. Overwriting.`);
  }
  BLOCK_REGISTRY[type] = metadata;
  console.log(`✅ Registered block: ${type}`);
}

export function unregisterBlock(type: string): void {
  delete BLOCK_REGISTRY[type];
}
```

### Simplified TileInfoBlock

```typescript
// src/pages/TeachingCourse/components/TileInfoBlock/TileInfoBlock.tsx

import { Suspense } from 'react';
import { getBlockComponent } from '../../utils/blockRegistry';
import BlockSkeleton from './BlockSkeleton';

export default function TileInfoBlock({ block, variant, ...props }: Props) {
  const Component = getBlockComponent(block.type);

  if (!Component) {
    return (
      <div className="unknown-block-error">
        <Icon name="AlertCircle" />
        <span>Unknown block type: {block.type}</span>
      </div>
    );
  }

  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Component
        key={block.id}
        tileInfo={block}
        variant={variant}
        {...props}
      />
    </Suspense>
  );
}
```

**From ~50 lines with switch to ~20 lines with registry lookup!**

---

## Rationale

### 1. No Switch Statement

**Before:**
```typescript
// Must manually update switch for every block
switch (block.type) {
  case 'text':
    return <TileInfoText />;
  case 'heading':
    return <TileInfoHeading />;
  // ... 5 more cases
}
```

**After:**
```typescript
// Registry handles lookup automatically
const Component = getBlockComponent(block.type);
return <Component {...props} />;
```

### 2. Automatic Updates

**Before:** Add new block → Update 3 files (component, registry, TileInfoBlock.tsx)

**After:** Add new block → Update 1 file (registry only)

```typescript
// Just add to registry - TileInfoBlock automatically works!
export const BLOCK_REGISTRY = {
  // ... existing blocks
  video: {
    category: 'content',
    displayName: 'Video',
    component: lazy(() => import('./TileInfoVideo')),
  },
};
```

### 3. Lazy Loading

**Before:**
```typescript
// All imports at top = all code loaded upfront
import TileInfoText from './TileInfoText';
import TileInfoHeading from './TileInfoHeading';
import TileInfoDropdown from './TileInfoDropdown';
// ... all block components loaded
```

**After:**
```typescript
// Lazy imports = load on demand
component: lazy(() => import('./TileInfoText'))
// Only loads when block type is actually used
```

**Impact:**
- Initial bundle: -60KB (blocks loaded on demand)
- Faster page load
- Better caching (blocks cached independently)

### 4. Plugin-Friendly

External blocks can register themselves:

```typescript
// External plugin: my-video-plugin/index.ts
import { registerBlock } from '@teaching-course-builder/sdk';
import VideoBlock from './VideoBlock';

export function initVideoPlugin() {
  registerBlock('video', {
    category: 'content',
    displayName: 'Video Block',
    component: lazy(() => import('./VideoBlock')),
  });
}
```

**No changes to core code needed!**

### 5. Single Source of Truth

**Before:**
- Component in `/components/TileInfoBlocks/TileInfoText/`
- Metadata in `/utils/blockRegistry.ts`
- Rendering logic in `/components/TileInfoBlock/TileInfoBlock.tsx`

**After:**
- Everything in one place: `/utils/blockRegistry.ts`
- Component + metadata together
- Easier to maintain

### 6. Type Safety

```typescript
// TypeScript knows all block types
type BlockType = keyof typeof BLOCK_REGISTRY;
// 'text' | 'heading' | 'dropdown' | 'accordion' | 'columnLayout'

// Get metadata with full type inference
const metadata = BLOCK_REGISTRY['text'];
// metadata.displayName: string
// metadata.component: ComponentType<BlockProps>
```

### 7. Easy Testing

```typescript
// Mock registry for tests
import * as blockRegistry from '../utils/blockRegistry';

jest.spyOn(blockRegistry, 'getBlockComponent').mockReturnValue(MockComponent);

// Test individual blocks
test('renders text block', () => {
  render(<TileInfoBlock block={{ type: 'text' }} />);
  expect(screen.getByText('Text content')).toBeInTheDocument();
});
```

### 8. Bonus: Element Picker Integration (Optional)

**If you add an element picker** later, the registry metadata makes it trivial:

```typescript
// ElementPickerModal automatically uses registry
const allBlockTypes = getAllBlockTypes();

return (
  <div>
    {allBlockTypes.map(type => {
      const metadata = BLOCK_REGISTRY[type];
      return (
        <button key={type} onClick={() => handleAdd(type)}>
          <Icon name={metadata.icon} />
          <span>{metadata.displayName}</span>
          <small>{metadata.description}</small>
        </button>
      );
    })}
  </div>
);
```

**Benefits:**
- No hardcoded block list in UI
- Element picker updates automatically when blocks added
- Display names, icons, descriptions all in one place

**But you don't need element picker to benefit from the registry!** The core benefits (no switch, lazy loading, easy maintenance) work with or without it.

---

## When to Use Minimal vs Extended Registry

### Use Minimal Registry (Components Only) If:
- ❌ No element picker or block selection UI
- ❌ No need for display names in UI
- ❌ No breadcrumbs showing block types
- ✅ Just need to render blocks from data

**Minimal version is ~20 lines of code and gives you 80% of the benefits.**

### Use Extended Registry (With Metadata) If:
- ✅ Have element picker / block selection UI
- ✅ Show breadcrumbs (e.g., "Course > Text Block > Introduction")
- ✅ Need analytics (e.g., "Most used block type: Text")
- ✅ Want block search/filtering by category
- ✅ Admin panel to enable/disable block types

**Extended version is ~40 lines of code and gives you full flexibility.**

---

## Implementation

### Phase 1: Add Components to Registry

```typescript
// Update blockRegistry.ts
export const BLOCK_REGISTRY = {
  text: {
    // ... existing metadata
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText')),
  },
  // ... other blocks
};

export function getBlockComponent(type: string) {
  return BLOCK_REGISTRY[type]?.component || null;
}
```

### Phase 2: Create BlockSkeleton

```typescript
// src/components/TileInfoBlock/BlockSkeleton.tsx

export default function BlockSkeleton() {
  return (
    <div className="block-skeleton">
      <div className="skeleton-header" />
      <div className="skeleton-content" />
    </div>
  );
}
```

### Phase 3: Simplify TileInfoBlock

Replace switch statement with registry lookup.

### Phase 4: (Optional) Update Element Picker

**Only if you have an element picker**, update it to use registry:

```typescript
// ElementPickerModal automatically uses registry
const allBlockTypes = getAllBlockTypes();

return (
  <div>
    {allBlockTypes.map(type => {
      const metadata = getBlockMetadata(type);
      return (
        <button key={type} onClick={() => handleAdd(type)}>
          <Icon name={metadata?.icon} />
          {metadata?.displayName || type}
        </button>
      );
    })}
  </div>
);
```

---

## Migration Strategy

### Minimal Implementation (No Element Picker)
**Week 1:**
- Add minimal registry with components only
- Create `getBlockComponent()` function
- Create `BlockSkeleton` loading component

**Week 2:**
- Update `TileInfoBlock` to use registry
- Remove switch statement
- Test all block types render correctly

**Total Duration:** ~1 week

### Extended Implementation (With Element Picker)
**Week 1:** Add registry with metadata
**Week 2:** Update TileInfoBlock
**Week 3:** Update ElementPickerModal
**Week 4:** Test and cleanup

**Total Duration:** ~2-3 weeks

---

## Consequences

### Positive

- ✅ **No switch statement**: Registry handles lookup
- ✅ **Auto-updates**: Add to registry, component works
- ✅ **Lazy loading**: Components load on demand (-60KB initial bundle)
- ✅ **Plugin-friendly**: External blocks can register themselves
- ✅ **Type-safe**: TypeScript knows all block types
- ✅ **Easy to test**: Mock registry for tests
- ✅ **Single source of truth**: Component + metadata together

### Negative

- ⚠️ **Loading states**: Need Suspense boundaries (adds ~10 lines)
- ⚠️ **More abstraction**: Indirection through registry
- ⚠️ **Initial setup**: Need to add components to registry

### Trade-offs

- **Abstraction vs Explicitness**: Registry lookup vs explicit switch (worth it for scalability)
- **Initial effort vs Long-term benefit**: Small setup cost, big maintainability gain
- **Bundle size vs Loading states**: Smaller bundles, but need loading UI

---

## Alternatives Considered

### Alternative 1: Map-Based Factory

```typescript
const BLOCK_COMPONENTS = {
  text: TileInfoText,
  heading: TileInfoHeading,
  // ...
};
```

**Rejected:**
- ❌ All imports upfront (no code splitting)
- ❌ Separate from metadata registry
- ❌ Duplication

### Alternative 2: Higher-Order Component Factory

```typescript
const TextBlock = createBlockComponent('text');
```

**Rejected:**
- ❌ Over-engineered
- ❌ Harder to debug
- ❌ Unnecessary complexity

---

## Success Metrics

### Code Reduction
- TileInfoBlock.tsx: 50 lines → 20 lines (-60%)
- Adding new block: 3 files → 1 file (-66%)

### Performance
- Initial bundle size: -60KB (lazy loading)
- Time to add new block: 10 min → 2 min (-80%)

### Maintainability
- Single source of truth for block metadata + components
- Zero core changes needed for plugins

---

## Plugin Integration Example

### External Plugin Developer

```typescript
// @my-company/video-block-plugin

import { registerBlock } from '@teaching-course-builder/sdk';
import { lazy } from 'react';

export function initVideoBlockPlugin() {
  registerBlock('video', {
    category: 'content',
    displayName: 'Video Block',
    description: 'Embed YouTube, Vimeo, or uploaded videos',
    icon: 'PlayCircle',
    component: lazy(() => import('./VideoBlock')),
    variants: [
      { value: 'youtube', label: 'YouTube' },
      { value: 'vimeo', label: 'Vimeo' },
      { value: 'upload', label: 'Uploaded' },
    ],
  });
}
```

### App Integration

```typescript
// src/main.tsx

import { initVideoBlockPlugin } from '@my-company/video-block-plugin';

// Initialize plugin before rendering
initVideoBlockPlugin();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

**Video block now renders automatically!** (And if you have an element picker, it appears there too.)

---

## Comparison Table

| Aspect | Switch Statement | Registry Factory |
|--------|-----------------|------------------|
| **Add new block** | Update 3 files | Update 1 file |
| **Code splitting** | ❌ No | ✅ Yes (lazy) |
| **Plugin support** | ❌ Hard | ✅ Easy |
| **Lines of code** | ~50 lines | ~20 lines |
| **Maintainability** | ⚠️ Medium | ✅ High |
| **Type safety** | ✅ Yes | ✅ Yes |
| **Testability** | ⚠️ Medium | ✅ High |

---

## Open Questions

1. **Should we support multiple components per block type?**
   - Example: `text.template`, `text.edit`, `text.read`
   - **Deferred**: Start with single component, add if needed

2. **How to handle block migrations?**
   - Example: Rename `text` → `richText`
   - **Solution**: Add registry migration helpers later

---

## References

- [React Code Splitting](https://react.dev/reference/react/lazy)
- [Component Architecture Questions](../discussions/component-architecture-questions.md#q10-block-factory-pattern)
- [Plugin Architecture ADR](0002-plugin-architecture.md)
- [Block Registry](../../src/pages/TeachingCourse/utils/blockRegistry.ts)
