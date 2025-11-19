/**
 * Utility functions for drag and drop operations on tiles, rows, and blocks
 * Uses global types defined in src/types/template.d.ts
 */

/**
 * Type guard to check if an item is a TileInfoRow
 */
function isTileInfoRow(item: TileInfoRow | TileInfoBlock): item is TileInfoRow {
  return (item as TileInfoRow).type === "row";
}

/**
 * Type guard to check if an item is a TileInfoColumnLayout
 */
function isTileInfoColumnLayout(
  item: TileInfoBlock | TileInfoColumnLayout
): item is TileInfoColumnLayout {
  return (item as TileInfoColumnLayout).type === "columnLayout";
}

/**
 * Location of a block within the nested tile structure
 * With separated arrays: tile.blocks, tile.rows, row.blocks, row.layouts, layout.leftColumn/rightColumn
 */
export type BlockLocation = {
  tileIdx: number;
  rowIdx: number; // Index in tile.rows, or -1 if at tile level (in tile.blocks)
  itemIdx: number; // Index in row.blocks or row.layouts, or -1 if at tile/column level
  layoutIdx: number; // Index in row.layouts, or -1 if not in layout
  colIdx: number; // 0 for left, 1 for right in leftColumn/rightColumn, or -1 if not in layout
  blockIdx: number; // Index in tile.blocks, row.blocks, leftColumn, or rightColumn depending on level
};

/**
 * Location of a column within the nested tile structure
 * With separated arrays: row.layouts contains column layouts
 */
export type ColumnLocation = {
  tileIdx: number;
  rowIdx: number; // Index in tile.rows
  layoutIdx: number; // Index in row.layouts that contains the column layout
  colIdx: number; // 0 for leftColumn, 1 for rightColumn
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
 * Get all row IDs from tiles
 */
export function getAllRowIds(tiles: Tile[]): number[] {
  return tiles.flatMap((tile) => tile.rows.map((row) => row.id));
}

/**
 * Check if an ID belongs to a row
 */
export function isRowId(id: number, tiles: Tile[]): boolean {
  return getAllRowIds(tiles).includes(id);
}

/**
 * Find a block by its ID across all tiles
 * Searches through tile.blocks, row.blocks, and layout.leftColumn/rightColumn
 */
export function findBlockById(
  tiles: Tile[],
  blockId: number
): BlockSearchResult | null {
  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    const tile = tiles[tileIdx];

    // Check tile-level blocks
    for (let blockIdx = 0; blockIdx < tile.blocks.length; blockIdx++) {
      if (tile.blocks[blockIdx].id === blockId) {
        return {
          block: tile.blocks[blockIdx],
          location: {
            tileIdx,
            rowIdx: -1,
            itemIdx: -1,
            layoutIdx: -1,
            colIdx: -1,
            blockIdx
          },
        };
      }
    }

    // Check blocks within rows
    for (let rowIdx = 0; rowIdx < tile.rows.length; rowIdx++) {
      const row = tile.rows[rowIdx];

      // Check row-level blocks
      for (let blockIdx = 0; blockIdx < row.blocks.length; blockIdx++) {
        if (row.blocks[blockIdx].id === blockId) {
          return {
            block: row.blocks[blockIdx],
            location: {
              tileIdx,
              rowIdx,
              itemIdx: blockIdx,
              layoutIdx: -1,
              colIdx: -1,
              blockIdx
            },
          };
        }
      }

      // Check blocks within column layouts
      for (let layoutIdx = 0; layoutIdx < row.layouts.length; layoutIdx++) {
        const layout = row.layouts[layoutIdx];

        // Check left column
        for (let blockIdx = 0; blockIdx < layout.leftColumn.length; blockIdx++) {
          if (layout.leftColumn[blockIdx].id === blockId) {
            return {
              block: layout.leftColumn[blockIdx],
              location: {
                tileIdx,
                rowIdx,
                itemIdx: -1,
                layoutIdx,
                colIdx: 0,
                blockIdx
              },
            };
          }
        }

        // Check right column
        for (let blockIdx = 0; blockIdx < layout.rightColumn.length; blockIdx++) {
          if (layout.rightColumn[blockIdx].id === blockId) {
            return {
              block: layout.rightColumn[blockIdx],
              location: {
                tileIdx,
                rowIdx,
                itemIdx: -1,
                layoutIdx,
                colIdx: 1,
                blockIdx
              },
            };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Find a row by its ID across all tiles
 */
export function findRowById(
  tiles: Tile[],
  rowId: number
): RowSearchResult | null {
  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    for (let rowIdx = 0; rowIdx < tiles[tileIdx].rows.length; rowIdx++) {
      const row = tiles[tileIdx].rows[rowIdx];
      if (row.id === rowId) {
        return {
          row,
          tileIdx,
          rowIdx,
        };
      }
    }
  }
  return null;
}

/**
 * Find a column by row ID and layout ID + column side
 * In the new structure, columns are leftColumn/rightColumn arrays in layouts
 * columnId format: layoutId for the layout, colIdx (0=left, 1=right) for the column
 */
export function findColumnByIds(
  tiles: Tile[],
  rowId: number,
  layoutId: number,
  colIdx: number // 0 for left, 1 for right
): ColumnLocation | null {
  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    const tile = tiles[tileIdx];
    for (let rowIdx = 0; rowIdx < tile.rows.length; rowIdx++) {
      const row = tile.rows[rowIdx];
      if (row.id === rowId) {
        // Search through row.layouts
        for (let layoutIdx = 0; layoutIdx < row.layouts.length; layoutIdx++) {
          const layout = row.layouts[layoutIdx];
          if (layout.id === layoutId) {
            return { tileIdx, rowIdx, layoutIdx, colIdx };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Parse a column ID string to extract row, layout, and column side
 * New format: "column-{rowId}-{layoutId}-{side}" where side is "left" or "right"
 * Old format (deprecated): "column-{rowId}-{columnId}"
 */
export function parseColumnId(columnId: string): {
  rowId: number;
  layoutId: number;
  colIdx: number; // 0 for left, 1 for right
} | null {
  const parts = columnId.split("-");
  if (parts.length !== 4 || parts[0] !== "column") {
    return null;
  }
  const side = parts[3];
  if (side !== "left" && side !== "right") {
    return null;
  }
  return {
    rowId: parseInt(parts[1]),
    layoutId: parseInt(parts[2]),
    colIdx: side === "left" ? 0 : 1,
  };
}

/**
 * Create a deep clone of tiles to ensure immutability
 * With separated arrays: tile.blocks, tile.rows, row.blocks, row.layouts
 */
export function cloneTiles(tiles: Tile[]): Tile[] {
  return tiles.map((tile) => ({
    ...tile,
    blocks: tile.blocks.map((block) => ({ ...block })),
    rows: tile.rows.map((row) => ({
      ...row,
      blocks: row.blocks.map((block) => ({ ...block })),
      layouts: row.layouts.map((layout) => ({
        ...layout,
        leftColumn: layout.leftColumn.map((block) => ({ ...block })),
        rightColumn: layout.rightColumn.map((block) => ({ ...block })),
      })),
    })),
  }));
}

/**
 * Swap two blocks at given locations
 * Works with separated arrays: tile.blocks, row.blocks, layout.leftColumn/rightColumn
 */
export function swapBlocks(
  tiles: Tile[],
  sourceLocation: BlockLocation,
  targetLocation: BlockLocation
): Tile[] {
  const updatedTiles = cloneTiles(tiles);

  // Helper function to get block reference from location
  const getBlockArray = (loc: BlockLocation): TileInfoBlock[] | null => {
    const tile = updatedTiles[loc.tileIdx];

    // Tile-level block
    if (loc.rowIdx === -1) {
      return tile.blocks;
    }

    const row = tile.rows[loc.rowIdx];

    // Row-level block
    if (loc.layoutIdx === -1) {
      return row.blocks;
    }

    // Column-level block
    const layout = row.layouts[loc.layoutIdx];
    return loc.colIdx === 0 ? layout.leftColumn : layout.rightColumn;
  };

  const sourceArray = getBlockArray(sourceLocation);
  const targetArray = getBlockArray(targetLocation);

  if (!sourceArray || !targetArray) {
    return updatedTiles;
  }

  // Get the blocks
  const sourceBlock = sourceArray[sourceLocation.blockIdx];
  const targetBlock = targetArray[targetLocation.blockIdx];

  if (!sourceBlock || !targetBlock) {
    return updatedTiles;
  }

  // Perform the swap
  sourceArray[sourceLocation.blockIdx] = targetBlock;
  targetArray[targetLocation.blockIdx] = sourceBlock;

  return updatedTiles;
}

/**
 * Move a block from one location to another column
 * Works with separated arrays structure
 */
export function moveBlockToColumn(
  tiles: Tile[],
  sourceLocation: BlockLocation,
  targetLocation: ColumnLocation
): Tile[] {
  const updatedTiles = cloneTiles(tiles);

  // Helper function to get and remove block from source
  const removeBlock = (loc: BlockLocation): TileInfoBlock | null => {
    const tile = updatedTiles[loc.tileIdx];

    // Tile-level block
    if (loc.rowIdx === -1) {
      const block = tile.blocks[loc.blockIdx];
      tile.blocks.splice(loc.blockIdx, 1);
      return block;
    }

    const row = tile.rows[loc.rowIdx];

    // Row-level block
    if (loc.layoutIdx === -1) {
      const block = row.blocks[loc.blockIdx];
      row.blocks.splice(loc.blockIdx, 1);
      return block;
    }

    // Column-level block
    const layout = row.layouts[loc.layoutIdx];
    const column = loc.colIdx === 0 ? layout.leftColumn : layout.rightColumn;
    const block = column[loc.blockIdx];
    column.splice(loc.blockIdx, 1);
    return block;
  };

  // Remove block from source
  const block = removeBlock(sourceLocation);
  if (!block) {
    return updatedTiles;
  }

  // Add to target column
  const targetTile = updatedTiles[targetLocation.tileIdx];
  const targetRow = targetTile.rows[targetLocation.rowIdx];
  const targetLayout = targetRow.layouts[targetLocation.layoutIdx];
  const targetColumn = targetLocation.colIdx === 0 ? targetLayout.leftColumn : targetLayout.rightColumn;

  targetColumn.push(block);

  return updatedTiles;
}

/**
 * Get all blocks from all tiles (flattened)
 * Includes blocks from tile.blocks, row.blocks, and layout.leftColumn/rightColumn
 */
export function getAllBlocks(tiles: Tile[]): TileInfoBlock[] {
  const blocks: TileInfoBlock[] = [];

  for (const tile of tiles) {
    // Add tile-level blocks
    blocks.push(...tile.blocks);

    // Add blocks from rows
    for (const row of tile.rows) {
      // Add row-level blocks
      blocks.push(...row.blocks);

      // Add blocks from column layouts
      for (const layout of row.layouts) {
        blocks.push(...layout.leftColumn);
        blocks.push(...layout.rightColumn);
      }
    }
  }

  return blocks;
}

/**
 * Get all rows from all tiles (flattened)
 */
export function getAllRows(tiles: Tile[]): TileInfoRow[] {
  return tiles.flatMap((tile) => tile.rows);
}

/**
 * Get all column layout IDs from tiles
 */
export function getAllColumnLayoutIds(tiles: Tile[]): number[] {
  const layoutIds: number[] = [];

  for (const tile of tiles) {
    for (const row of tile.rows) {
      for (const layout of row.layouts) {
        layoutIds.push(layout.id);
      }
    }
  }

  return layoutIds;
}

/**
 * Get all column layouts from tiles (flattened)
 */
export function getAllColumnLayouts(tiles: Tile[]): TileInfoColumnLayout[] {
  const layouts: TileInfoColumnLayout[] = [];

  for (const tile of tiles) {
    for (const row of tile.rows) {
      layouts.push(...row.layouts);
    }
  }

  return layouts;
}

/**
 * Move a block from one location to a row's blocks array
 * Works with separated arrays structure
 */
export function moveBlockToRow(
  tiles: Tile[],
  sourceLocation: BlockLocation,
  targetRowId: number
): Tile[] {
  const updatedTiles = cloneTiles(tiles);

  // Helper function to get and remove block from source
  const removeBlock = (loc: BlockLocation): TileInfoBlock | null => {
    const tile = updatedTiles[loc.tileIdx];

    // Tile-level block
    if (loc.rowIdx === -1) {
      const block = tile.blocks[loc.blockIdx];
      tile.blocks.splice(loc.blockIdx, 1);
      return block;
    }

    const row = tile.rows[loc.rowIdx];

    // Row-level block
    if (loc.layoutIdx === -1) {
      const block = row.blocks[loc.blockIdx];
      row.blocks.splice(loc.blockIdx, 1);
      return block;
    }

    // Column-level block
    const layout = row.layouts[loc.layoutIdx];
    const column = loc.colIdx === 0 ? layout.leftColumn : layout.rightColumn;
    const block = column[loc.blockIdx];
    column.splice(loc.blockIdx, 1);
    return block;
  };

  // Remove block from source
  const block = removeBlock(sourceLocation);
  if (!block) {
    return updatedTiles;
  }

  // Find target row and add block
  for (const tile of updatedTiles) {
    for (const row of tile.rows) {
      if (row.id === targetRowId) {
        row.blocks.push(block);
        return updatedTiles;
      }
    }
  }

  return updatedTiles;
}
