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
  level: number,
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
    level,
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
        name,
        data: "",
      } as TileInfoBlockText;

    case "paragraph":
      return {
        ...baseFields,
        type: "paragraph",
        name,
        data: {},
      } as TileInfoBlockParagraph;

    case "heading":
      return {
        ...baseFields,
        type: "heading",
        name,
      } as TileInfoBlockHeading;

    case "tag":
      return {
        ...baseFields,
        type: "tag",
        name,
        tagType: "",
        tags: [],
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
        name,
        commentType: "info",
        data: {},
      } as TileInfoBlockComment;

    case "dropdown":
      return {
        ...baseFields,
        type: "dropdown",
        name,
        options: [],
      } as TileInfoBlockDropdown;

    // Container blocks
    case "accordion":
      return {
        ...baseFields,
        type: "accordion",
        icon,
        name,
        children: [],
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
        createBlock(generateColumnId(), "column", level, i, {
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
  const baseBlock = {
    id: -1, // Mock ID for preview
    name: "Preview Block",
    level: 0, // 0 = tile level
    order: 0,
  };

  // Handle container/layout blocks that aren't in ContentBlockType
  switch (type) {
    case "accordion":
      return {
        ...baseBlock,
        type: "accordion",
        children: [],
      } as TileInfoBlockAccordion;

    case "columnLayout":
      return {
        ...baseBlock,
        type: "columnLayout",
        parentId: -1,
        children: [],
      } as TileInfoColumnLayout;

    case "column":
      return {
        ...baseBlock,
        type: "column",
        parentId: -1,
        children: [],
      } as TileInfoBlockColumn;

    case "heading":
      // Special case: heading can have a variant option
      return {
        ...baseBlock,
        type: "heading",
        headingLevel: (options?.variant || "h2") as
          | "h1"
          | "h2"
          | "h3"
          | "h4"
          | "h5"
          | "h6",
      } as TileInfoBlockHeading;

    case "tag":
      // Special case: add example tag for preview
      return {
        ...baseBlock,
        type: "tag",
        tagType: "",
        tags: ["example-tag"],
      } as TileInfoBlockTag;

    // For other content blocks, use the shared createBlock function
    default:
      return createBlock(
        -1,           // Mock ID for preview
        type,
        0,            // 0 = tile level
        0,            // order doesn't matter for preview
        { name: "Preview Block" }
      );
  }
}
