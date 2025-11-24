# ADR 0008: Separate Routes for Course Variants

**Status:** Proposed

**Date:** 2025-01

**Deciders:** Development Team

**Tech Stack:** React Router v5

**Related:**
- [Component Architecture Questions](../discussions/component-architecture-questions.md#q9-separate-routes-for-variants-templateeditread)
- [Data Persistence Architecture](0005-data-persistence-architecture.md)

---

## Context

The Teaching Course Builder has three distinct modes:

1. **Template Mode**: Teachers build course structure (drag & drop blocks, rows, columns)
2. **Edit Mode**: Teachers edit content (fill in text, configure settings)
3. **Read Mode**: Students view published content (read-only)

### Current Approach

Single component with variant prop:
```typescript
<TeachingCourse variant="template" />
```

**Problems:**
- ❌ No URL state (can't bookmark or share)
- ❌ No code splitting (all mode code loaded at once)
- ❌ Hard to guard with permissions
- ❌ Poor maintainability (large component with if/else)

---

## Decision

Implement **separate routes** for each course variant:

```
/course/:id/template  → Template Mode
/course/:id/edit      → Edit Mode
/course/:id/view      → Read Mode
```

### Route Configuration (React Router v5)

```typescript
// src/App.tsx or src/router.tsx

import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const TeachingCourseTemplate = lazy(() => import('./pages/TeachingCourse/variants/template'));
const TeachingCourseEdit = lazy(() => import('./pages/TeachingCourse/variants/edit'));
const TeachingCourseView = lazy(() => import('./pages/TeachingCourse/variants/read'));

export default function App() {
  return (
    <BrowserRouter>
      <Switch>
        {/* Template Mode */}
        <Route path="/course/:id/template">
          <RequireRole role="teacher">
            <TeachingCourseLayout>
              <Suspense fallback={<PageSkeleton />}>
                <TeachingCourseTemplate />
              </Suspense>
            </TeachingCourseLayout>
          </RequireRole>
        </Route>

        {/* Edit Mode */}
        <Route path="/course/:id/edit">
          <RequireRole role="teacher">
            <TeachingCourseLayout>
              <Suspense fallback={<PageSkeleton />}>
                <TeachingCourseEdit />
              </Suspense>
            </TeachingCourseLayout>
          </RequireRole>
        </Route>

        {/* View Mode */}
        <Route path="/course/:id/view">
          <TeachingCourseLayout>
            <Suspense fallback={<PageSkeleton />}>
              <TeachingCourseView />
            </Suspense>
          </TeachingCourseLayout>
        </Route>

        {/* Default redirect */}
        <Route exact path="/course/:id">
          <Redirect to="/course/:id/template" />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
```

---

## Rationale

### 1. Clear URL Structure
- ✅ Bookmarkable URLs
- ✅ Shareable links
- ✅ Browser back/forward works naturally

### 2. Code Splitting
**Before:** ~500KB (all modes)
**After:** ~200KB per mode

Students never load template/edit code (saves ~380KB)

### 3. Permission Guards
```typescript
// Route-level protection
<RequireRole role="teacher">
  <TeachingCourseTemplate />
</RequireRole>
```

### 4. Independent Data Loading

Each mode loads only the data it needs using hooks:

```typescript
// Template Mode: Load structure data (~800KB)
function TeachingCourseTemplate() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const [course, templates, assets] = await Promise.all([
        api.getCourse(id),
        api.getTemplates(),
        api.getAssets(),
      ]);
      setData({ course, templates, assets });
    }
    loadData();
  }, [id]);

  if (!data) return <Loading />;

  return <TemplateBuilder {...data} />;
}

// View Mode: Load published content only (~200KB)
function TeachingCourseView() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    api.getPublishedCourse(id).then(setCourse);
  }, [id]);

  if (!course) return <Loading />;

  return <StudentView course={course} />;
}
```

### 5. Better Maintainability
- Separate files for each mode (150 lines each vs 500 lines total)
- Changes to one mode don't affect others
- Easier to test independently

---

## Implementation

### Phase 1: Shared Layout Component

```typescript
// src/pages/TeachingCourse/TeachingCourseLayout.tsx

import { useParams, useLocation } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
};

export default function TeachingCourseLayout({ children }: Props) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Determine current mode from URL
  const currentMode = location.pathname.includes('template')
    ? 'template'
    : location.pathname.includes('edit')
    ? 'edit'
    : 'view';

  return (
    <div className="teaching-course-layout">
      {/* Shared header */}
      <CourseHeader courseId={id} />

      {/* Mode tabs */}
      <ModeTabs courseId={id} currentMode={currentMode} />

      {/* Render mode-specific content */}
      <main className="course-content">
        {children}
      </main>
    </div>
  );
}
```

### Phase 2: Mode Navigation Tabs

```typescript
// src/pages/TeachingCourse/components/ModeTabs.tsx

import { Link, useParams } from 'react-router-dom';
import { useUser } from '../../../hooks/useUser';

type Props = {
  courseId: string;
  currentMode: 'template' | 'edit' | 'view';
};

export function ModeTabs({ courseId, currentMode }: Props) {
  const user = useUser();

  return (
    <nav className="mode-tabs">
      {user.isTeacher && (
        <>
          <Link
            to={`/course/${courseId}/template`}
            className={currentMode === 'template' ? 'active' : ''}
          >
            <Icon name="Layout" />
            Template
          </Link>

          <Link
            to={`/course/${courseId}/edit`}
            className={currentMode === 'edit' ? 'active' : ''}
          >
            <Icon name="Edit" />
            Edit
          </Link>
        </>
      )}

      <Link
        to={`/course/${courseId}/view`}
        className={currentMode === 'view' ? 'active' : ''}
      >
        <Icon name="Eye" />
        Preview
      </Link>
    </nav>
  );
}
```

### Phase 3: Mode-Specific Components

```typescript
// src/pages/TeachingCourse/variants/template/TeachingCourseTemplate.tsx

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function TeachingCourseTemplate() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const [course, templates, assets] = await Promise.all([
        api.getCourse(id),
        api.getTemplates(),
        api.getAssets(),
      ]);
      setData({ course, templates, assets });
    }
    loadData();
  }, [id]);

  if (!data) return <Loading />;

  return (
    <div className="template-mode">
      <TemplateToolbar templates={data.templates} assets={data.assets} />
      <SortableColumnLayout tileInfo={data.course.tileInfo} />
    </div>
  );
}
```

```typescript
// src/pages/TeachingCourse/variants/edit/TeachingCourseEdit.tsx

export default function TeachingCourseEdit() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    api.getCourseWithDraft(id).then(setCourse);
  }, [id]);

  if (!course) return <Loading />;

  return (
    <div className="edit-mode">
      <EditToolbar />
      <ContentEditor tileInfo={course.tileInfo} />
    </div>
  );
}
```

```typescript
// src/pages/TeachingCourse/variants/read/TeachingCourseView.tsx

export default function TeachingCourseView() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    api.getPublishedCourse(id).then(setCourse);
  }, [id]);

  if (!course) return <Loading />;

  return (
    <div className="view-mode">
      <StudentHeader course={course} />
      <CourseContent tileInfo={course.publishedTileInfo} />
      <ProgressTracker courseId={course.id} />
    </div>
  );
}
```

### Phase 4: Permission Guards

```typescript
// src/components/auth/RequireRole.tsx

import { useUser } from '../../hooks/useUser';
import { Redirect } from 'react-router-dom';

type Props = {
  role: 'teacher' | 'student';
  children: React.ReactNode;
};

export function RequireRole({ role, children }: Props) {
  const user = useUser();

  if (role === 'teacher' && !user.isTeacher) {
    return <Redirect to="/access-denied" />;
  }

  return <>{children}</>;
}
```

---

## Migration Strategy

### Week 1: Setup Routes and Layout
1. ✅ Install React Router v5 (if not already installed)
   ```bash
   npm install react-router-dom@5
   npm install --save-dev @types/react-router-dom@5
   ```
2. ✅ Create `TeachingCourseLayout` component with `children` prop
3. ✅ Add route definitions in App.tsx using `<Switch>` and `<Route>`
4. ✅ Create `ModeTabs` navigation component with `<Link>`
5. ✅ Test route navigation

### Week 2: Extract Template Mode
1. ✅ Create `TeachingCourseTemplate` component in `variants/template/`
2. ✅ Move template-specific logic from current `TeachingCourse`
3. ✅ Add data loading with `useEffect` hook
4. ✅ Wrap with `<Suspense>` for lazy loading
5. ✅ Test template mode independently

### Week 3: Extract Edit and View Modes
1. ✅ Create `TeachingCourseEdit` component in `variants/edit/`
2. ✅ Create `TeachingCourseView` component in `variants/read/`
3. ✅ Add mode-specific data loading
4. ✅ Test all three modes and navigation between them

### Week 4: Permissions and Cleanup
1. ✅ Create `RequireRole` guard component using `<Redirect>`
2. ✅ Add permission checks to routes
3. ✅ Remove old `TeachingCourse` component
4. ✅ Optimize bundle sizes (verify code splitting works)
5. ✅ Update tests and documentation

**Total Duration:** ~4 weeks

### Key React Router v5 Differences

- Use `<Switch>` instead of route config objects
- Use `<Route>` with children pattern instead of `element` prop
- Use `useParams<{ id: string }>()` with TypeScript generics
- Use `<Redirect>` instead of `redirect()` function
- Data loading in components with `useEffect` instead of `loader` functions
- Pass `children` prop instead of using `<Outlet />`

---

## Consequences

### Positive
- ✅ Better UX (bookmarkable URLs, shareable links)
- ✅ Faster loads (code splitting reduces bundle size)
- ✅ Clear permissions (route-level guards)
- ✅ Maintainability (separate files for each mode)
- ✅ Optimized data loading (load only needed data)

### Negative
- ⚠️ More route definitions (3 routes instead of 1)
- ⚠️ Navigation complexity (need mode switching UI)
- ⚠️ Initial effort (~4 weeks to migrate)

---

## Alternatives Considered

### Alternative 1: Query Param
```typescript
/course/:id?mode=template
```
**Rejected:** No code splitting, unclear URLs, hard to guard

### Alternative 2: Single Component (Current)
**Rejected:** No URL state, no code splitting, poor maintainability

---

## Success Metrics

- Bundle size: 500KB → 200KB per mode
- Student page load: 3s → 0.8s (5x faster!)
- Code complexity: 500 lines → 150 lines per mode

---

## References

- [React Router v5 Documentation](https://v5.reactrouter.com/)
- [React Router v5 Route Component](https://v5.reactrouter.com/web/api/Route)
- [React Code Splitting](https://react.dev/reference/react/lazy)
- [Component Architecture Questions](../discussions/component-architecture-questions.md)
