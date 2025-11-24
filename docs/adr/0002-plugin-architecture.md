# ADR 0002: Plugin Architecture for Block Registry

**Status:** Proposed

**Date:** 2025-01

**Deciders:** Development Team

**Related:**
- [Lightweight Plugin Architecture Guide](../guides/plugin-architecture-lightweight.md)
- [Complete Plugin Architecture Guide](../guides/plugin-architecture-complete.md)

---

## Context

The Teaching Course builder supports multiple block types (text, heading, dropdown, accordion, column layouts). Currently:

1. **Hardcoded block types**: Switch statements in components to render different blocks
2. **No feature gating**: All blocks available to all users
3. **No role-based access**: Teachers and students see same blocks
4. **Manual registration**: Adding a new block requires updating multiple files

We need a scalable architecture that:
- Supports feature flags for gradual rollout
- Enables role-based access control
- Makes adding new blocks easier
- Maintains type safety
- Supports code splitting for performance

---

## Decision

We will implement a **Lightweight Plugin Architecture** with these characteristics:

### Core Design

```typescript
// Block Registry - Single source of truth
const BLOCK_REGISTRY = {
  heading: {
    category: 'content',
    displayName: 'Heading',
    description: 'Add a heading or title',

    // Optional feature gating
    featureFlag: 'heading_blocks',
    requiredRole: 'teacher',

    // Block metadata
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,

    // Variant support
    variants: [
      { value: 'h1', label: 'Heading 1', description: 'Main page title' },
      { value: 'h2', label: 'Heading 2', description: 'Section heading' },
      // ...
    ]
  },
  // ... other blocks
};
```

### Key Principles

1. **Metadata-driven**: All block configuration in a central registry
2. **Page-load filtering**: Feature flags and roles determined at page load
3. **Static components**: No runtime component loading (for simplicity)
4. **Variant support**: Blocks can have multiple style/behavior variants

---

## Rationale

### Why Lightweight vs Complete?

We considered two approaches:

#### Complete Plugin Architecture
- Runtime component loading with `lazy()` and `Suspense`
- Dynamic block registry initialization
- Component factory functions
- Factory pattern for block creation

**Pros:**
- True code splitting (only load used blocks)
- Runtime toggling of features
- Most flexible

**Cons:**
- More complexity
- Loading states to handle
- Over-engineering for current needs

#### Lightweight Plugin Architecture (CHOSEN)
- Static imports, metadata-driven
- Page-load feature determination
- Simple registry filtering
- Variant system built-in

**Pros:**
- Simple to implement
- No loading states
- Easier debugging
- Sufficient for feature flags determined at page load
- Built-in variant support

**Cons:**
- All block code in bundle
- Can't toggle features at runtime

### Why This Is Right for Us

1. **Feature flags are page-load decisions**
   - User's role doesn't change during session
   - Feature flags come from server on load
   - No need for runtime toggling

2. **Bundle size not a concern yet**
   - Current blocks are small
   - Page loads fast enough
   - Can migrate to complete version if needed

3. **Simpler maintenance**
   - Less abstraction
   - Easier to debug
   - Faster development

---

## Consequences

### Positive

- ✅ **Single source of truth**: All block metadata in one place
- ✅ **Type safe**: Full TypeScript support
- ✅ **Feature flags**: Easy to gate blocks by role or feature
- ✅ **Variant system**: Built-in support for block variations (H1, H2, H3, etc.)
- ✅ **Easy to extend**: Add new block by adding to registry
- ✅ **Auto-generated UI**: Element picker generates from registry
- ✅ **Simple testing**: Easy to test with different feature configurations

### Negative

- ⚠️ **All blocks in bundle**: No code splitting (acceptable trade-off)
- ⚠️ **No runtime toggling**: Features fixed at page load (matches requirements)
- ⚠️ **Migration effort**: Need to refactor existing components

### Neutral

- Registry must be initialized at app startup
- Need to update both registry and component when adding blocks

---

## Implementation Plan

### Phase 1: Create Block Registry (2 hours)

```typescript
// src/pages/TeachingCourse/utils/blockRegistry.ts

type BlockVariant = {
  value: string;
  label: string;
  description?: string;
  icon?: string;
};

type BlockMetadata = {
  category: 'container' | 'layout' | 'content';
  displayName: string;
  description?: string;
  icon?: string;

  // Capabilities
  canHaveChildren: boolean;
  canBeNested: boolean;
  canBeInColumn: boolean;
  canBeAtTileLevel: boolean;

  // Optional features
  featureFlag?: string;
  requiredRole?: 'admin' | 'teacher' | 'student';
  variants?: BlockVariant[];
};

export const BLOCK_REGISTRY = {
  text: { /* metadata */ },
  heading: { /* metadata */ },
  dropdown: { /* metadata */ },
  accordion: { /* metadata */ },
  columnLayout: { /* metadata */ },
};

export function initializeBlockRegistry(context: {
  enabledFeatures: string[];
  userRole: 'admin' | 'teacher' | 'student';
}): void {
  // Filter blocks based on features and role
}
```

### Phase 2: Update Element Picker (2 hours)

Auto-generate element picker UI from registry:

```typescript
// Get available blocks from registry
const blocks = Object.entries(BLOCK_REGISTRY)
  .filter(([_, meta]) => meta.category === 'content')
  .map(([type, meta]) => (
    <BlockItem
      key={type}
      type={type}
      displayName={meta.displayName}
      description={meta.description}
      variants={meta.variants}
    />
  ));
```

### Phase 3: Add Variant Support (2 hours)

Implement variant selection UI for blocks with variants:

```typescript
// Show variant selector when block has variants
{BLOCK_REGISTRY.heading.variants && (
  <VariantSelector
    variants={BLOCK_REGISTRY.heading.variants}
    selected={selectedVariant}
    onChange={setSelectedVariant}
  />
)}
```

### Phase 4: Integration (2 hours)

- Initialize registry at app startup
- Update drag-and-drop to use registry
- Update helper functions to query registry

### Phase 5: Documentation (1 hour)

- Document how to add new blocks
- Document feature flag usage
- Create migration guide

**Estimated Total Effort:** ~2 days

---

## Usage Examples

### Initializing at App Startup

```typescript
// In TeachingCourseTemplate.tsx
useEffect(() => {
  initializeBlockRegistry({
    enabledFeatures: ['video_blocks'], // From server
    userRole: currentUser.role,
  });
}, []);
```

### Adding a New Block

```typescript
// 1. Add to registry
export const BLOCK_REGISTRY = {
  // ...existing blocks
  video: {
    category: 'content',
    displayName: 'Video',
    description: 'Embed a video',
    featureFlag: 'video_blocks',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
  }
};

// 2. Create component (TileInfoVideo.tsx)
// That's it! Element picker auto-updates
```

### Using Variants

```typescript
// Define variants in registry
heading: {
  // ...metadata
  variants: [
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
  ]
}

// Select variant in UI
onSelect('heading', { variant: 'h2' });

// Render based on variant
const HeadingComponent = ({ block }) => {
  const Tag = block.variant || 'h2';
  return <Tag>{block.name}</Tag>;
};
```

---

## Migration Path to Complete Version

If we later need code splitting and runtime toggling:

1. Add `lazy()` imports to registry
2. Add `Suspense` boundaries in components
3. Add component factories
4. Update initialization to be async

The registry structure remains the same, making migration straightforward.

---

## Alternatives Considered

### Keep Current Hard-coded Approach
- **Rejected**: Doesn't scale, no feature gating

### Complete Plugin Architecture with Lazy Loading
- **Deferred**: Over-engineering for current needs, can migrate later

### External Plugin System
- **Rejected**: Too complex, blocks are core to the app

---

## References

- [Lightweight Plugin Architecture Implementation](../guides/plugin-architecture-lightweight.md)
- [Complete Plugin Architecture (Future Reference)](../guides/plugin-architecture-complete.md)
- [Block Variants Implementation Guide](../guides/variant-implementation-guide.md)
