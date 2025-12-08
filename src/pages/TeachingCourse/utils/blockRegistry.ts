/**
 * Block Registry - Single source of truth for block metadata
 * Scales to unlimited block types without modifying multiple files
 */

import { lazy, ComponentType, createElement, ReactNode } from 'react';

type BlockCategory = 'container' | 'layout' | 'content';

type BlockVariant = {
  value: string;
  label: string;
  description?: string;
  icon?: string;
};

type BlockMetadata = {
  category: BlockCategory;
  canHaveChildren: boolean;
  canBeNested: boolean;
  canBeInColumn: boolean;
  canBeAtTileLevel: boolean;
  displayName: string;
  description?: string;
  icon?: string;
  variants?: BlockVariant[];
  component: ComponentType<any>; // Lazy-loaded component
};

/**
 * Registry of all block types and their metadata
 * Add new block types here - all utilities update automatically
 */
export const BLOCK_REGISTRY = {
  // Container blocks
  accordion: {
    category: 'container',
    canHaveChildren: true,
    canBeNested: true,
    canBeInColumn: false,
    canBeAtTileLevel: true,
    displayName: 'Accordion',
    description: 'Collapsible container for blocks and layouts',
    icon: 'chevron-down',
    component: lazy(() => import('../components/TileInfoAccordion/TileInfoAccordion')),
  },

  // Layout blocks
  columnLayout: {
    category: 'layout',
    canHaveChildren: true,
    canBeNested: false,
    canBeInColumn: false,
    canBeAtTileLevel: false,
    displayName: 'Column Layout',
    description: 'Add a multi-column layout inside an accordion',
    icon: 'columns',
    component: lazy(() => import('../components/SortableColumnLayout/SortableColumnLayout')),
  },
  column: {
    category: 'layout',
    canHaveChildren: true,
    canBeNested: false,
    canBeInColumn: false,
    canBeAtTileLevel: false,
    displayName: 'Column',
    icon: 'rectangle-vertical',
    component: lazy(() => import('../components/DroppableColumn/DroppableColumn')),
  },

  // Content blocks
  text: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Text Block',
    description: 'Add a text input field',
    icon: 'text',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText/TileInfoText')),
  },
  heading: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Heading',
    description: 'Add a heading or title',
    icon: 'heading',
    variants: [
      { value: 'h1', label: 'Heading 1', description: 'Main page title' },
      { value: 'h2', label: 'Heading 2', description: 'Section heading' },
      { value: 'h3', label: 'Heading 3', description: 'Subsection heading' },
      { value: 'h4', label: 'Heading 4', description: 'Minor heading' },
    ],
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoHeading/TileInfoHeading')),
  },
  dropdown: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Dropdown',
    description: 'Add a dropdown select field',
    icon: 'chevron-down',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoDropdown/TileInfoDropdown')),
  },
  paragraph: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Paragraph',
    description: 'Add a paragraph with rich text editing',
    icon: 'align-left',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoParagraph/TileInfoParagraph')),
  },
  tag: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Tag',
    description: 'Add searchable tags with type categorization',
    icon: 'tag',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoTag/TileInfoTag')),
  },
  divider: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Divider',
    description: 'Add a visual separator between blocks',
    icon: 'minus',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoDivider/TileInfoDivider')),
  },
  comment: {
    category: 'content',
    canHaveChildren: false,
    canBeNested: true,
    canBeInColumn: true,
    canBeAtTileLevel: true,
    displayName: 'Comment',
    description: 'Add an info, warning, or error comment with rich text',
    icon: 'message-square',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoComment/TileInfoComment')),
  },

  // Future blocks (commented examples):
  // image: {
  //   category: 'content',
  //   canHaveChildren: false,
  //   canBeNested: true,
  //   canBeInColumn: true,
  //   canBeAtTileLevel: true,
  //   displayName: 'Image',
  //   icon: 'image',
  // },
  // video: {
  //   category: 'content',
  //   canHaveChildren: false,
  //   canBeNested: true,
  //   canBeInColumn: true,
  //   canBeAtTileLevel: true,
  //   displayName: 'Video',
  //   icon: 'video',
  // },
} as const satisfies Record<string, BlockMetadata>;

export type BlockType = keyof typeof BLOCK_REGISTRY;

/**
 * Derived types for different block categories
 * These automatically update when blocks are added/removed from the registry
 */
type BlocksByCategory<Category extends BlockCategory> = {
  [K in BlockType]: (typeof BLOCK_REGISTRY)[K]['category'] extends Category ? K : never
}[BlockType];

export type ContentBlockType = BlocksByCategory<'content'>;
export type ContainerBlockType = BlocksByCategory<'container'>;
export type LayoutBlockType = BlocksByCategory<'layout'>;

/**
 * Get metadata for a block type
 */
export function getBlockMetadata(type: string): BlockMetadata | undefined {
  return BLOCK_REGISTRY[type as BlockType];
}

/**
 * Check if block is a container (can hold other blocks)
 */
export function isContainer(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.category === 'container';
}

/**
 * Check if block is a content block (leaf node)
 */
export function isContentBlock(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.category === 'content';
}

/**
 * Check if block is a layout block
 */
export function isLayoutBlock(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.category === 'layout';
}

/**
 * Check if block can be placed in columns
 */
export function canBeInColumn(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.canBeInColumn ?? false;
}

/**
 * Get lazy-loaded component for a block type
 */
export function getBlockComponent(type: string): ComponentType<any> | null {
  const metadata = BLOCK_REGISTRY[type as BlockType];
  return metadata?.component || null;
}

/**
 * Get icon component for a block type
 * Returns ReactNode for rendering in UI
 */
export function getBlockIcon(type: BlockType, numColumns?: number): ReactNode {
  const iconProps = {
    width: "32",
    height: "32",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "accordion":
      return createElement('div', {
        style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }
      }, createElement('div', {
        style: { width: '100%', height: '20px', background: 'var(--secondary-color)', borderRadius: '2px' }
      }));

    case "columnLayout":
      return createElement('div', {
        style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }
      }, createElement('div', {
        style: { width: '100%', height: '20px', display: 'flex', gap: '3px' }
      },
        ...Array.from({ length: numColumns || 2 }).map((_, i) =>
          createElement('div', {
            key: i,
            style: { flex: 1, background: 'var(--secondary-color)', borderRadius: '2px' }
          })
        )
      ));

    case "column":
      return createElement('div', {
        style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }
      }, createElement('div', {
        style: { width: '100%', height: '20px', background: 'var(--secondary-color)', borderRadius: '2px' }
      }));

    case "heading":
      return createElement('svg', iconProps,
        createElement('path', { d: "M6 4v16M18 4v16M8 12h8" })
      );

    case "text":
    case "paragraph":
      return createElement('svg', iconProps,
        createElement('line', { x1: "4", y1: "7", x2: "20", y2: "7" }),
        createElement('line', { x1: "4", y1: "12", x2: "20", y2: "12" }),
        createElement('line', { x1: "4", y1: "17", x2: "14", y2: "17" })
      );

    case "dropdown":
      return createElement('svg', iconProps,
        createElement('rect', { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
        createElement('path', { d: "m9 11 3 3 3-3" })
      );

    case "tag":
      return createElement('svg', iconProps,
        createElement('path', { d: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" }),
        createElement('line', { x1: "7", y1: "7", x2: "7.01", y2: "7" })
      );

    case "divider":
      return createElement('svg', iconProps,
        createElement('line', { x1: "4", y1: "12", x2: "20", y2: "12" })
      );

    case "comment":
      return createElement('svg', iconProps,
        createElement('path', { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
      );

    default:
      return null;
  }
}

/**
 * Get custom preview fallback for a block type
 * Returns ReactNode for Suspense fallback
 */
export function getBlockPreviewFallback(type: BlockType): ReactNode {
  // Generic fallback - can be customized per block type
  const displayName = BLOCK_REGISTRY[type]?.displayName || 'block';
  return createElement('div', {}, `Loading ${displayName}...`);
}

/**
 * Check if block can be nested inside containers
 */
export function canBeNested(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.canBeNested ?? false;
}

/**
 * Check if block can be at tile level
 */
export function canBeAtTileLevel(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.canBeAtTileLevel ?? false;
}

/**
 * Check if block can have children
 */
export function canHaveChildren(block: TileInfoBlock): boolean {
  const metadata = getBlockMetadata(block.type);
  return metadata?.canHaveChildren ?? false;
}

/**
 * Get all block types that can be placed at tile level
 */
export function getTileLevelBlockTypes(): BlockType[] {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([_, meta]) => meta.canBeAtTileLevel)
    .map(([type, _]) => type as BlockType);
}

/**
 * Get all block types that can be nested inside containers
 */
export function getNestableBlockTypes(): BlockType[] {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([_, meta]) => meta.canBeNested)
    .map(([type, _]) => type as BlockType);
}

/**
 * Get all block types that can be placed in columns
 */
export function getColumnBlockTypes(): BlockType[] {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([_, meta]) => meta.canBeInColumn)
    .map(([type, _]) => type as BlockType);
}

/**
 * Get all content block types
 */
export function getContentBlockTypes(): BlockType[] {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([_, meta]) => meta.category === 'content')
    .map(([type, _]) => type as BlockType);
}

/**
 * Get all container block types
 */
export function getContainerBlockTypes(): BlockType[] {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([_, meta]) => meta.category === 'container')
    .map(([type, _]) => type as BlockType);
}

/**
 * Get all layout block types
 */
export function getLayoutBlockTypes(): BlockType[] {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([_, meta]) => meta.category === 'layout')
    .map(([type, _]) => type as BlockType);
}

/**
 * Get blocks by multiple criteria (flexible context-based filtering)
 */
export function getBlockTypesByContext(context: {
  canBeNested?: boolean;
  canBeInColumn?: boolean;
  canBeAtTileLevel?: boolean;
  canHaveChildren?: boolean;
  categories?: BlockCategory[];
}): BlockType[] {
  return Object.entries(BLOCK_REGISTRY)
    .filter(([_, meta]) => {
      if (context.canBeNested !== undefined && meta.canBeNested !== context.canBeNested) return false;
      if (context.canBeInColumn !== undefined && meta.canBeInColumn !== context.canBeInColumn) return false;
      if (context.canBeAtTileLevel !== undefined && meta.canBeAtTileLevel !== context.canBeAtTileLevel) return false;
      if (context.canHaveChildren !== undefined && meta.canHaveChildren !== context.canHaveChildren) return false;
      if (context.categories && !context.categories.includes(meta.category)) return false;
      return true;
    })
    .map(([type, _]) => type as BlockType);
}

/**
 * Get all registered block types
 */
export function getAllBlockTypes(): BlockType[] {
  return Object.keys(BLOCK_REGISTRY) as BlockType[];
}
