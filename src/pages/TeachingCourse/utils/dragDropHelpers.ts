/**
 * Utility functions for drag and drop operations on tiles, rows, and blocks
 * Uses global types defined in src/types/template.d.ts
 */

/**
 * Location of a block within the nested tile structure
 */
export type BlockLocation = {
  tileIdx: number;
  rowIdx: number;
  colIdx: number;
  blockIdx: number;
};

/**
 * Location of a column within the nested tile structure
 */
export type ColumnLocation = {
  tileIdx: number;
  rowIdx: number;
  colIdx: number;
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
  return tiles.flatMap((tile) => tile.data.map((row) => row.id));
}

/**
 * Check if an ID belongs to a row
 */
export function isRowId(id: number, tiles: Tile[]): boolean {
  return getAllRowIds(tiles).includes(id);
}

/**
 * Find a block by its ID across all tiles
 */
export function findBlockById(
  tiles: Tile[],
  blockId: number
): BlockSearchResult | null {
  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    for (let rowIdx = 0; rowIdx < tiles[tileIdx].data.length; rowIdx++) {
      for (
        let colIdx = 0;
        colIdx < tiles[tileIdx].data[rowIdx].columns.length;
        colIdx++
      ) {
        const blocks = tiles[tileIdx].data[rowIdx].columns[colIdx].blocks;
        for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
          if (blocks[blockIdx].id === blockId) {
            return {
              block: blocks[blockIdx],
              location: { tileIdx, rowIdx, colIdx, blockIdx },
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
    for (let rowIdx = 0; rowIdx < tiles[tileIdx].data.length; rowIdx++) {
      if (tiles[tileIdx].data[rowIdx].id === rowId) {
        return {
          row: tiles[tileIdx].data[rowIdx],
          tileIdx,
          rowIdx,
        };
      }
    }
  }
  return null;
}

/**
 * Find a column by row ID and column ID
 */
export function findColumnByIds(
  tiles: Tile[],
  rowId: number,
  columnId: number
): ColumnLocation | null {
  for (let tileIdx = 0; tileIdx < tiles.length; tileIdx++) {
    for (let rowIdx = 0; rowIdx < tiles[tileIdx].data.length; rowIdx++) {
      if (tiles[tileIdx].data[rowIdx].id === rowId) {
        for (
          let colIdx = 0;
          colIdx < tiles[tileIdx].data[rowIdx].columns.length;
          colIdx++
        ) {
          if (tiles[tileIdx].data[rowIdx].columns[colIdx].id === columnId) {
            return { tileIdx, rowIdx, colIdx };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Parse a column ID string to extract row and column IDs
 * Format: "column-{rowId}-{columnId}"
 */
export function parseColumnId(columnId: string): {
  rowId: number;
  columnId: number;
} | null {
  const parts = columnId.split("-");
  if (parts.length !== 3 || parts[0] !== "column") {
    return null;
  }
  return {
    rowId: parseInt(parts[1]),
    columnId: parseInt(parts[2]),
  };
}

/**
 * Create a deep clone of tiles to ensure immutability
 */
export function cloneTiles(tiles: Tile[]): Tile[] {
  return tiles.map((tile) => ({
    ...tile,
    data: tile.data.map((row) => ({
      ...row,
      columns: row.columns.map((col) => ({
        ...col,
        blocks: [...col.blocks],
      })),
    })),
  }));
}

/**
 * Swap two blocks at given locations
 */
export function swapBlocks(
  tiles: Tile[],
  sourceLocation: BlockLocation,
  targetLocation: BlockLocation
): Tile[] {
  const updatedTiles = cloneTiles(tiles);

  const sourceBlock =
    updatedTiles[sourceLocation.tileIdx].data[sourceLocation.rowIdx].columns[
      sourceLocation.colIdx
    ].blocks[sourceLocation.blockIdx];

  const targetBlock =
    updatedTiles[targetLocation.tileIdx].data[targetLocation.rowIdx].columns[
      targetLocation.colIdx
    ].blocks[targetLocation.blockIdx];

  // Perform swap
  updatedTiles[sourceLocation.tileIdx].data[sourceLocation.rowIdx].columns[
    sourceLocation.colIdx
  ].blocks[sourceLocation.blockIdx] = targetBlock;

  updatedTiles[targetLocation.tileIdx].data[targetLocation.rowIdx].columns[
    targetLocation.colIdx
  ].blocks[targetLocation.blockIdx] = sourceBlock;

  return updatedTiles;
}

/**
 * Move a block from one location to another column
 */
export function moveBlockToColumn(
  tiles: Tile[],
  sourceLocation: BlockLocation,
  targetLocation: ColumnLocation
): Tile[] {
  const updatedTiles = cloneTiles(tiles);

  // Get the block to move
  const block =
    updatedTiles[sourceLocation.tileIdx].data[sourceLocation.rowIdx].columns[
      sourceLocation.colIdx
    ].blocks[sourceLocation.blockIdx];

  // Remove from source
  updatedTiles[sourceLocation.tileIdx].data[sourceLocation.rowIdx].columns[
    sourceLocation.colIdx
  ].blocks.splice(sourceLocation.blockIdx, 1);

  // Add to target
  updatedTiles[targetLocation.tileIdx].data[targetLocation.rowIdx].columns[
    targetLocation.colIdx
  ].blocks.push(block);

  return updatedTiles;
}

/**
 * Get all blocks from all tiles (flattened)
 */
export function getAllBlocks(tiles: Tile[]): TileInfoBlock[] {
  return tiles
    .flatMap((tile) => tile.data)
    .flatMap((row) => row.columns)
    .flatMap((col) => col.blocks);
}

/**
 * Get all rows from all tiles (flattened)
 */
export function getAllRows(tiles: Tile[]): TileInfoRow[] {
  return tiles.flatMap((tile) => tile.data);
}
