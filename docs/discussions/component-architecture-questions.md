# Component Architecture - Outstanding Questions

**Status:** ✅ All questions resolved and answered

This document addresses open questions about component architecture and routing from the [Improvement Questions](./improvement-questions.md).

---

## Q9: Separate Routes for Variants (Template/Edit/Read)

**Status:** ✅ Resolved - Recommendation: Use separate routes

### Question

Should template, edit, and read variants have **separate routing**?
- `/course/:id/template` - Build course structure
- `/course/:id/edit` - Edit course content
- `/course/:id/view` - Read-only view for students

**What are the trade-offs? Will it improve maintainability?**

### Analysis

#### Option 1: Separate Routes (Recommended)

```typescript
// Separate route files
routes/
├── course/:id/template  → TeachingCourseTemplate
├── course/:id/edit      → TeachingCourseEdit
├── course/:id/view      → TeachingCourseView
```

**Implementation:**

```typescript
// router.tsx
{
  path: '/course/:id',
  children: [
    {
      path: 'template',
      element: <TeachingCourseTemplate />,
      loader: courseTemplateLoader,
    },
    {
      path: 'edit',
      element: <TeachingCourseEdit />,
      loader: courseEditLoader,
    },
    {
      path: 'view',
      element: <TeachingCourseView />,
      loader: courseViewLoader,
    },
  ],
}
```

**Benefits:**

1. ✅ **Clear URL structure**
   - URL clearly indicates current mode
   - Easy to bookmark specific modes
   - Users can share links to specific views

2. ✅ **Better code splitting**
   ```typescript
   // Only load template code when in template mode
   const TeachingCourseTemplate = lazy(() => import('./variants/template'));
   const TeachingCourseEdit = lazy(() => import('./variants/edit'));
   const TeachingCourseView = lazy(() => import('./variants/read'));
   ```
   - Smaller initial bundle
   - Faster page loads
   - Load only what's needed

3. ✅ **Easier permissions/guards**
   ```typescript
   {
     path: 'template',
     element: <RequireRole role="teacher"><TeachingCourseTemplate /></RequireRole>
   },
   {
     path: 'view',
     element: <RequireRole role="student"><TeachingCourseView /></RequireRole>
   }
   ```
   - Clear permission boundaries
   - Separate authentication logic
   - Prevent accidental access

4. ✅ **Independent data loading**
   ```typescript
   // Template mode: Load full editable data
   async function courseTemplateLoader({ params }) {
     return {
       course: await api.getCourse(params.id),
       templates: await api.getTemplates(),
       assets: await api.getAssets(),
     };
   }

   // View mode: Load minimal read-only data
   async function courseViewLoader({ params }) {
     return {
       course: await api.getPublishedCourse(params.id), // Lighter payload
     };
   }
   ```
   - Load only necessary data
   - Different API endpoints
   - Optimized for each mode

5. ✅ **Better maintainability**
   - Separate files = easier to find code
   - Changes to one mode don't affect others
   - Easier to test each mode independently

6. ✅ **Analytics tracking**
   ```typescript
   // Track which mode users spend time in
   useEffect(() => {
     analytics.track('Course Mode', { mode: 'template' });
   }, []);
   ```

**Trade-offs:**

- ⚠️ **More route definitions**: Need to define 3 routes instead of 1
- ⚠️ **Navigation complexity**: Need to handle transitions between modes
- ⚠️ **Shared state**: If modes share state, need to persist across route changes

---

#### Option 2: Single Route with Query Param

```typescript
// Single route
/course/:id?mode=template|edit|view

// Component
function TeachingCourse() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'template';

  return <TeachingCourseContent variant={mode} />;
}
```

**Benefits:**

- ✅ Easy to switch modes (just change query param)
- ✅ Single loader function
- ✅ Shared state across modes (no persistence needed)

**Trade-offs:**

- ⚠️ **No code splitting**: All mode code loaded at once
- ⚠️ **Unclear URLs**: Mode hidden in query string
- ⚠️ **Hard to guard**: Can't easily restrict access to modes
- ⚠️ **Poor SEO**: Search engines may not index properly
- ⚠️ **Messy component**: Large if/else for each mode

---

#### Option 3: Single Route with Prop

```typescript
// Prop-based (current approach)
<TeachingCourse variant="template" />
```

**Benefits:**

- ✅ Simple API
- ✅ Easy to test (just pass prop)

**Trade-offs:**

- ❌ **No URL state**: Can't bookmark or share
- ❌ **No code splitting**
- ❌ **Doesn't scale**: As modes diverge, component becomes huge
- ❌ **Hard to guard**: No route-level protection

---

### Recommendation: **Option 1 (Separate Routes)**

**Why:**

1. **Modes are fundamentally different**
   - Template: Teachers building course structure
   - Edit: Teachers editing content
   - View: Students consuming content
   - Different users, different permissions, different data

2. **Future-proof**
   - As features grow, modes will diverge more
   - Separate routes make it easy to add mode-specific features
   - Example: Template mode might add AI suggestions, view mode might add progress tracking

3. **Performance**
   - Code splitting reduces initial load
   - Students don't need template-building code
   - Teachers don't need student progress tracking code

4. **Security**
   - Clear permission boundaries
   - Can't accidentally access wrong mode
   - Audit trail of mode usage

5. **User experience**
   - Clear navigation (tabs, breadcrumbs)
   - Bookmarkable URLs
   - Browser back/forward works naturally

### Implementation Approach

```typescript
// 1. Shared layout component
function TeachingCourseLayout() {
  const { id } = useParams();
  const location = useLocation();

  const currentMode = location.pathname.includes('template')
    ? 'template'
    : location.pathname.includes('edit')
    ? 'edit'
    : 'view';

  return (
    <div>
      <Header courseId={id} currentMode={currentMode} />
      <ModeTabs courseId={id} currentMode={currentMode} />
      <Outlet /> {/* Renders variant-specific content */}
    </div>
  );
}

// 2. Mode-specific components
function TeachingCourseTemplate() {
  return (
    <div>
      {/* Template-specific UI */}
      <TemplateToolbar />
      <CourseBuilder />
    </div>
  );
}

function TeachingCourseEdit() {
  return (
    <div>
      {/* Edit-specific UI */}
      <ContentEditor />
    </div>
  );
}

function TeachingCourseView() {
  return (
    <div>
      {/* View-specific UI */}
      <StudentView />
    </div>
  );
}
```

---

## Q10: Block Factory Pattern

**Status:** ✅ Resolved - Recommendation: Use registry-based factory

### Question

Should there be a **block factory** component instead of the current switch statement in `TileInfoBlock.tsx`?

**Can you give an example of how the block factory will be used and what the benefits and trade-offs are?**

### Current Approach (Switch Statement)

```typescript
// TileInfoBlock.tsx
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

**Problems:**

1. ❌ Must update switch every time you add a block
2. ❌ Hard to extend from outside (plugins)
3. ❌ No lazy loading (all blocks imported upfront)
4. ❌ Difficult to test individual blocks

---

### Option 1: Registry-Based Factory (Recommended)

**Concept:** Use the block registry to look up components dynamically.

```typescript
// blockRegistry.ts (already exists)
export const BLOCK_REGISTRY = {
  text: {
    category: 'content',
    displayName: 'Text Block',
    // Add component reference
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText')),
  },
  heading: {
    category: 'content',
    displayName: 'Heading',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoHeading')),
  },
  // ...
};

// New: Factory function
export function getBlockComponent(type: string) {
  const metadata = BLOCK_REGISTRY[type];
  if (!metadata?.component) {
    console.error(`No component registered for block type: ${type}`);
    return null;
  }
  return metadata.component;
}
```

**Usage:**

```typescript
// TileInfoBlock.tsx (Simplified!)
import { Suspense } from 'react';
import { getBlockComponent } from '../../utils/blockRegistry';

export default function TileInfoBlock({ block, variant }: Props) {
  const Component = getBlockComponent(block.type);

  if (!Component) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>
        Unknown block type: {block.type}
      </div>
    );
  }

  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Component tileInfo={block} variant={variant} />
    </Suspense>
  );
}
```

**Benefits:**

1. ✅ **No switch statement**: Registry handles lookup
2. ✅ **Auto-updates**: Add to registry, component works
3. ✅ **Lazy loading**: Components load on demand
4. ✅ **Plugin-friendly**: External blocks can register themselves
5. ✅ **Type-safe**: TypeScript knows all block types
6. ✅ **Easy to test**: Mock registry for tests

**Trade-offs:**

- ⚠️ **Loading states**: Need Suspense boundaries
- ⚠️ **More abstraction**: Indirection through registry
- ⚠️ **Initial setup**: Need to add components to registry

---

### Option 2: Map-Based Factory

**Concept:** Explicit component map.

```typescript
// blockComponentMap.ts
import TileInfoText from './TileInfoBlocks/TileInfoText';
import TileInfoHeading from './TileInfoBlocks/TileInfoHeading';
// ...

const BLOCK_COMPONENTS = {
  text: TileInfoText,
  heading: TileInfoHeading,
  dropdown: TileInfoDropdown,
  accordion: TileInfoRow,
} as const;

export function getBlockComponent(type: string) {
  return BLOCK_COMPONENTS[type] || null;
}
```

**Benefits:**

- ✅ Simple and explicit
- ✅ No lazy loading complexity
- ✅ Easy to understand

**Trade-offs:**

- ⚠️ **All imports upfront**: No code splitting
- ⚠️ **Separate from metadata**: Component map disconnected from block registry

---

### Option 3: Higher-Order Component Factory

**Concept:** Wrap components with factory logic.

```typescript
// createBlockComponent.ts
export function createBlockComponent(type: string) {
  return function BlockComponent(props: BlockProps) {
    const Component = getBlockComponent(type);
    return <Component {...props} />;
  };
}

// Usage
const TextBlock = createBlockComponent('text');
const HeadingBlock = createBlockComponent('heading');
```

**Benefits:**

- ✅ Create components programmatically
- ✅ Can add middleware (logging, analytics)

**Trade-offs:**

- ⚠️ **Over-engineered**: Adds unnecessary complexity
- ⚠️ **Harder to debug**: Extra layer of abstraction

---

### Recommendation: **Option 1 (Registry-Based Factory)**

**Why:**

1. **Already have a registry**: Block metadata lives there
2. **Scalable**: Easy to add 50+ block types
3. **Plugin architecture**: External blocks can register
4. **Code splitting**: Load blocks on demand
5. **Single source of truth**: Component + metadata together

### Complete Example

```typescript
// Step 1: Update blockRegistry.ts
import { lazy, ComponentType } from 'react';

type BlockMetadata = {
  // ...existing fields
  component: ComponentType<any>; // Add this
};

export const BLOCK_REGISTRY = {
  text: {
    category: 'content',
    displayName: 'Text Block',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText/TileInfoText')),
  },
  heading: {
    category: 'content',
    displayName: 'Heading',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoHeading/TileInfoHeading')),
    variants: [/* ... */],
  },
  // ...
};

export function getBlockComponent(type: string): ComponentType<any> | null {
  const metadata = BLOCK_REGISTRY[type];
  return metadata?.component || null;
}

// Step 2: Simplify TileInfoBlock.tsx
import { Suspense } from 'react';
import { getBlockComponent } from '../../utils/blockRegistry';
import BlockSkeleton from './BlockSkeleton';

export default function TileInfoBlock({ block, variant, ...props }: Props) {
  const Component = getBlockComponent(block.type);

  if (!Component) {
    return <UnknownBlockError blockType={block.type} />;
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

// Step 3: Add new block (minimal effort)
// Just add to registry - TileInfoBlock automatically works!
export const BLOCK_REGISTRY = {
  // ...existing blocks
  video: {
    category: 'content',
    displayName: 'Video',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoVideo/TileInfoVideo')),
  },
};
```

### Benefits Summary

| Aspect | Switch Statement | Registry Factory |
|--------|-----------------|------------------|
| **Add new block** | Update switch + import | Add to registry only |
| **Code splitting** | ❌ No | ✅ Yes (lazy) |
| **Plugin support** | ❌ Hard | ✅ Easy |
| **Lines of code** | ~20 lines | ~10 lines |
| **Maintainability** | ⚠️ Medium | ✅ High |
| **Type safety** | ✅ Yes | ✅ Yes |
| **Testability** | ⚠️ Medium | ✅ High (mock registry) |

---

## Summary

### Separate Routes: **Yes, Recommended**

- Better code splitting
- Clear permissions
- Bookmarkable URLs
- Independent data loading
- **Worth the extra route definitions**

### Block Factory: **Yes, Registry-Based**

- Aligns with existing registry
- Enables code splitting
- Simplifies adding blocks
- **Worth the abstraction**

---

## Next Steps

1. **Create ADR for separate routes** (if accepted)
2. **Implement registry-based factory** (high priority, quick win)
3. **Migrate routes** (medium priority, coordinate with backend)

---

## References

- [React Router Nested Routes](https://reactrouter.com/en/main/start/tutorial#nested-routes)
- [React Code Splitting](https://react.dev/reference/react/lazy)
- [Plugin Architecture ADR](../adr/0002-plugin-architecture.md)
- [Block Registry](../../src/pages/TeachingCourse/utils/blockRegistry.ts)
