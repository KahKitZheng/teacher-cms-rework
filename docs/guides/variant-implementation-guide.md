# Block Variants - Implementation Guide

This guide shows how to add and use variants for blocks in the Teaching Course builder.

## What are Variants?

Variants allow a single block type to have different styles or behaviors. For example, a **Heading** block can have variants for H1, H2, H3, and H4.

## Current Implementation

The variant system has been implemented for the **Heading** block as an example. Here's how it works:

---

## 1. Block Registry Structure

Variants are defined in [blockRegistry.ts](src/pages/TeachingCourse/utils/blockRegistry.ts):

```typescript
heading: {
  category: 'content',
  displayName: 'Heading',
  description: 'Add a heading or title',
  icon: 'heading',

  // Define variants here
  variants: [
    { value: 'h1', label: 'Heading 1', description: 'Main page title' },
    { value: 'h2', label: 'Heading 2', description: 'Section heading' },
    { value: 'h3', label: 'Heading 3', description: 'Subsection heading' },
    { value: 'h4', label: 'Heading 4', description: 'Minor heading' },
  ],

  // ... other metadata
},
```

### Variant Properties:
- **value**: The variant identifier (e.g., `'h1'`, `'h2'`)
- **label**: Display name shown in UI (e.g., `'Heading 1'`)
- **description**: Optional tooltip/description (e.g., `'Main page title'`)
- **icon**: Optional icon for the variant

---

## 2. Element Picker Modal

The [ElementPickerModal](src/pages/TeachingCourse/components/ElementPickerModal/ElementPickerModal.tsx) automatically displays variant options when a block has variants defined.

### How it works:

1. **User clicks on a block** (e.g., Heading)
2. **Variant selector appears** below the block item (similar to column count selector)
3. **User selects a variant** (e.g., H1, H2, H3, H4)
4. **Preview updates** to show selected variant
5. **User clicks "Add Element"** and the block is created with the selected variant

### UI Structure:

```typescript
<button onClick={() => handleElementClick("heading", { variant: selectedVariant })}>
  Heading
</button>

{/* Variant selector - auto-generated from registry */}
{BLOCK_REGISTRY.heading.variants && (
  <div styleName="variant-selector">
    <label>Heading Level:</label>
    <div styleName="variant-buttons">
      {BLOCK_REGISTRY.heading.variants.map((variant) => (
        <button
          key={variant.value}
          onClick={() => setSelectedVariant(variant.value)}
          title={variant.description}
        >
          {variant.label}
        </button>
      ))}
    </div>
  </div>
)}
```

---

## 3. Using Variants in Your Code

### When creating a block:

```typescript
// Without variant (uses default)
onSelect('heading');

// With variant
onSelect('heading', { variant: 'h1' });
```

### When a block is selected, you receive:

```typescript
{
  type: 'heading',
  options: {
    variant: 'h1' // Selected variant
  }
}
```

---

## 4. Adding Variants to Other Blocks

### Example: Adding variants to Text block

```typescript
// In blockRegistry.ts
text: {
  category: 'content',
  displayName: 'Text Block',
  description: 'Add a text input field',
  icon: 'text',

  // Add variants
  variants: [
    { value: 'single-line', label: 'Single Line', description: 'One line of text' },
    { value: 'multi-line', label: 'Multi-line', description: 'Multiple lines of text' },
    { value: 'rich-text', label: 'Rich Text', description: 'Text with formatting' },
  ],

  // ... rest of metadata
},
```

### Then in ElementPickerModal:

The variant selector will **automatically appear** for the text block! No additional code needed.

```tsx
{allowedTypes.includes("text") && (
  <div>
    <button onClick={() => handleElementClick("text", { variant: selectedTextVariant })}>
      Text Block
    </button>

    {/* This is auto-generated if text has variants */}
    {BLOCK_REGISTRY.text.variants && (
      <div styleName="variant-selector">
        <label>Text Type:</label>
        <div styleName="variant-buttons">
          {BLOCK_REGISTRY.text.variants.map((variant) => (
            <button
              key={variant.value}
              onClick={() => setSelectedTextVariant(variant.value)}
            >
              {variant.label}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

---

## 5. Handling Variants in Components

In your block component (e.g., `TileInfoHeading.tsx`), you can access the variant:

```typescript
function TileInfoHeading({ tileInfo }) {
  // Get variant from tileInfo (stored when block was created)
  const headingLevel = tileInfo.variant || 'h2'; // Default to h2

  // Render appropriate heading
  const Tag = headingLevel; // 'h1', 'h2', 'h3', 'h4'

  return (
    <Tag className={styles[headingLevel]}>
      {tileInfo.name}
    </Tag>
  );
}
```

---

## 6. When to Use Variants

### ✅ Good use cases for variants:

- **Heading levels** (H1, H2, H3, H4, H5, H6) - Same component, different semantic level
- **Button styles** (primary, secondary, tertiary) - Same component, different styling
- **List types** (ordered, unordered, checklist) - Same logic, different rendering
- **Text alignment** (left, center, right) - Same component, different CSS

### ❌ Don't use variants for:

- **Different data structures** - Use separate block types instead
- **Completely different functionality** - Use separate block types
- **Features that require different capabilities** - Use separate block types

**Example:**
- ✅ Single-line text vs Multi-line text = **Variants** (same validation, different input)
- ❌ Text input vs Rich text editor = **Separate blocks** (different capabilities)

---

## 7. Current Variant Support

| Block | Has Variants? | Variant Options |
|-------|---------------|-----------------|
| **Heading** | ✅ Yes | H1, H2, H3, H4 |
| **Text** | ❌ No | - |
| **Dropdown** | ❌ No | - |
| **Accordion** | ❌ No | - |
| **Column Layout** | ⚠️ Special | Uses `columns` option (2, 3, 4) |

---

## 8. Testing Variants

To test the variant system:

1. Open the Element Picker Modal
2. Select the "Blocks" tab
3. Click on "Heading"
4. You should see buttons for: **Heading 1**, **Heading 2**, **Heading 3**, **Heading 4**
5. Click on different heading levels
6. The preview should update to show the selected level
7. Click "Add Element"
8. The heading block should be created with the selected variant

---

## 9. Future Enhancements

### Possible additions:

1. **Visual variant previews** - Show actual size differences for heading levels
2. **Variant icons** - Use icons instead of text labels for variants
3. **Variant groups** - Group related variants (e.g., "Size", "Style", "Color")
4. **Default variants** - Per-user or per-template default variant preferences
5. **Variant conversion** - Convert between variants after creation (e.g., H2 → H3)

---

## 10. API Reference

### BlockVariant Type

```typescript
type BlockVariant = {
  value: string;           // Unique identifier
  label: string;           // Display name
  description?: string;    // Optional tooltip
  icon?: string;           // Optional icon
};
```

### BlockMetadata with Variants

```typescript
type BlockMetadata = {
  // ... other properties
  variants?: BlockVariant[];  // Optional array of variants
};
```

### onSelect Callback

```typescript
onSelect: (
  type: ElementType,
  options?: {
    columns?: number;    // For column layouts
    variant?: string;    // For blocks with variants
  }
) => void;
```

---

## Summary

The variant system allows you to:

1. ✅ Define multiple variants in `blockRegistry.ts`
2. ✅ Automatically show variant selector in Element Picker
3. ✅ Pass selected variant when creating blocks
4. ✅ Access variant in component to render appropriately

**Next steps:**
- Add variants to other blocks as needed (Text, Accordion, etc.)
- Implement variant rendering logic in block components
- Consider adding variant conversion functionality
