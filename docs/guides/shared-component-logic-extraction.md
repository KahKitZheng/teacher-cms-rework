# Shared Component Logic Extraction Guide

This guide shows how to extract shared logic from block components into reusable custom hooks and utilities.

## Overview

Currently, each block component (Text, Dropdown, Heading) has similar patterns for:
- Drag-and-drop functionality
- Hover detection and visual feedback
- Action buttons (Add, Edit, Delete)
- Active/selected states
- Focus management

This duplication makes code harder to maintain and extend. This guide shows how to extract these patterns into **custom hooks**.

---

## Current Duplication

### Example: Text Block Component

```typescript
// TileInfoText.tsx
export default function TileInfoText(props) {
  const {
    tileInfo,
    variant,
    activeBlockId,
    hoveredBlockId,
    isDragOverlay,
    onAddElement,
    onEditElement,
    onDeleteElement,
  } = props;

  // Drag logic (duplicated across all blocks)
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: tileInfo.id,
      data: { type: tileInfo.type, level: 'tile' },
    });

  // Styling (duplicated)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // State tracking (duplicated)
  const isActive = activeBlockId === tileInfo.id;
  const isHovered = hoveredBlockId === tileInfo.id;

  // Render pattern (duplicated)
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        styles.block,
        isActive && styles.active,
        isHovered && styles.hovered,
        isDragOverlay && styles.dragOverlay
      )}
    >
      {/* Action buttons (duplicated) */}
      <button onClick={onAddElement}>Add</button>
      <button onClick={onEditElement}>Edit</button>
      <button onClick={onDeleteElement}>Delete</button>

      {/* Specific content */}
      <input type="text" value={tileInfo.value} />
    </div>
  );
}
```

**This pattern is repeated in:**
- `TileInfoText.tsx`
- `TileInfoDropdown.tsx`
- `TileInfoHeading.tsx`
- `TileInfoAccordion.tsx`
- And every future block type...

---

## Solution: Custom Hooks

Extract shared logic into composable custom hooks:

```typescript
// Proposed structure
useDraggableBlock()   // Drag-and-drop logic
useBlockActions()      // Add/Edit/Delete actions
useBlockState()        // Active/hover state tracking
useBlockStyling()      // CSS class management
```

---

## Implementation

### 1. useDraggableBlock Hook

**Purpose:** Handle all drag-and-drop logic for a block.

```typescript
// src/pages/TeachingCourse/hooks/useDraggableBlock.ts

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type UseDraggableBlockProps = {
  id: number;
  type: string;
  level: 'tile' | 'accordion' | 'column';
  disabled?: boolean;
  data?: Record<string, any>; // Additional drag data
};

type UseDraggableBlockReturn = {
  // Drag state
  isDragging: boolean;
  isOver: boolean;

  // DOM refs and handlers
  setNodeRef: (node: HTMLElement | null) => void;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  attributes: Record<string, any>;
  listeners: Record<string, any>;

  // Styles
  style: React.CSSProperties;
  dragHandleStyle: React.CSSProperties;

  // State
  transform: Transform | null;
  transition: string | undefined;
};

export function useDraggableBlock(
  props: UseDraggableBlockProps
): UseDraggableBlockReturn {
  const { id, type, level, disabled = false, data = {} } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    disabled,
    data: {
      type,
      level,
      ...data,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandleStyle: React.CSSProperties = {
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none', // Prevent scrolling on touch devices
  };

  return {
    isDragging,
    isOver,
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    style,
    dragHandleStyle,
    transform,
    transition,
  };
}
```

**Usage:**

```typescript
function TileInfoText(props) {
  const { tileInfo } = props;

  const draggable = useDraggableBlock({
    id: tileInfo.id,
    type: tileInfo.type,
    level: 'tile',
  });

  return (
    <div ref={draggable.setNodeRef} style={draggable.style}>
      <button
        ref={draggable.setActivatorNodeRef}
        style={draggable.dragHandleStyle}
        {...draggable.attributes}
        {...draggable.listeners}
      >
        <GripVertical size={16} />
      </button>

      {/* Content */}
    </div>
  );
}
```

---

### 2. useBlockState Hook

**Purpose:** Track active, hovered, and selected states.

```typescript
// src/pages/TeachingCourse/hooks/useBlockState.ts

type UseBlockStateProps = {
  blockId: number;
  activeBlockId?: number | null;
  hoveredBlockId?: number | null;
  selectedBlockIds?: number[];
  isDragOverlay?: boolean;
};

type UseBlockStateReturn = {
  isActive: boolean;
  isHovered: boolean;
  isSelected: boolean;
  isDragOverlay: boolean;
  isFocused: boolean;

  // Combined states
  isHighlighted: boolean; // Active OR hovered
  isInteractive: boolean; // Can be clicked/edited
};

export function useBlockState(props: UseBlockStateProps): UseBlockStateReturn {
  const {
    blockId,
    activeBlockId,
    hoveredBlockId,
    selectedBlockIds = [],
    isDragOverlay = false,
  } = props;

  const isActive = activeBlockId === blockId;
  const isHovered = hoveredBlockId === blockId;
  const isSelected = selectedBlockIds.includes(blockId);
  const isFocused = document.activeElement?.getAttribute('data-block-id') === String(blockId);

  const isHighlighted = isActive || isHovered;
  const isInteractive = !isDragOverlay;

  return {
    isActive,
    isHovered,
    isSelected,
    isDragOverlay,
    isFocused,
    isHighlighted,
    isInteractive,
  };
}
```

**Usage:**

```typescript
function TileInfoText(props) {
  const { tileInfo, activeBlockId, hoveredBlockId, isDragOverlay } = props;

  const state = useBlockState({
    blockId: tileInfo.id,
    activeBlockId,
    hoveredBlockId,
    isDragOverlay,
  });

  return (
    <div
      className={cn(
        styles.block,
        state.isActive && styles.active,
        state.isHovered && styles.hovered,
        state.isDragOverlay && styles.dragOverlay
      )}
    >
      {/* Content */}
    </div>
  );
}
```

---

### 3. useBlockActions Hook

**Purpose:** Handle add, edit, delete, and duplicate actions.

```typescript
// src/pages/TeachingCourse/hooks/useBlockActions.ts

type UseBlockActionsProps = {
  blockId: number;
  blockType: string;
  parentId: number;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
};

type UseBlockActionsReturn = {
  handleAdd: () => void;
  handleEdit: () => void;
  handleDelete: () => void;
  handleDuplicate: () => void;

  // Action availability
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;

  // Confirmation states (for dangerous actions)
  showDeleteConfirm: boolean;
  confirmDelete: () => void;
  cancelDelete: () => void;
};

export function useBlockActions(props: UseBlockActionsProps): UseBlockActionsReturn {
  const { blockId, blockType, onAdd, onEdit, onDelete, onDuplicate } = props;

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Check if actions are available
  const canAdd = Boolean(onAdd);
  const canEdit = Boolean(onEdit);
  const canDelete = Boolean(onDelete);
  const canDuplicate = Boolean(onDuplicate);

  const handleAdd = React.useCallback(() => {
    onAdd?.();
  }, [onAdd]);

  const handleEdit = React.useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  const handleDelete = React.useCallback(() => {
    // Show confirmation for delete
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    onDelete?.();
    setShowDeleteConfirm(false);
  }, [onDelete]);

  const cancelDelete = React.useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const handleDuplicate = React.useCallback(() => {
    onDuplicate?.();
  }, [onDuplicate]);

  return {
    handleAdd,
    handleEdit,
    handleDelete,
    handleDuplicate,
    canAdd,
    canEdit,
    canDelete,
    canDuplicate,
    showDeleteConfirm,
    confirmDelete,
    cancelDelete,
  };
}
```

**Usage:**

```typescript
function TileInfoText(props) {
  const { tileInfo, onAddElement, onEditElement, onDeleteElement } = props;

  const actions = useBlockActions({
    blockId: tileInfo.id,
    blockType: tileInfo.type,
    parentId: tileInfo.parentId,
    onAdd: onAddElement,
    onEdit: onEditElement,
    onDelete: onDeleteElement,
  });

  return (
    <div>
      {/* Content */}

      <div className={styles.actions}>
        {actions.canAdd && (
          <button onClick={actions.handleAdd}>Add</button>
        )}
        {actions.canEdit && (
          <button onClick={actions.handleEdit}>Edit</button>
        )}
        {actions.canDelete && (
          <button onClick={actions.handleDelete}>Delete</button>
        )}
      </div>

      {/* Delete confirmation modal */}
      {actions.showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Block?"
          onConfirm={actions.confirmDelete}
          onCancel={actions.cancelDelete}
        />
      )}
    </div>
  );
}
```

---

### 4. useBlockStyling Hook

**Purpose:** Generate CSS classes based on block state.

```typescript
// src/pages/TeachingCourse/hooks/useBlockStyling.ts

import cn from 'classnames';

type UseBlockStylingProps = {
  // State
  isActive?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  isDragOverlay?: boolean;
  isFocused?: boolean;

  // Block properties
  variant?: 'template' | 'edit' | 'read';
  level?: 'tile' | 'accordion' | 'column';
  blockType?: string;

  // Custom classes
  baseClassName?: string;
  customClasses?: Record<string, boolean>;
};

type UseBlockStylingReturn = {
  className: string;
  containerClassName: string;
  contentClassName: string;
  actionsClassName: string;
};

export function useBlockStyling(props: UseBlockStylingProps): UseBlockStylingReturn {
  const {
    isActive,
    isHovered,
    isSelected,
    isDragging,
    isDragOverlay,
    isFocused,
    variant = 'template',
    level = 'tile',
    blockType,
    baseClassName,
    customClasses = {},
  } = props;

  const className = cn(
    baseClassName,
    styles.block,
    styles[`block-${blockType}`],
    styles[`level-${level}`],
    styles[`variant-${variant}`],
    {
      [styles.active]: isActive,
      [styles.hovered]: isHovered,
      [styles.selected]: isSelected,
      [styles.dragging]: isDragging,
      [styles.dragOverlay]: isDragOverlay,
      [styles.focused]: isFocused,
    },
    customClasses
  );

  const containerClassName = cn(styles.blockContainer, {
    [styles.interactive]: variant === 'template' || variant === 'edit',
  });

  const contentClassName = cn(styles.blockContent, {
    [styles.readonly]: variant === 'read',
  });

  const actionsClassName = cn(styles.blockActions, {
    [styles.visible]: isActive || isHovered,
  });

  return {
    className,
    containerClassName,
    contentClassName,
    actionsClassName,
  };
}
```

**Usage:**

```typescript
function TileInfoText(props) {
  const { tileInfo, variant, activeBlockId, hoveredBlockId } = props;

  const state = useBlockState({
    blockId: tileInfo.id,
    activeBlockId,
    hoveredBlockId,
  });

  const draggable = useDraggableBlock({
    id: tileInfo.id,
    type: tileInfo.type,
    level: 'tile',
  });

  const styling = useBlockStyling({
    ...state,
    isDragging: draggable.isDragging,
    variant,
    level: 'tile',
    blockType: 'text',
  });

  return (
    <div ref={draggable.setNodeRef} style={draggable.style} className={styling.className}>
      <div className={styling.containerClassName}>
        <div className={styling.contentClassName}>
          {/* Content */}
        </div>
        <div className={styling.actionsClassName}>
          {/* Actions */}
        </div>
      </div>
    </div>
  );
}
```

---

### 5. useHoverDetection Hook

**Purpose:** Detect when mouse hovers over a block.

```typescript
// src/pages/TeachingCourse/hooks/useHoverDetection.ts

type UseHoverDetectionProps = {
  blockId: number;
  onHoverStart?: (blockId: number) => void;
  onHoverEnd?: (blockId: number) => void;
  disabled?: boolean;
};

type UseHoverDetectionReturn = {
  isHovered: boolean;
  hoverProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
};

export function useHoverDetection(props: UseHoverDetectionProps): UseHoverDetectionReturn {
  const { blockId, onHoverStart, onHoverEnd, disabled = false } = props;

  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseEnter = React.useCallback(() => {
    if (disabled) return;
    setIsHovered(true);
    onHoverStart?.(blockId);
  }, [blockId, disabled, onHoverStart]);

  const handleMouseLeave = React.useCallback(() => {
    if (disabled) return;
    setIsHovered(false);
    onHoverEnd?.(blockId);
  }, [blockId, disabled, onHoverEnd]);

  const hoverProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return {
    isHovered,
    hoverProps,
  };
}
```

---

## Complete Example: Refactored Text Block

### Before (Duplicated Logic)

```typescript
// TileInfoText.tsx (Old)
export default function TileInfoText(props) {
  // ~50 lines of duplicated drag, state, and action logic
  // ...

  return (
    <div /* ... */>{/* ... */}</div>
  );
}
```

### After (Using Hooks)

```typescript
// TileInfoText.tsx (New)
import { useDraggableBlock } from '../../hooks/useDraggableBlock';
import { useBlockState } from '../../hooks/useBlockState';
import { useBlockActions } from '../../hooks/useBlockActions';
import { useBlockStyling } from '../../hooks/useBlockStyling';
import { useHoverDetection } from '../../hooks/useHoverDetection';

export default function TileInfoText(props) {
  const {
    tileInfo,
    variant,
    activeBlockId,
    hoveredBlockId,
    onAddElement,
    onEditElement,
    onDeleteElement,
  } = props;

  // All shared logic extracted to hooks
  const draggable = useDraggableBlock({
    id: tileInfo.id,
    type: tileInfo.type,
    level: 'tile',
  });

  const state = useBlockState({
    blockId: tileInfo.id,
    activeBlockId,
    hoveredBlockId,
    isDragOverlay: props.isDragOverlay,
  });

  const actions = useBlockActions({
    blockId: tileInfo.id,
    blockType: tileInfo.type,
    parentId: tileInfo.parentId,
    onAdd: onAddElement,
    onEdit: onEditElement,
    onDelete: onDeleteElement,
  });

  const styling = useBlockStyling({
    ...state,
    isDragging: draggable.isDragging,
    variant,
    level: 'tile',
    blockType: 'text',
  });

  const hover = useHoverDetection({
    blockId: tileInfo.id,
    disabled: props.isDragOverlay,
  });

  // Only text-specific logic remains
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update text value
  };

  return (
    <div
      ref={draggable.setNodeRef}
      style={draggable.style}
      className={styling.className}
      {...hover.hoverProps}
    >
      <div className={styling.containerClassName}>
        {/* Drag handle */}
        <button
          ref={draggable.setActivatorNodeRef}
          style={draggable.dragHandleStyle}
          {...draggable.attributes}
          {...draggable.listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>

        {/* Content - only text-specific logic */}
        <div className={styling.contentClassName}>
          <input
            type="text"
            value={tileInfo.value}
            onChange={handleChange}
            disabled={variant === 'read'}
          />
        </div>

        {/* Actions */}
        <div className={styling.actionsClassName}>
          {actions.canAdd && (
            <button onClick={actions.handleAdd}>
              <Plus size={16} />
            </button>
          )}
          {actions.canEdit && (
            <button onClick={actions.handleEdit}>
              <Edit size={16} />
            </button>
          )}
          {actions.canDelete && (
            <button onClick={actions.handleDelete}>
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {actions.showDeleteConfirm && (
        <ConfirmDialog
          title="Delete text block?"
          onConfirm={actions.confirmDelete}
          onCancel={actions.cancelDelete}
        />
      )}
    </div>
  );
}
```

**Result:**
- Component reduced from ~100 lines to ~60 lines
- All shared logic is reusable
- Only text-specific logic remains
- Much easier to maintain and extend

---

## Benefits

### Code Reduction
- **Before**: Each block = ~100-150 lines (with duplication)
- **After**: Each block = ~50-70 lines (hooks handle shared logic)
- **Savings**: ~50-80 lines per component × 10 components = **500-800 lines saved**

### Maintainability
- Change drag logic once, all blocks benefit
- Fix hover bug once, applies everywhere
- Add new feature (e.g., keyboard navigation) in one place

### Testability
- Hooks can be tested independently
- Mock hooks for component tests
- Integration tests for hook combinations

### Extensibility
- Easy to add new blocks (just use hooks)
- Easy to add new features (extend hooks)
- Easy to customize per block (override hooks)

---

## Migration Plan

### Phase 1: Create Hooks (1-2 days)
1. Create `src/pages/TeachingCourse/hooks/` directory
2. Implement each hook with tests
3. Document hook APIs

### Phase 2: Migrate One Component (1 day)
1. Choose simplest component (e.g., TileInfoText)
2. Refactor to use hooks
3. Test thoroughly
4. Document patterns

### Phase 3: Migrate Remaining Components (2-3 days)
1. Apply same pattern to all blocks
2. Test each migration
3. Remove old duplicated code

### Phase 4: Optimize and Extend (1-2 days)
1. Add missing features (keyboard nav, etc.)
2. Performance optimizations
3. Documentation updates

**Total Estimate: 5-8 days**

---

## Making TileInfoBaseTemplate More Flexible

Currently, `TileInfoBaseTemplate` provides basic UI structure but is somewhat rigid. Here are ways to make it more flexible:

### Option 1: Render Props Pattern

```typescript
<TileInfoBaseTemplate
  tileInfo={tileInfo}
  renderDragHandle={(props) => <CustomDragHandle {...props} />}
  renderActions={(props) => <CustomActions {...props} />}
  renderContent={(props) => <CustomContent {...props} />}
/>
```

### Option 2: Slot-Based Composition

```typescript
<TileInfoBaseTemplate tileInfo={tileInfo}>
  <TileInfoBaseTemplate.DragHandle />
  <TileInfoBaseTemplate.Content>
    {/* Custom content */}
  </TileInfoBaseTemplate.Content>
  <TileInfoBaseTemplate.Actions>
    {/* Custom actions */}
  </TileInfoBaseTemplate.Actions>
</TileInfoBaseTemplate>
```

### Option 3: Hook-Based (Recommended)

Instead of a base template component, provide hooks and let each component compose as needed:

```typescript
// Most flexible - each component builds its own structure
function TileInfoText() {
  const draggable = useDraggableBlock();
  const actions = useBlockActions();

  return (
    <div {...draggable.props}>
      <DragHandle {...draggable.handleProps} />
      <Content>{/* Custom */}</Content>
      <Actions {...actions.props} />
    </div>
  );
}
```

**Recommendation:** Use hook-based approach (Option 3) for maximum flexibility while maintaining shared logic.

---

## References

- [React Hooks Documentation](https://react.dev/reference/react)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Composition vs Inheritance](https://react.dev/learn/thinking-in-react)
