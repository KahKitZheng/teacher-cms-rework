# ADR 0011: Block State Management Pattern

**Status:** Proposed
**Date:** 2025-11-27
**Decision Makers:** Development Team
**Related ADRs:** [0001 (Data Structure)](0001-data-structure-architecture.md), [0009 (Block Registry)](0009-block-registry-factory.md)

## Context

Block components need to handle user input (text fields, dropdowns, rich text editors) while maintaining data synchronization with the parent state. The current implementation has local state in blocks but no mechanism to sync changes back to the parent, causing data loss on re-renders (e.g., after drag-drop operations).

### Current Problem

**Block Component** (`TileInfoTextTemplate.tsx`):
```typescript
export default function TileInfoTextTemplate(props) {
  const { tileInfo, onEditElement } = props;

  // ❌ Local state initialized from props
  const [text, setText] = useState(tileInfo.data);

  function handleTextChange(event) {
    setText(event.target.value);  // ❌ Updates local state only!
  }

  return <input value={text} onChange={handleTextChange} />;
}
```

**Parent Component** (`TeachingCourseTemplate.tsx`):
```typescript
export default function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);

  // ❌ No handler to update block data!
  // Only drag-drop handlers exist

  return (
    <TileInfoBlock
      block={block}
      variant="template"
      onEditElement={undefined}  // ❌ No callback provided!
    />
  );
}
```

**Result:** Changes to block content are lost when blocks re-render (drag-drop, collapse/expand).

### Requirements

1. **Single Source of Truth** - Parent owns authoritative state
2. **Responsive UI** - No input lag during typing
3. **Data Persistence** - Changes survive re-renders
4. **Performance** - Minimize unnecessary parent re-renders
5. **Mode-Specific Behavior**:
   - Template mode: Occasional updates (building structure)
   - Edit mode: Auto-save (content entry)
   - Read mode: No updates needed

## Decision

Implement a **controlled component pattern with debounced updates** for all editable blocks.

### Architecture

```
Parent (TeachingCourseTemplate)
  └── State: tileInfo
      └── Handler: onUpdateBlock(blockId, updates)
          ↓
Child (TileInfoTextTemplate)
  ├── Local State: text (for immediate UI)
  ├── Debounced Update: → onUpdateBlock
  └── Sync Effect: ← tileInfo.data
```

### Implementation

**1. Parent Provides Update Handler**

```typescript
// TeachingCourseTemplate.tsx
export default function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);

  // ✅ Handler to update any block by ID
  function handleUpdateBlock(
    blockId: number,
    updates: Partial<TileInfoBlock>
  ) {
    setTileInfo(prevTiles =>
      updateBlockById(prevTiles, blockId, block => ({
        ...block,
        ...updates,
      }))
    );
  }

  return (
    <RecursiveAccordionRenderer
      accordion={accordion}
      onUpdateBlock={handleUpdateBlock}  // ✅ Pass down
    />
  );
}
```

**2. Block Uses Debounced Updates**

```typescript
// TileInfoTextTemplate.tsx
export default function TileInfoTextTemplate(props) {
  const { tileInfo, onUpdateBlock } = props;

  // ✅ Local state for immediate UI feedback
  const [text, setText] = useState(tileInfo.data);

  // ✅ Debounce updates to parent (500ms)
  const debouncedUpdate = useMemo(
    () => debounce((value: string) => {
      onUpdateBlock?.(tileInfo.id, { data: value });
    }, 500),
    [tileInfo.id, onUpdateBlock]
  );

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value;
    setText(newValue);              // ✅ Immediate UI update
    debouncedUpdate(newValue);      // ✅ Debounced parent update
  }

  // ✅ Sync local state if props change (drag-drop, undo/redo)
  useEffect(() => {
    setText(tileInfo.data);
  }, [tileInfo.data]);

  return (
    <input
      value={text}
      onChange={handleTextChange}
    />
  );
}
```

**3. Helper Function for Updates**

```typescript
// dragDropHelpers.ts
export function updateBlockById(
  tiles: Tile[],
  blockId: number,
  updater: (block: TileInfoBlock) => TileInfoBlock
): Tile[] {
  return tiles.map(tile => ({
    ...tile,
    children: updateBlockInArray(tile.children, blockId, updater),
  }));

  function updateBlockInArray(
    blocks: TileInfoBlock[],
    id: number,
    updater: (block: TileInfoBlock) => TileInfoBlock
  ): TileInfoBlock[] {
    return blocks.map(block => {
      if (block.id === id) {
        return updater(block);
      }

      // Recursively update in accordions
      if (block.type === 'accordion') {
        return {
          ...block,
          children: updateBlockInArray(block.children, id, updater),
        };
      }

      // Recursively update in column layouts
      if (block.type === 'columnLayout') {
        return {
          ...block,
          children: block.children.map(column => ({
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

### Mode-Specific Variations

**Template Mode:**
```typescript
// 500ms debounce - users are building structure
const debouncedUpdate = debounce((value) => {
  onUpdateBlock(blockId, { data: value });
}, 500);
```

**Edit Mode:**
```typescript
// Auto-save on blur + periodic save
function handleBlur() {
  onUpdateBlock(blockId, { data: text });
}

useEffect(() => {
  const interval = setInterval(() => {
    if (text !== tileInfo.data) {
      onUpdateBlock(blockId, { data: text });
    }
  }, 3000); // Auto-save every 3s

  return () => clearInterval(interval);
}, [text, tileInfo.data]);
```

**Read Mode:**
```typescript
// No state management needed - just render
<div>{tileInfo.data}</div>
```

## Alternatives Considered

### Alternative 1: Pure Controlled Components

**Description:** No local state, update parent on every keystroke.

```typescript
export default function TileInfoTextTemplate(props) {
  const { tileInfo, onUpdateBlock } = props;

  function handleTextChange(event) {
    onUpdateBlock(tileInfo.id, { data: event.target.value });
  }

  return <input value={tileInfo.data} onChange={handleTextChange} />;
}
```

**Pros:**
- ✅ Single source of truth
- ✅ Simplest implementation
- ✅ No sync issues

**Cons:**
- ❌ Parent re-renders on every keystroke
- ❌ Potential input lag
- ❌ Expensive for deeply nested structures
- ❌ Poor performance with many blocks

**Why Rejected:** Performance. With recursive rendering and immutable updates, every keystroke would trigger full tree re-render.

### Alternative 2: Uncontrolled Components with Refs

**Description:** Block owns state, parent gets value on-demand via refs.

```typescript
export default function TileInfoTextTemplate(props, ref) {
  const [text, setText] = useState(props.tileInfo.data);

  useImperativeHandle(ref, () => ({
    getValue: () => text,
  }));

  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}

// Parent
function TeachingCourseTemplate() {
  const blockRefs = useRef(new Map());

  function handleSave() {
    const updatedData = blocks.map(block => ({
      ...block,
      data: blockRefs.current.get(block.id)?.getValue(),
    }));
    save(updatedData);
  }
}
```

**Pros:**
- ✅ No callback plumbing
- ✅ Best performance (no parent re-renders)
- ✅ Simpler child components

**Cons:**
- ❌ No single source of truth
- ❌ Parent state can be stale
- ❌ Hard to implement undo/redo
- ❌ Manual synchronization needed
- ❌ Doesn't work with drag-drop (blocks re-render with prop data)

**Why Rejected:** Incompatible with drag-drop architecture. When blocks are reordered, they re-render with prop data, losing uncontrolled state.

### Alternative 3: Context API for Updates

**Description:** Share update handler via Context instead of props drilling.

```typescript
const TileUpdateContext = createContext();

function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);

  return (
    <TileUpdateContext.Provider value={{ onUpdateBlock }}>
      {/* No need to pass onUpdateBlock through layers */}
    </TileUpdateContext.Provider>
  );
}

function TileInfoTextTemplate(props) {
  const { onUpdateBlock } = useContext(TileUpdateContext);
  // ... use onUpdateBlock
}
```

**Pros:**
- ✅ No callback prop drilling
- ✅ Cleaner component signatures

**Cons:**
- ❌ Implicit data flow (harder to debug)
- ❌ Context changes cause all consumers to re-render
- ❌ Doesn't reduce update complexity
- ❌ Still need debouncing logic

**Why Rejected:** Props drilling is acceptable for this use case. Explicit data flow is valuable for debugging, and Context doesn't solve the core state management challenge.

## Consequences

### Positive

1. **✅ Data Persistence** - Changes survive re-renders, drag-drop operations
2. **✅ Responsive UI** - Local state provides immediate feedback
3. **✅ Performance** - Debouncing reduces parent re-renders
4. **✅ Single Source of Truth** - Parent state is authoritative
5. **✅ Undo/Redo Ready** - Parent has complete state history
6. **✅ Auto-Save Support** - Can implement periodic saves in edit mode
7. **✅ Explicit Data Flow** - Clear where updates come from

### Negative

1. **❌ Callback Plumbing** - Must pass `onUpdateBlock` through component layers
2. **❌ Sync Complexity** - Need useEffect to sync local state with props
3. **❌ Debounce Library** - Need lodash.debounce or custom implementation
4. **❌ More Code** - ~15 additional lines per block component

### Neutral

1. **⚠️ Mode-Specific Logic** - Different update strategies per mode (template/edit/read)
2. **⚠️ Testing Complexity** - Need to test debouncing and sync behavior
3. **⚠️ Documentation Needed** - Developers must understand the pattern

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- [ ] Add `updateBlockById` helper function
- [ ] Add `onUpdateBlock` handler to parent components
- [ ] Create debounce utility or import lodash.debounce
- [ ] Update TypeScript types for callback props

### Phase 2: Block Component Updates (Week 2)
- [ ] Update `TileInfoTextTemplate` with debounced pattern
- [ ] Update `TileInfoHeadingTemplate`
- [ ] Update `TileInfoDropdownTemplate`
- [ ] Update `TileInfoParagraphTemplate` (TipTap editor)

### Phase 3: Mode-Specific Behavior (Week 3)
- [ ] Implement auto-save for edit mode
- [ ] Add blur handlers where appropriate
- [ ] Add visual save indicators
- [ ] Test data persistence across all operations

### Phase 4: Testing & Documentation (Week 4)
- [ ] Unit tests for `updateBlockById`
- [ ] Integration tests for state updates
- [ ] Test drag-drop + edit scenarios
- [ ] Update component documentation

## References

- **React Docs - Controlled Components**: https://react.dev/learn/sharing-state-between-components
- **React Docs - useEffect**: https://react.dev/reference/react/useEffect
- **Lodash Debounce**: https://lodash.com/docs/4.17.15#debounce
- **ADR 0001**: Data Structure Architecture (recursive updates)
- **ADR 0009**: Block Registry Factory (component pattern)

## Notes

### Performance Considerations

With 50 blocks on a page:
- **Pure Controlled**: 50 re-renders per keystroke = ~500ms lag
- **Debounced (500ms)**: 1 re-render per 500ms = no lag
- **Uncontrolled**: 0 re-renders, but loses data on drag-drop

### Future Enhancements

1. **Optimistic Updates** - Show changes immediately, rollback on error
2. **Conflict Resolution** - Handle concurrent edits (multi-user)
3. **Change History** - Track changes for undo/redo
4. **Validation** - Validate updates before applying
5. **Persistence Queue** - Queue updates for batch API calls

## Decision

✅ **Adopt controlled component pattern with debounced updates** for all editable block components.

This provides the best balance of:
- Data integrity (single source of truth)
- Performance (debounced updates)
- User experience (responsive UI)
- Maintainability (explicit data flow)

The slight increase in code complexity is justified by the robustness and flexibility gained.
