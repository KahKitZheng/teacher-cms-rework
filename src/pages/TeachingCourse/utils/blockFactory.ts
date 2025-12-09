/**
 * Block Factory - Centralized block creation logic
 * Creates TileInfoBlock instances with proper type safety
 */

import type { BlockType } from './blockRegistry';

/**
 * Creates a new block instance with all required fields
 * Unified function for all block types
 */
export function createBlock(
  blockId: number,
  type: BlockType,
  order: number,
  options?: {
    name?: string;
    parentId?: number;
    icon?: string;
    numColumns?: number;
    generateColumnId?: () => number;
  }
): TileInfoBlock {
  const {
    name = "",
    parentId,
    icon = "eye",
    numColumns = 2,
    generateColumnId
  } = options || {};

  const baseFields = {
    id: blockId,
    order,
    parentId,
  };

  // Use switch for better type narrowing and exhaustiveness checking
  switch (type) {
    // Content blocks
    case "text":
      return {
        ...baseFields,
        type: "text",
        data: {
          name,
          content: "",
        },
      } as TileInfoBlockText;

    case "paragraph":
      return {
        ...baseFields,
        type: "paragraph",
        data: {
          name,
          content: {},
        },
      } as TileInfoBlockParagraph;

    case "heading":
      return {
        ...baseFields,
        type: "heading",
        data: {
          name,
          icon,
          headingLevel: "h2",
        },
      } as TileInfoBlockHeading;

    case "tag":
      return {
        ...baseFields,
        type: "tag",
        data: {
          name,
          tagType: "",
          tags: [],
        },
      } as TileInfoBlockTag;

    case "divider":
      return {
        ...baseFields,
        type: "divider",
      } as TileInfoBlockDivider;

    case "comment":
      return {
        ...baseFields,
        type: "comment",
        data: {
          name,
          commentType: "info",
          content: {},
        },
      } as TileInfoBlockComment;

    case "dropdown":
      return {
        ...baseFields,
        type: "dropdown",
        data: {
          name,
          options: [],
        },
      } as TileInfoBlockDropdown;

    // Container blocks
    case "accordion":
      return {
        ...baseFields,
        type: "accordion",
        children: [],
        data: {
          name,
          icon,
        },
      } as TileInfoBlockAccordion;

    case "column":
      return {
        ...baseFields,
        type: "column",
        parentId: parentId!, // Required for columns
        children: [],
      } as TileInfoBlockColumn;

    case "columnLayout": {
      if (!generateColumnId) {
        throw new Error("generateColumnId function is required for columnLayout");
      }
      if (!parentId) {
        throw new Error("parentId is required for columnLayout");
      }

      // Create child columns with equal width by default
      const columns: TileInfoBlockColumn[] = Array.from({ length: numColumns }, (_, i) =>
        createBlock(generateColumnId(), "column", i, {
          parentId: blockId,
        }) as TileInfoBlockColumn
      );

      return {
        ...baseFields,
        type: "columnLayout",
        parentId,
        children: columns,
      } as TileInfoColumnLayout;
    }

    default:
      throw new Error(`Unsupported block type: ${type}`);
  }
}

/**
 * Creates a mock block for preview purposes
 * Uses fixed values suitable for UI previews
 */
export function createMockBlock(
  type: BlockType,
  options?: { columns?: number; variant?: string }
): TileInfoBlock {
  // Special handling for columnLayout which requires generateColumnId
  if (type === "columnLayout") {
    let mockColumnId = -100;
    return createBlock(
      -1,           // Mock ID for preview
      type,
      0,            // order doesn't matter for preview
      {
        name: "Preview Block",
        parentId: -1,
        numColumns: options?.columns || 2,
        generateColumnId: () => mockColumnId--
      }
    );
  }

  // For all other blocks, use the shared createBlock function
  return createBlock(
    -1,           // Mock ID for preview
    type,
    0,            // order doesn't matter for preview
    { name: "Preview Block" }
  );
}
