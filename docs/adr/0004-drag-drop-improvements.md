# ADR 0004: Drag & Drop System Improvements

**Status:** Proposed

**Date:** 2025-01

**Deciders:** Development Team

**Related:**
- [Drag & Drop Implementation Guide](../guides/drag-drop-implementation.md)
- [Improvement Questions - Q6](../discussions/improvement-questions.md#q6-collision-detection-algorithm)

---

## Context

The current drag-and-drop system has several usability issues:

### Current Problems

1. **Inconsistent Visual Feedback**
   - Overlays have different styling for blocks vs accordions
   - Drag handles and hover states are not uniform
   - Hard to tell what's draggable vs what's not

2. **Unpredictable Drop Locations**
   - Blocks sometimes drop in unexpected locations
   - Collision detection using `closestCenter` doesn't always feel intuitive
   - Users don't know where the block will land until they drop it

3. **No Drop Preview**
   - No visual indicator showing where block will be placed
   - Users must drop to see the result, then undo if wrong

4. **Implicit Drop Zones**
   - Drop zones are not clearly defined
   - Users rely on collision detection instead of explicit targets

### Current Implementation

```typescript
// Uses closestCenter collision detection
const collisionDetectionStrategy = closestCenter;

// Custom collision logic in dragDropHelpers.ts
export function findCollisions(/* ... */) {
  // Complex logic to determine drop location
}
```

**Issues:**
- Collision detection is mathematical, not visual
- No clear "drop here" indicators
- Difficult to debug drop behavior

---

## Decision

We will implement a **Zone-Based Drag & Drop System** with **Visual Drop Preview**.

### Core Principles

1. **Explicit Drop Zones**: Every droppable area has a visible drop zone
2. **Visual Preview**: Show exactly where block will land before dropping
3. **Consistent Feedback**: Unified styling for all draggable items
4. **Clear Affordances**: Obvious drag handles and drop targets

### New Architecture

```typescript
// 1. Zone-Based Drop Targets
<DropZone
  accepts={['block', 'accordion']}
  position="before"
  onDrop={handleDrop}
>
  {isOver && <DropIndicator />}
</DropZone>

// 2. Visual Drop Preview
<DragPreview
  item={draggedItem}
  targetLocation={hoveredZone}
  isValid={canDrop}
/>

// 3. Unified Drag Handle
<DragHandle
  item={item}
  variant="block" // or "accordion"
  disabled={!isDraggable}
/>
```

---

## Implementation Plan

### Phase 1: Drop Zone Components (High Priority)

#### 1.1 Create DropZone Component

```typescript
// src/pages/TeachingCourse/components/DropZone/DropZone.tsx

type DropZoneProps = {
  // What can be dropped here
  accepts: Array<'block' | 'accordion' | 'columnLayout'>;

  // Position relative to sibling
  position: 'before' | 'after' | 'inside';

  // Parent context
  parentId: number;
  parentType: 'tile' | 'accordion' | 'column';

  // Drop handler
  onDrop: (item: DraggedItem) => void;

  // Visual customization
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
};

export function DropZone(props: DropZoneProps) {
  const { accepts, position, onDrop, size = 'medium' } = props;

  const { isOver, canDrop } = useDroppable({
    id: `dropzone-${parentId}-${position}`,
    data: {
      accepts,
      position,
      parentId,
      parentType,
    }
  });

  return (
    <div
      className={cn(
        styles.dropZone,
        styles[size],
        isOver && styles.isOver,
        canDrop && styles.canDrop,
        !canDrop && isOver && styles.invalid
      )}
    >
      {isOver && canDrop && <DropIndicator />}
    </div>
  );
}
```

**Styling:**

```scss
.dropZone {
  position: relative;
  min-height: 8px;
  transition: all 0.2s ease;

  &.small { min-height: 4px; }
  &.medium { min-height: 8px; }
  &.large { min-height: 16px; }

  // Default state - subtle
  background: transparent;
  border: 2px dashed transparent;

  // Hovering with valid item
  &.canDrop {
    background: rgba(var(--primary-color-rgb), 0.05);
    border-color: rgba(var(--primary-color-rgb), 0.3);
  }

  // Actively hovering
  &.isOver.canDrop {
    background: rgba(var(--primary-color-rgb), 0.1);
    border-color: var(--primary-color);
    min-height: 40px; // Expand for better targeting
  }

  // Invalid drop
  &.invalid {
    background: rgba(255, 0, 0, 0.05);
    border-color: rgba(255, 0, 0, 0.3);
  }
}
```

#### 1.2 Create DropIndicator Component

```typescript
// Visual indicator showing where item will be placed
export function DropIndicator() {
  return (
    <div className={styles.dropIndicator}>
      <div className={styles.line} />
      <div className={styles.label}>Drop here</div>
    </div>
  );
}
```

```scss
.dropIndicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;

  .line {
    flex: 1;
    height: 2px;
    background: var(--primary-color);
    position: relative;

    // Arrow indicators
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--primary-color);
      border-radius: 50%;
    }

    &::before { left: 0; }
    &::after { right: 0; }
  }

  .label {
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-color);
    white-space: nowrap;
  }
}
```

---

### Phase 2: Visual Drop Preview (High Priority)

#### 2.1 Create DragPreview Component

```typescript
// Shows ghost of item at drop location
export function DragPreview() {
  const { active, over } = useDndContext();

  if (!active || !over) return null;

  const canDrop = checkCanDrop(active.data, over.data);

  return (
    <DragOverlay>
      <div
        className={cn(
          styles.dragPreview,
          canDrop ? styles.valid : styles.invalid
        )}
      >
        {/* Render preview of dragged item */}
        <DraggedItemPreview item={active.data.current} />
      </div>
    </DragOverlay>
  );
}
```

```scss
.dragPreview {
  opacity: 0.8;
  transform: rotate(2deg);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);

  &.valid {
    border: 2px solid var(--primary-color);
  }

  &.invalid {
    border: 2px solid #ef4444;
    opacity: 0.5;
  }
}
```

#### 2.2 Create InsertionPreview Component

```typescript
// Shows placeholder at exact drop location
export function InsertionPreview() {
  const { active, over } = useDndContext();

  if (!active || !over) return null;

  const dropIndex = calculateDropIndex(active, over);

  return (
    <Portal>
      <div
        style={{
          position: 'absolute',
          top: over.rect.top,
          left: over.rect.left,
          width: over.rect.width,
          height: over.rect.height,
        }}
        className={styles.insertionPreview}
      >
        <div className={styles.placeholder}>
          {/* Preview of where item will appear */}
        </div>
      </div>
    </Portal>
  );
}
```

---

### Phase 3: Unified Drag Styling (Medium Priority)

#### 3.1 Standardize Drag Handles

```typescript
export function DragHandle({ item, variant }: DragHandleProps) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: item.id,
    data: item
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        styles.dragHandle,
        styles[variant] // 'block' | 'accordion' | 'tile'
      )}
      aria-label="Drag to reorder"
    >
      <GripVertical size={16} />
    </button>
  );
}
```

**Unified Styling:**

```scss
.dragHandle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 4px;
  border-radius: 4px;
  color: #9ca3af;
  cursor: grab;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #4b5563;
  }

  &:active {
    cursor: grabbing;
  }

  // Variant-specific sizing
  &.block { width: 20px; height: 20px; }
  &.accordion { width: 28px; height: 28px; }
  &.tile { width: 32px; height: 32px; }
}
```

#### 3.2 Consistent Drag Overlays

```scss
// Global drag overlay styles
.dragging {
  position: relative;

  // Consistent overlay for all items
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(var(--primary-color-rgb), 0.1);
    border: 2px solid var(--primary-color);
    border-radius: 8px;
    pointer-events: none;
  }
}

.draggedItem {
  opacity: 0.5;
  pointer-events: none;
}
```

---

### Phase 4: Improved Collision Detection (Medium Priority)

#### 4.1 Custom Collision Strategy

```typescript
// src/pages/TeachingCourse/utils/collisionDetection.ts

export function zoneBasedCollision(args: CollisionArgs) {
  const { active, droppableRects, droppableContainers } = args;

  // Priority 1: Check explicit drop zones
  const dropZones = droppableContainers.filter(
    container => container.id.toString().startsWith('dropzone-')
  );

  for (const zone of dropZones) {
    const rect = droppableRects.get(zone.id);
    if (!rect) continue;

    // Check if pointer is within zone
    if (isPointerWithinRect(args.pointerCoordinates, rect)) {
      return [{ id: zone.id }];
    }
  }

  // Priority 2: Fall back to closest center for backward compatibility
  return closestCenter(args);
}

function isPointerWithinRect(
  pointer: { x: number; y: number },
  rect: ClientRect
): boolean {
  return (
    pointer.x >= rect.left &&
    pointer.x <= rect.right &&
    pointer.y >= rect.top &&
    pointer.y <= rect.bottom
  );
}
```

**Usage:**

```typescript
<DndContext collisionDetection={zoneBasedCollision}>
  {/* Components */}
</DndContext>
```

---

## Usage Examples

### Example 1: Tile with Drop Zones

```tsx
function TileComponent({ tile }: { tile: Tile }) {
  return (
    <div className={styles.tile}>
      {/* Drop zone before all children */}
      <DropZone
        accepts={['block', 'accordion']}
        position="before"
        parentId={tile.id}
        parentType="tile"
        onDrop={handleDropAtStart}
      />

      {/* Render children with drop zones between */}
      {tile.children.map((child, index) => (
        <Fragment key={child.id}>
          <TileChild child={child} />

          {/* Drop zone after each child */}
          <DropZone
            accepts={['block', 'accordion']}
            position="after"
            parentId={tile.id}
            parentType="tile"
            onDrop={(item) => handleDropAfter(index, item)}
          />
        </Fragment>
      ))}
    </div>
  );
}
```

### Example 2: Accordion with Nested Drop Zones

```tsx
function AccordionComponent({ accordion }: { accordion: Accordion }) {
  return (
    <div className={styles.accordion}>
      <DragHandle item={accordion} variant="accordion" />

      <div className={styles.content}>
        <DropZone
          accepts={['block', 'columnLayout']}
          position="inside"
          parentId={accordion.id}
          parentType="accordion"
          onDrop={handleDropInside}
          size="large"
        />

        {accordion.children.map((child, index) => (
          <Fragment key={child.id}>
            <DropZone
              accepts={['block', 'columnLayout']}
              position="before"
              parentId={accordion.id}
              parentType="accordion"
              onDrop={(item) => handleDropAt(index, item)}
            />

            <AccordionChild child={child} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
```

---

## Migration Strategy

### Phase 1: Add Drop Zones (Non-Breaking)
1. Create DropZone and DropIndicator components
2. Add drop zones alongside existing drag logic
3. Keep current collision detection as fallback
4. Test with both systems running

### Phase 2: Enable Zone-Based Detection
1. Switch to `zoneBasedCollision` strategy
2. Monitor for regressions
3. Adjust zone sizes and positioning
4. Gather user feedback

### Phase 3: Add Visual Previews
1. Implement DragPreview component
2. Add InsertionPreview for exact positioning
3. Test with different block types
4. Refine animations and transitions

### Phase 4: Cleanup
1. Remove old collision logic (if fully replaced)
2. Standardize all drag handles
3. Update documentation
4. Add visual regression tests

**Timeline:** ~2-3 days

---

## Consequences

### Positive

- ✅ **Clear drop targets**: Users know exactly where items can be dropped
- ✅ **Visual preview**: See placement before dropping
- ✅ **Fewer errors**: Explicit zones reduce unexpected drops
- ✅ **Better UX**: More intuitive drag-and-drop experience
- ✅ **Easier debugging**: Drop zones are explicit components
- ✅ **Testable**: Can test drop zones independently
- ✅ **Consistent styling**: Unified drag handles and overlays

### Negative

- ⚠️ **More DOM elements**: Drop zones add extra divs
- ⚠️ **Increased complexity**: More components to manage
- ⚠️ **Performance**: More collision checks (mitigated by priority system)
- ⚠️ **Migration effort**: Need to update all drag-drop code

### Trade-offs

- **Explicit vs Implicit**: Trade mathematical collision for visual zones
- **Flexibility vs Predictability**: Zones are more constrained but more predictable
- **Performance vs UX**: Slight performance cost for better user experience

---

## Alternatives Considered

### Alternative 1: Keep Current System, Improve Styling Only
- **Rejected**: Doesn't solve core usability issues
- Still relies on collision detection
- Drop locations remain unpredictable

### Alternative 2: Use Drag-and-Drop Library with Built-in Zones
- **Considered**: React DnD, react-beautiful-dnd
- **Rejected**: Already using @dnd-kit, would require full rewrite
- Can achieve same results with @dnd-kit customization

### Alternative 3: Magnetic Drop Points
- **Deferred**: Interesting but complex
- Could be added later as enhancement
- Zones + preview solve immediate problems

---

## Open Questions

1. **Drop zone size**: Should zones expand when hovering? How much?
2. **Touch devices**: How do zones work on mobile/tablet?
3. **Accessibility**: How do keyboard users interact with zones?
4. **Animation**: Should items animate to drop location?
5. **Multi-select**: Can multiple items be dragged at once?

These will be addressed during implementation and user testing.

---

## Success Metrics

### Measure Before/After

1. **Drop accuracy**: % of drops that land where users expect
2. **Time to drop**: Average time to complete a drag-drop operation
3. **Error rate**: Number of undo operations after drops
4. **User feedback**: Qualitative feedback on ease of use

### Target Improvements

- Drop accuracy: 60% → 95%
- Error rate: -70%
- User satisfaction: +50%

---

## References

- [Drag & Drop Implementation Guide](../guides/drag-drop-implementation.md)
- [Improvement Questions - Q6](../discussions/improvement-questions.md#q6-collision-detection-algorithm)
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [React DnD Patterns](https://react-dnd.github.io/react-dnd/docs/overview)
