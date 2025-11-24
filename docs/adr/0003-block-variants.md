# ADR 0003: Block Variant System

**Status:** Accepted

**Date:** 2025-01

**Deciders:** Development Team

**Related:**
- [ADR 0002: Plugin Architecture](0002-plugin-architecture.md)
- [Variant Implementation Guide](../guides/variant-implementation-guide.md)

---

## Context

The Teaching Course builder has different block types (text, heading, dropdown, etc.), but some blocks need **variations of the same type**. For example:

- **Heading block** needs H1, H2, H3, H4, H5, H6 levels
- **Text block** could have single-line, multi-line, or rich-text variants
- **Button block** could have primary, secondary, tertiary styles

Currently, each variation would require a separate block type, leading to:
1. Proliferation of block types (heading_h1, heading_h2, etc.)
2. Duplicate code for similar functionality
3. Confusing user experience (too many options)
4. Harder maintenance

We need a system that allows blocks to have **variants** - different styles or behaviors of the same block type.

---

## Decision

We will implement a **variant system** as part of the block registry:

### Variant Definition

```typescript
type BlockVariant = {
  value: string;           // Unique identifier (e.g., 'h1', 'h2')
  label: string;           // Display name (e.g., 'Heading 1')
  description?: string;    // Optional description (e.g., 'Main page title')
  icon?: string;           // Optional icon
};

type BlockMetadata = {
  // ...other metadata
  variants?: BlockVariant[];  // Optional array of variants
};
```

### Usage in Registry

```typescript
export const BLOCK_REGISTRY = {
  heading: {
    category: 'content',
    displayName: 'Heading',
    description: 'Add a heading or title',
    // ...other metadata

    variants: [
      { value: 'h1', label: 'Heading 1', description: 'Main page title' },
      { value: 'h2', label: 'Heading 2', description: 'Section heading' },
      { value: 'h3', label: 'Heading 3', description: 'Subsection heading' },
      { value: 'h4', label: 'Heading 4', description: 'Minor heading' },
    ],
  },
  // Blocks without variants simply omit the field
  text: {
    // ...metadata, no variants
  }
};
```

### UI Integration

The Element Picker Modal automatically displays variant selectors when a block has variants:

```typescript
{selectedElement?.type === "heading" && BLOCK_REGISTRY.heading.variants && (
  <div className="variant-selector">
    <label>Heading Level</label>
    {BLOCK_REGISTRY.heading.variants.map(variant => (
      <button
        key={variant.value}
        onClick={() => setSelectedVariant(variant.value)}
        title={variant.description}
      >
        {variant.label}
      </button>
    ))}
  </div>
)}
```

### Block Creation with Variants

```typescript
// User selects heading block with H2 variant
onSelect('heading', { variant: 'h2' });

// Creates block with variant metadata
const newBlock = {
  id: nextId,
  type: 'heading',
  variant: 'h2',  // Stored in block
  name: 'New Heading',
};
```

---

## Rationale

### Why Variants vs Separate Block Types?

#### Without Variants (Rejected)
```typescript
BLOCK_REGISTRY = {
  heading_h1: { /* metadata */ },
  heading_h2: { /* metadata */ },
  heading_h3: { /* metadata */ },
  heading_h4: { /* metadata */ },
  // Duplicate metadata for each!
}
```

**Problems:**
- 4x the metadata (description, icon, capabilities)
- 4x the component files or complex switch logic
- Confusing UI with too many options
- Harder to add new heading levels

#### With Variants (Chosen)
```typescript
BLOCK_REGISTRY = {
  heading: {
    // Shared metadata
    variants: [
      { value: 'h1', label: 'Heading 1' },
      { value: 'h2', label: 'Heading 2' },
      // ...
    ]
  }
}
```

**Benefits:**
- Single metadata entry
- Single component with variant logic
- Cleaner UI (one block type, choose variant)
- Easy to add new variants

### When to Use Variants

✅ **Use variants for:**
- Same component, different semantic level (H1 vs H2)
- Same component, different styling (Primary vs Secondary button)
- Same logic, different rendering (Ordered vs Unordered list)
- Same validation, different UI (Single-line vs Multi-line text)

❌ **Don't use variants for:**
- Different data structures (use separate block types)
- Completely different functionality (use separate block types)
- Different capabilities (use separate block types)

**Examples:**
- ✅ Text block: single-line vs multi-line → **Variants** (same validation, different input)
- ❌ Text input vs Rich text editor → **Separate blocks** (different capabilities)

---

## Consequences

### Positive

- ✅ **Reduced code duplication**: One component handles all variants
- ✅ **Better UX**: Fewer top-level options, clearer choices
- ✅ **Easier maintenance**: Add new variants without new components
- ✅ **Consistent behavior**: Shared logic across variants
- ✅ **Auto-generated UI**: Element picker shows variants automatically
- ✅ **Type safe**: Variant values are typed strings

### Negative

- ⚠️ **Component complexity**: Components need variant handling logic
- ⚠️ **Additional state**: Need to track selected variant in UI
- ⚠️ **Migration**: Need to update existing blocks to support variants

### Neutral

- Variant info stored with block data
- Need to handle default variants

---

## Implementation Plan

### Phase 1: Add Variant Types (30 min)

```typescript
// In blockRegistry.ts
type BlockVariant = {
  value: string;
  label: string;
  description?: string;
  icon?: string;
};

type BlockMetadata = {
  // ...existing fields
  variants?: BlockVariant[];
};
```

### Phase 2: Add Variants to Blocks (1 hour)

```typescript
// Add to existing blocks
heading: {
  // ...metadata
  variants: [
    { value: 'h1', label: 'Heading 1', description: 'Main page title' },
    { value: 'h2', label: 'Heading 2', description: 'Section heading' },
    { value: 'h3', label: 'Heading 3', description: 'Subsection heading' },
    { value: 'h4', label: 'Heading 4', description: 'Minor heading' },
  ],
}
```

### Phase 3: Update Element Picker (2 hours)

- Add variant selector UI component
- Show variants when block is selected
- Pass selected variant to onSelect callback
- Update preview to show selected variant

### Phase 4: Update Block Components (2 hours)

```typescript
// TileInfoHeading.tsx
function TileInfoHeading({ tileInfo }) {
  const headingLevel = tileInfo.variant || 'h2'; // Default to h2
  const Tag = headingLevel; // 'h1', 'h2', etc.

  return <Tag className={styles[headingLevel]}>{tileInfo.name}</Tag>;
}
```

### Phase 5: Update Block Creation (1 hour)

- Update onSelect handlers to accept variant option
- Store variant in block data
- Handle variant in useEffect initialization

**Estimated Total Effort:** ~1 day

---

## Usage Examples

### Defining Block with Variants

```typescript
// In blockRegistry.ts
text: {
  category: 'content',
  displayName: 'Text Block',
  description: 'Add a text input field',
  variants: [
    { value: 'single', label: 'Single Line', description: 'One line of text' },
    { value: 'multi', label: 'Multi-line', description: 'Multiple lines' },
    { value: 'rich', label: 'Rich Text', description: 'Formatted text' },
  ],
  // ...other metadata
}
```

### Using in Element Picker

```typescript
// Element picker automatically shows variant selector
<button onClick={() => handleSelectBlock('text')}>
  Text Block
</button>

{selectedBlock === 'text' && BLOCK_REGISTRY.text.variants && (
  <VariantSelector
    variants={BLOCK_REGISTRY.text.variants}
    selected={selectedVariant}
    onChange={setSelectedVariant}
  />
)}

// When user confirms
onSelect('text', { variant: selectedVariant });
```

### Rendering with Variants

```typescript
// TileInfoText.tsx
function TileInfoText({ tileInfo }) {
  const variant = tileInfo.variant || 'single';

  switch (variant) {
    case 'single':
      return <input type="text" value={tileInfo.value} />;
    case 'multi':
      return <textarea value={tileInfo.value} />;
    case 'rich':
      return <RichTextEditor value={tileInfo.value} />;
  }
}
```

---

## Future Enhancements

### Variant Groups
Group related variants (e.g., "Size", "Style", "Color"):

```typescript
variants: [
  {
    group: 'Size',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'large', label: 'Large' },
    ]
  },
  {
    group: 'Style',
    options: [
      { value: 'solid', label: 'Solid' },
      { value: 'outline', label: 'Outline' },
    ]
  }
]
```

### Visual Previews
Show actual size/style differences in variant selector:

```typescript
variants: [
  {
    value: 'h1',
    label: 'Heading 1',
    preview: <h1>Preview</h1>  // Visual preview
  }
]
```

### Variant Conversion
Allow converting between variants after creation (e.g., H2 → H3).

### Default Variants
Per-user or per-template default variant preferences.

---

## Current Implementation Status

- ✅ Variant type definitions added to blockRegistry.ts
- ✅ Heading block has H1, H2, H3, H4 variants
- ✅ Element Picker shows variant selector
- ✅ Variant selection working in UI
- ⚠️ Block components need variant rendering logic
- ⚠️ Other blocks (text, button, etc.) need variants added

---

## Alternatives Considered

### Separate Block Types for Each Variant
- **Rejected**: Too much duplication, confusing UX

### Dynamic Variant Loading
- **Deferred**: Over-engineering, not needed now

### CSS-Only Variants
- **Rejected**: Some variants need different behavior, not just styling

---

## References

- [Variant Implementation Guide](../guides/variant-implementation-guide.md)
- [Block Registry Source](../../src/pages/TeachingCourse/utils/blockRegistry.ts)
- [Element Picker Modal](../../src/pages/TeachingCourse/components/ElementPickerModal/)
