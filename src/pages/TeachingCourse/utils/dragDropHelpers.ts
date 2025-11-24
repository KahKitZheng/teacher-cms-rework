/**
 * Utility functions for drag and drop operations on tiles, rows, and blocks
 * Uses global types defined in src/types/template.d.ts
 * Updated for recursive children structure (unified arrays)
 */

/**
 * Helper function to get a column block by its order (colIdx)
 */
function getColumnByOrder(layout: TileInfoColumnLayout, colIdx: number): TileInfoBlockColumn | undefined {
  return layout.children.find(col => col.order === colIdx);
}

/**
 * Type guard to check if an item is a TileInfoBlock
 */
function isTileInfoBlock(
  item: TileInfoBlock | TileInfoColumnLayout | TileInfoRow
): item is TileInfoBlock {
  const type = (item as any).type;
  return type === "text" || type === "dropdown" || type === "paragraph" || type === "heading";
}

/**
 * Location of a block within the nested tile structure
 */
export type BlockLocation = {
  tileIdx: number;
  rowIdx: number; // Index in tile.children for parent row, or -1 if at tile level
  itemIdx: number; // Index in row.children for item, or -1 if at tile/column level
  layoutIdx: number; // Index in row.children for layout, or -1 if not in layout
  colIdx: number; // Column order (0, 1, 2, 3, ...), or -1 if not in layout
  blockIdx: number; // Index in children array or column array
};

/**
 * Location of a column within the nested tile structure
 */
export type ColumnLocation = {
  tileIdx: number;
  rowIdx: number; // Index in tile.children for parent row
  layoutIdx: number; // Index in row.children for the column layout
  colIdx: number; // Column order: 0 for first column, 1 for second column, 2 for third, etc.
};

/**
 * Result of finding a block with its data and location
 */
export type BlockSearchResult = {
  block: TileInfoBlock;
  location: BlockLocation;
};

/**
 * Result of finding a row with its data and location
 */
export type RowSearchResult = {
  row: TileInfoRow;
  tileIdx: number;
  rowIdx: number;
};

/**
 * Get all accordion IDs from tiles (recursively finds all nested accordions)
 * Exported as getAllRowIds since accordions are rows
 */
export function getAllRowIds(tiles: Tile[]): number[] {
  const accordionIds: number[] = [];

  function collectAccordionIds(children: TileInfoBlock[]) {
    for (const child of children) {
      if (child.type === "accordion") {
        accordionIds.push(child.id);
        // Recursively collect IDs from nested accordions
        collectAccordionIds(child.children);
      }
    }
  }

  for (const tile of tiles) {
    collectAccordionIds(tile.children);
  }

  return accordionIds;
}

/**
 * Check if an ID belongs to an accordion block (alias: isRowId)
 */
export function isRowId(id: number, tiles: Tile[]): boolean {
  return getAllRowIds(tiles).includes(id);
}

/**
 * Find a block by its ID across all tiles
 * Recursively searches through tile.children, row.children, and layout columns
 */
export function findBlockById(
  tiles: Tile[],
  blockId: number
): BlockSearchResult | null {
  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    const tile = tiles[tileIdx];

    // Search through tile-level children
    for (let childIdx = 0; childIdx < tile.children.length; childIdx++) {
      const child = tile.children[childIdx];

      // Check if this child is the block we're looking for
      if (isTileInfoBlock(child) && child.id === blockId) {
        return {
          block: child,
          location: {
            tileIdx,
            rowIdx: -1,
            itemIdx: -1,
            layoutIdx: -1,
            colIdx: -1,
            blockIdx: childIdx
          },
        };
      }

      // If it's an accordion, search recursively
      if (child.type === "accordion") {
        const result = searchInAccordion(child, tileIdx, childIdx);
        if (result) return result;
      }
    }
  }

  return null;

  // Helper function to search within an accordion (including nested accordions)
  function searchInAccordion(accordion: TileInfoBlockAccordion, tileIdx: number, accordionIdx: number): BlockSearchResult | null {
    for (let childIdx = 0; childIdx < accordion.children.length; childIdx++) {
      const child = accordion.children[childIdx];

      // Check if this child is a block (but not accordion or columnLayout)
      if (child.type !== "accordion" && child.type !== "columnLayout" && child.id === blockId) {
        return {
          block: child,
          location: {
            tileIdx,
            rowIdx: accordionIdx,
            itemIdx: childIdx,
            layoutIdx: -1,
            colIdx: -1,
            blockIdx: childIdx
          },
        };
      }

      // Check if this child is a column layout
      if (child.type === "columnLayout") {
        // Iterate through column blocks
        for (const column of child.children) {
          if (column.type === "column") {
            for (let blockIdx = 0; blockIdx < column.children.length; blockIdx++) {
              if (column.children[blockIdx].id === blockId) {
                return {
                  block: column.children[blockIdx],
                  location: {
                    tileIdx,
                    rowIdx: accordionIdx,
                    itemIdx: -1,
                    layoutIdx: childIdx,
                    colIdx: column.order,
                    blockIdx
                  },
                };
              }
            }
          }
        }
      }

      // If this child is a nested accordion, search recursively
      if (child.type === "accordion") {
        const result = searchInAccordion(child, tileIdx, childIdx);
        if (result) return result;
      }
    }

    return null;
  }
}

/**
 * Find a column layout by row ID, layout ID, and column index
 */
export function findColumnByIds(
  tiles: Tile[],
  rowId: number,
  layoutId: number,
  colIdx: number
): ColumnLocation | null {
  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    const tile = tiles[tileIdx];

    const result = searchInChildren(tile.children, tileIdx);
    if (result) return result;
  }

  return null;

  function searchInChildren(
    children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[],
    tileIdx: number
  ): ColumnLocation | null {
    for (let childIdx = 0; childIdx < children.length; childIdx++) {
      const child = children[childIdx];

      if (child.type === "accordion" && child.id === rowId) {
        // Found the row, now search for the layout
        for (let layoutIdx = 0; layoutIdx < child.children.length; layoutIdx++) {
          const rowChild = child.children[layoutIdx];
          if (rowChild.type === "columnLayout" && rowChild.id === layoutId) {
            return {
              tileIdx,
              rowIdx: childIdx,
              layoutIdx,
              colIdx
            };
          }
        }
      }

      // Recursively search in nested rows
      if (child.type === "accordion") {
        const result = searchInChildren(child.children, tileIdx);
        if (result) return result;
      }
    }

    return null;
  }
}

/**
 * Deep clone tiles data structure
 */
export function cloneTiles(tiles: Tile[]): Tile[] {
  return tiles.map((tile) => ({
    ...tile,
    children: cloneChildren(tile.children),
  }));

  function cloneChildren(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]): any[] {
    return children.map((child) => {
      if (child.type === "accordion") {
        return {
          ...child,
          children: cloneChildren(child.children),
        };
      } else if (child.type === "columnLayout") {
        return {
          ...child,
          children: child.children.map((column) => ({
            ...column,
            children: column.children.map((block) => ({ ...block })),
          })),
        };
      } else if (child.type === "column") {
        return {
          ...child,
          children: child.children.map((block) => ({ ...block })),
        };
      } else {
        return { ...child };
      }
    });
  }
}

/**
 * Move a block to a column
 */
export function moveBlockToColumn(
  tiles: Tile[],
  sourceLocation: BlockLocation,
  targetLocation: ColumnLocation
): Tile[] {
  const updatedTiles = cloneTiles(tiles);

  // Remove block from source
  const removeBlock = (loc: BlockLocation): TileInfoBlock | null => {
    const tile = updatedTiles[loc.tileIdx];

    // Remove from tile level
    if (loc.rowIdx === -1) {
      const block = tile.children[loc.blockIdx];
      if (isTileInfoBlock(block)) {
        tile.children.splice(loc.blockIdx, 1);
        return block;
      }
      return null;
    }

    // Remove from row level
    const row = tile.children[loc.rowIdx];
    if (row.type !== "accordion") return null;

    // Remove from column
    if (loc.layoutIdx !== -1) {
      const layout = row.children[loc.layoutIdx];
      if (layout.type !== "columnLayout") return null;

      const column = getColumnByOrder(layout, loc.colIdx);
      if (!column) return null;
      const block = column.children[loc.blockIdx];
      column.children.splice(loc.blockIdx, 1);
      return block;
    }

    // Remove from row children
    const block = row.children[loc.blockIdx];
    if (isTileInfoBlock(block)) {
      row.children.splice(loc.blockIdx, 1);
      return block;
    }

    return null;
  };

  const block = removeBlock(sourceLocation);
  if (!block) return tiles;

  // Add block to target column
  const targetTile = updatedTiles[targetLocation.tileIdx];
  const targetRow = targetTile.children[targetLocation.rowIdx];
  if (targetRow.type !== "accordion") return tiles;

  const targetLayout = targetRow.children[targetLocation.layoutIdx];
  if (targetLayout.type !== "columnLayout") return tiles;

  const targetColumn = getColumnByOrder(targetLayout, targetLocation.colIdx);
  if (!targetColumn) return tiles;

  // Update block properties
  block.parentId = targetColumn.id;
  block.level = targetLayout.level;
  block.order = targetColumn.children.length;

  targetColumn.children.push(block);

  return updatedTiles;
}

/**
 * Move a block to a row
 */
export function moveBlockToRow(
  tiles: Tile[],
  sourceLocation: BlockLocation,
  targetRowId: number
): Tile[] {
  const updatedTiles = cloneTiles(tiles);

  // Remove block from source (reuse removeBlock logic)
  const removeBlock = (loc: BlockLocation): TileInfoBlock | null => {
    const tile = updatedTiles[loc.tileIdx];

    if (loc.rowIdx === -1) {
      const block = tile.children[loc.blockIdx];
      if (isTileInfoBlock(block)) {
        tile.children.splice(loc.blockIdx, 1);
        return block;
      }
      return null;
    }

    const row = tile.children[loc.rowIdx];
    if (row.type !== "accordion") return null;

    if (loc.layoutIdx !== -1) {
      const layout = row.children[loc.layoutIdx];
      if (layout.type !== "columnLayout") return null;

      const column = getColumnByOrder(layout, loc.colIdx);
      if (!column) return null;
      const block = column.children[loc.blockIdx];
      column.children.splice(loc.blockIdx, 1);
      return block;
    }

    const block = row.children[loc.blockIdx];
    if (isTileInfoBlock(block)) {
      row.children.splice(loc.blockIdx, 1);
      return block;
    }

    return null;
  };

  const block = removeBlock(sourceLocation);
  if (!block) return tiles;

  // Find target row recursively
  const findAndAddToRow = (children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]): boolean => {
    for (const child of children) {
      if (child.type === "accordion") {
        if (child.id === targetRowId) {
          // Found target row - add block
          block.parentId = targetRowId;
          block.level = child.level;
          block.order = child.children.length;
          child.children.push(block);
          return true;
        }

        // Recursively search nested rows
        if (findAndAddToRow(child.children)) {
          return true;
        }
      }
    }
    return false;
  };

  for (const tile of updatedTiles) {
    if (findAndAddToRow(tile.children)) {
      return updatedTiles;
    }
  }

  return tiles; // Target row not found
}

/**
 * Get all blocks from all tiles (recursively)
 */
export function getAllBlocks(tiles: Tile[]): TileInfoBlock[] {
  const blocks: TileInfoBlock[] = [];

  function collectBlocks(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]) {
    for (const child of children) {
      if (child.type === "accordion") {
        collectBlocks(child.children);
      } else if (child.type === "columnLayout") {
        // Collect blocks from all column blocks
        for (const column of child.children) {
          if (column.type === "column") {
            blocks.push(...column.children);
          }
        }
      } else if (isTileInfoBlock(child)) {
        blocks.push(child);
      }
    }
  }

  for (const tile of tiles) {
    collectBlocks(tile.children);
  }

  return blocks;
}

/**
 * Get all rows from all tiles (recursively)
 */
export function getAllRows(tiles: Tile[]): TileInfoRow[] {
  const rows: TileInfoRow[] = [];

  function collectRows(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]) {
    for (const child of children) {
      if (child.type === "accordion") {
        rows.push(child);
        collectRows(child.children);
      }
    }
  }

  for (const tile of tiles) {
    collectRows(tile.children);
  }

  return rows;
}

/**
 * Get all column layout IDs (recursively)
 */
export function getAllColumnLayoutIds(tiles: Tile[]): number[] {
  const layoutIds: number[] = [];

  function collectLayoutIds(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]) {
    for (const child of children) {
      if (child.type === "columnLayout") {
        layoutIds.push(child.id);
      } else if (child.type === "accordion") {
        collectLayoutIds(child.children);
      }
    }
  }

  for (const tile of tiles) {
    collectLayoutIds(tile.children);
  }

  return layoutIds;
}

/**
 * Get all column layouts (recursively)
 */
export function getAllColumnLayouts(tiles: Tile[]): TileInfoColumnLayout[] {
  const layouts: TileInfoColumnLayout[] = [];

  function collectLayouts(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]) {
    for (const child of children) {
      if (child.type === "columnLayout") {
        layouts.push(child);
      } else if (child.type === "accordion") {
        collectLayouts(child.children);
      }
    }
  }

  for (const tile of tiles) {
    collectLayouts(tile.children);
  }

  return layouts;
}

/**
 * Parse column ID string (format: "column-{rowId}-{layoutId}-{columnOrder}")
 */
export function parseColumnId(columnId: string): {
  rowId: number;
  layoutId: number;
  colIdx: number;
} | null {
  const match = columnId.match(/^column-(\d+)-(\d+)-(\d+)$/);
  if (!match) return null;

  return {
    rowId: parseInt(match[1], 10),
    layoutId: parseInt(match[2], 10),
    colIdx: parseInt(match[3], 10),
  };
}
