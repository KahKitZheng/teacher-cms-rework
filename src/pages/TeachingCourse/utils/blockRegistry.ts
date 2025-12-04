/**
 * Block Registry - Single source of truth for block metadata
 * Scales to unlimited block types without modifying multiple files
 */

import { lazy, ComponentType } from 'react';

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
    icon: 'align-left',
    component: lazy(() => import('../components/TileInfoBlocks/TileInfoText/TileInfoText')),
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
