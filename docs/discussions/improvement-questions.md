# Teaching Course Builder - Improvement Questions

This document contains questions and suggestions for improving the scalability and maintainability of the Teaching Course builder system.

## 📚 Documentation Status

Many questions in this document have been addressed with formal documentation:

### ✅ Documented (High Priority)
- **Q3: Data Structure** → [ADR 0001: Data Structure Architecture](../adr/0001-data-structure-architecture.md)
- **Q6: Drag & Drop Improvements** → [ADR 0004: Drag & Drop Improvements](../adr/0004-drag-drop-improvements.md)
- **Q8: Shared Component Logic** → [Guide: Shared Component Logic Extraction](../guides/shared-component-logic-extraction.md)
- **Q9: Separate Routes** → [ADR 0008: Separate Routes for Course Variants](../adr/0008-separate-routes-for-course-variants.md)
- **Q10: Block Factory** → [ADR 0009: Block Registry Factory Pattern](../adr/0009-block-registry-factory.md)

### ✅ Documented (Medium Priority)
- **Q2: Data Persistence** → [ADR 0005: Data Persistence Architecture](../adr/0005-data-persistence-architecture.md)
- **Q4: UUID Migration** → [ADR 0006: UUID Migration Plan](../adr/0006-uuid-migration.md)
- **Q5: Validation System** → [ADR 0007: Validation System Architecture](../adr/0007-validation-system.md)

### 📝 Pending Documentation (Low Priority)
- Q1: State Management (Redux sketch)
- Q7: Performance optimization strategies
- Q11-Q16: Various component improvements

---

## Table of Contents

1. [State Management & Data Flow](#state-management--data-flow)
2. [Type System & Data Structure](#type-system--data-structure)
3. [Drag & Drop System](#drag--drop-system)
4. [Component Architecture](#component-architecture)
5. [Performance & Optimization](#performance--optimization)
6. [Developer Experience](#developer-experience)
7. [Testing & Validation](#testing--validation)

---

## State Management & Data Flow

### Q1: Global State Management

**Current State**: The entire `tileInfo` state is managed in `TeachingCourseTemplate.tsx` using `useState`, and all mutations are performed by cloning the entire tree.

**Questions**:

1. As the course content grows (100+ blocks), have you noticed any performance issues with re-rendering?
2. Would you consider migrating to a state management library (Redux, Zustand, Jotai) for better:

   - Undo/redo functionality
   - Optimistic updates
   - State persistence/autosave
   - Time-travel debugging

3. Would you like to implement **granular updates** where only modified blocks re-render, instead of cloning the entire tree?

**Answers**:

Low priority

1. Haven't tried it yet, not my main concern right now.
2. Not in this demo. We will eventually use Redux. You can sketch ideas, but do NOT implement them yet.

**Trade-offs**:

- ✅ Current approach: Simple, predictable, immutable
- ⚠️ Potential issue: Performance degrades with large trees
- ✅ State library: Better performance, undo/redo, more complex setup

---

### Q2: Data Persistence

**Current State**: No explicit save/autosave mechanism is implemented.

**Questions**:

1. How should changes be persisted to the backend?

   - On every change (real-time autosave)?
   - Debounced autosave (every N seconds)?
   - Manual save button?
   - Save on blur/navigation?

2. Should there be conflict resolution for multi-user editing?

3. Do you need versioning/revision history?

**Answers**:

Medium priority

1. There will be a manual save button. However, we are looking into every change and debounced autosave. Please provide some ideas on how this can be done.
2. Yeah, even though it's unlikely that multiple users will edit at the same time.
3. Not right now.

---

## Type System & Data Structure

### Q3: Unified vs Discriminated Children Arrays

**Current State**: `tile.children` and `accordion.children` contain mixed types: `(TileInfoBlock | TileInfoAccordion | TileInfoColumnLayout)[]`

**Questions**:

1. Is the current unified array approach working well, or would you prefer **separate arrays** for different types?

   ```typescript
   // Option A: Current (Unified)
   children: (TileInfoBlock | TileInfoAccordion | TileInfoColumnLayout)[]

   // Option B: Separated
   blocks: TileInfoBlock[]
   rows: TileInfoAccordion[]
   layouts: TileInfoColumnLayout[]
   ```

2. The current structure requires checking `child.type` frequently. Would you prefer stronger TypeScript discrimination?

**Trade-offs**:

- ✅ Unified: Easier ordering/sorting across types
- ✅ Separated: Clearer intent, better type safety, easier to reason about
- ⚠️ Unified: Requires more type guards and runtime checks

**Answers**:

High priority

1. The one that is easier to maintain in the long run.
2. Yes

---

### Q4: Block IDs and References

**Current State**: Blocks use numeric IDs (`id: number`) and `parentId` for relationships.

**Questions**:

1. Should IDs be **UUIDs** instead of numbers for better:

   - Offline-first/optimistic updates
   - Multi-user collaboration
   - Avoiding ID conflicts

2. Is the `parentId` approach sufficient, or would you like a more robust **parent-child reference system** (e.g., storing path arrays)?

3. Should blocks store their **full path** (e.g., `[tileId, rowId, layoutId, columnId]`) for faster lookups?

**Answers**:

Medium priority

1. Let's do UUIDs. Using numbers should be fine, but it's better to be safer to avoid ID conflicts.
2. What is the up and downsides of using a parent-child reference system?
3. Faster lookups sounds good. What are the downsides? I imagine that it's more prone to errors, because you need to be careful with updating all ids.

---

### Q5: Nesting Depth Limits

**Current State**: Accordions can be infinitely nested.

**Questions**:

1. Should there be a **maximum nesting depth** for accordions to prevent:

   - Performance issues
   - UX complexity (too deeply nested = confusing)
   - Stack overflow in recursive functions

2. What's a reasonable max depth? (Suggestion: 3-5 levels)

3. Should the UI disable "Add Accordion" when max depth is reached?

**Answers**:

Low priority

1. Not now.
2. 3-5 sounds reasonable, but since we are not sure yet. I would rather keep it "infinite".
3. Not right now, it's a problem for later.

---

## Drag & Drop System

### Q6: Collision Detection Algorithm

**Current State**: Uses `closestCenter` strategy with custom collision detection logic.

**Questions**:

1. Are you satisfied with the **drag & drop precision**?

   - Do blocks sometimes drop in unexpected locations?
   - Is the visual feedback clear enough?

2. Would you benefit from **zone-based dropping** (explicit drop zones) instead of collision detection?

3. Should there be a **preview** of where the block will land before dropping?

**Answers**:

High priority

1. The visual feedback can be improved. The overlays are not uniform and I think it's because the blocks and accordion have different styling when dragging. Yes the blocks do sometimes drop in unexpected locations.
2. Yes.
3. Yes.

---

### Q7: Drag Restrictions & Validation

**Current State**: Category-based restrictions prevent containers from swapping with content blocks.

**Questions**:

1. Are the current restrictions sufficient, or do you need more granular rules?

   - E.g., "Text blocks can only go in columns with max 2 blocks"
   - E.g., "Heading must be first child in accordion"

2. Should validation errors be **shown to users** (e.g., toast notifications, visual feedback)?

3. Would you like a **validation system** that runs before allowing drops?

**Answers**:

Low priority

1. No current restrictions are fine. It may need some fine-tuning, but I don't want granular rules.
2. Yes, but not now.
3. Not yet.

---

### Q8: Undo/Redo for Drag Operations

**Current State**: No undo/redo mechanism.

**Questions**:

1. Is undo/redo for drag operations a priority?

2. Should undo/redo extend to **all operations** (add, delete, edit, reorder)?

3. Preferred implementation:
   - Command pattern with history stack
   - State snapshots (simple but memory-intensive)
   - Event sourcing

**Answers**:

Not applicable

1. No, not a priority. It over complicates the system.
2. It should, but not our concern right now.
3. Not preference.

---

## Component Architecture

### Q9: Variant System (Template/Edit/Read)

**Current State**: Components accept a `variant` prop to switch between modes, but `edit` and `read` variants are mostly stubs.

**Questions**:

1. What's the **intended difference** between the three variants?

   - **Template**: Building the course structure (current implementation)
   - **Edit**: Editing course content?
   - **Read**: Read-only view for students?

2. Should variants be **separate components** or continue using the prop pattern?

3. Do edit/read variants need **separate routing** (/course/:id/template, /course/:id/edit, /course/:id/view)?

**Answers**:

High priority

1. Correct, but we are still figuring out the templating part. So nothing is done yet for the edit and read variants.
2. Whichever is better for maintainability and scalability.
3. What are the up and downsides for separating the routes? Will it improve the maintainability?

---

### Q10: Component Composition

**Current State**: Deep component nesting (TeachingCourseTemplate → RecursiveRowRenderer → TileInfoAccordion → TileInfoBlock → TileInfoText).

**Questions**:

1. Is the current component hierarchy easy to understand and maintain?

2. Would you benefit from **compound components** pattern?

   ```tsx
   <CourseBuilder>
     <CourseBuilder.Tile>
       <CourseBuilder.Accordion>
         <CourseBuilder.Block type="text" />
       </CourseBuilder.Accordion>
     </CourseBuilder.Tile>
   </CourseBuilder>
   ```

3. Should there be a **block factory** component instead of the current switch statement in `TileInfoBlock.tsx`?

**Answers**:

High priority

1. I would say so.
2. Probably, because we might possibly have fixed tile types where the blocks are predefined to give users a starting point. Using the compound components pattern should make it easier to prepare it. What do you think?
3. Can you give me an example of how the block factory will be used and what the benefits and tradeoffs are?

---

### Q11: Shared Component Logic

**Current State**: Each block component (Text, Dropdown, Heading) has similar patterns for drag, hover, actions.

**Questions**:

1. Would you like to extract shared logic into:

   - **Custom hooks** (`useDraggableBlock`, `useBlockActions`)
   - **Higher-order components** (`withDraggable(TileInfoText)`)
   - **Render props** pattern

2. Is the current `TileInfoBaseTemplate` sufficient for shared UI, or should it be more flexible?

**Answers**:

High priority

1. Yes please.
2. I think it's fine for now, but I would like to know in what ways it could be more flexible?

---

## Performance & Optimization

### Q12: Rendering Performance

**Current State**: The entire tree re-renders on any state change.

**Questions**:

1. Have you profiled the application with React DevTools?

2. Would you like to implement:

   - **React.memo** for pure components
   - **useMemo/useCallback** for expensive computations
   - **Virtualization** for long lists of blocks (e.g., react-window)

3. At what scale (number of blocks) do you expect performance issues?

**Answers**:

Low priority

1. Not yet. I want to focus on making it work first.
2. Use useMemo and useCallback. Virtualization is nice, but it can be added later no?

---

### Q13: Large Course Content

**Questions**:

1. What's the expected **maximum size** of a course?

   - Number of tiles?
   - Number of accordions?
   - Number of blocks per accordion?

2. Should there be **pagination or lazy loading** for:

   - Large lists of courses
   - Tiles within a course
   - Blocks within an accordion

3. Would you benefit from **code splitting** to load block components on demand?

**Answers**:

Medium priority

1. Estimation is roughly 30 tiles. Number of accordions depends on the situations. It's not always used, but expect about three accordions per tile. Sometimes it's more, but I expect it may only be double the size. Hard to make estimations, since we are still figuring out which blocks we need. For now, expect about 1-6 blocks in each accordion.
2. Only lazy loading.
3. Yeah sounds good.

---

## Developer Experience

### Q14: Block Registry Expansion

**Current State**: `BLOCK_REGISTRY` contains metadata for all block types.

**Questions**:

1. As you add more block types (Image, Video, Embed, Quiz, etc.), would you like:

   - **Plugin architecture** where block types are registered dynamically
   - **Code generation** for new block types (CLI tool?)
   - **JSON schema** for block definitions

2. Should block metadata include:
   - Validation rules (e.g., "heading max 100 characters")
   - Default values
   - Render settings (icons, colors, preview modes)

**Answers**:

High priority

1. Plugin architecture would be good. Refer to the ADR
2. Validation should be done inside the plugin architecture. No default values.

---

### Q15: Error Handling & Logging

**Current State**: Limited error handling in drag handlers (returns `null` on errors).

**Questions**:

1. Should errors be:

   - Logged to console/monitoring service (Sentry, LogRocket)?
   - Shown to users as toast notifications?
   - Silently handled?

2. What errors should be **recoverable** vs **fatal**?

3. Would you like **error boundaries** around specific components to prevent full app crashes?

**Answer**:

Low priority

1. Will be implemented later.
2. No clue yet.
3. Yes.

---

### Q16: Development Tools

**Questions**:

1. Would you benefit from a **debug panel** showing:

   - Current drag state
   - Block hierarchy
   - Performance metrics

2. Should there be **Storybook** stories for all block types?

3. Would you like **visual regression testing** for the builder UI?

**Answers**:

Low priority

1. Block hierarchy would good.
2. No.
3. No.

---

## Testing & Validation

### Q17: Testing Strategy

**Current State**: No tests visible in the provided code.

**Questions**:

1. What level of testing do you need?

   - **Unit tests**: Utility functions (dragDropHelpers, blockRegistry)
   - **Integration tests**: Drag & drop interactions
   - **E2E tests**: Full user workflows (Playwright, Cypress)

2. Should drag & drop operations have **visual regression tests**?

3. Do you need **accessibility testing** (ARIA labels, keyboard navigation)?

**Answers**:

Low priority

1. Mostly unit, but at a later stage
2. No.
3. No.

---

### Q18: Data Validation

**Questions**:

1. Should course data be validated against a **schema** (Zod, Yup, JSON Schema)?

2. Where should validation occur?

   - On every state change (client-side)
   - Before saving (client-side + server-side)
   - Only on server-side

3. What validations are needed?
   - Required fields (e.g., accordion must have a name)
   - Content length limits
   - Structure constraints (e.g., "at least one block per accordion")

**Answers**:

Medium priority

1. React-hook-form + Zod would be good, but for now with just typescript.
2. I think before saving.
3. Required fields and structure constraints.

---

## Additional Considerations

### Q19: Accessibility (a11y)

**Questions**:

1. Should the builder be **keyboard-navigable**?

   - Arrow keys to navigate blocks
   - Enter/Space to activate drag
   - Tab to move between edit fields

2. Should there be **screen reader support**?

   - Announce drag operations
   - Describe block hierarchy

3. Do you need **WCAG 2.1 Level AA compliance**?

**Answers**:

Low priority

1. No.
2. No.
3. No.

---

### Q20: Mobile/Touch Support

**Current State**: @dnd-kit supports touch, but UI might not be optimized for mobile.

**Questions**:

1. Should the builder work on **tablets**?

2. Should there be a **separate mobile interface**, or should it be responsive?

3. Are touch gestures (long-press to drag, swipe to delete) needed?

**Answers**:

Low priority

1. No.
2. Maybe, but later.
3. Maybe, but later.

---

### Q21: Collaboration Features

**Questions**:

1. Will multiple users edit the same course simultaneously?

2. If yes, do you need:

   - **Real-time collaboration** (WebSockets, operational transforms)
   - **Locking mechanism** (lock block when someone is editing)
   - **Conflict resolution** UI

3. Should users see **who is currently viewing/editing** a course?

**Answers**:

Low priority

1. Unlikely.
2.
3. No.

---

### Q22: Content Versioning

**Questions**:

1. Should courses have **version history**?

   - View previous versions
   - Restore to a previous version
   - Diff between versions

2. Should there be **draft vs published** states?

3. Do you need **approval workflows** before publishing changes?

**Answers**:

Medium priority

1. Unlikely.
2. Yes.
3. No.

---

## Summary

Please review these questions and let me know which areas are:

1. **High priority** - Need immediate attention
2. **Medium priority** - Nice to have, can be deferred
3. **Low priority** - Future consideration
4. **Not applicable** - Won't be needed

I can then create detailed technical proposals for the high-priority items.

---

## Notes for Future Discussions

- Consider documenting **architectural decision records (ADRs)** for major choices
- Create a **roadmap** for phased improvements
- Establish **coding conventions** and **contribution guidelines** if this becomes a team project
