/**
 * Utility functions for computing block levels from the tree structure
 */

export type BlockLevel = "tile" | "accordion" | "column";

/**
 * Compute levels for all blocks in the tile tree
 * Returns a Map of blockId -> level
 * - Tile-level blocks (direct children of tile): level = "tile"
 * - Accordion-level blocks (children of accordion): level = "accordion"
 * - Column-level blocks (children of column in a layout): level = "column"
 */
export function computeBlockLevels(tiles: Tile[]): Map<number, BlockLevel> {
  const levels = new Map<number, BlockLevel>();

  function processChildren(children: TileInfoBlock[], parentType: "tile" | "accordion" | "column") {
    for (const child of children) {
      // Determine the level based on where this block lives
      let childLevel: BlockLevel;

      if (child.type === "accordion") {
        // Accordions themselves are at the parent's level
        childLevel = parentType;
        levels.set(child.id, childLevel);
        // Accordion's direct children are at "accordion" level
        processChildren(child.children, "accordion");
      } else if (child.type === "columnLayout") {
        // Column layouts are at the parent's level (accordion level)
        childLevel = parentType;
        levels.set(child.id, childLevel);
        // Process columns
        for (const column of child.children) {
          if (column.type === "column") {
            // Columns are at accordion level (they're part of the layout)
            levels.set(column.id, parentType);
            // Column's children are at "column" level
            processChildren(column.children, "column");
          }
        }
      } else {
        // Content blocks are at the parent's level
        childLevel = parentType;
        levels.set(child.id, childLevel);
      }
    }
  }

  for (const tile of tiles) {
    // Tile-level children start at "tile" level
    processChildren(tile.children, "tile");
  }

  return levels;
}

/**
 * Get the level of a specific block
 * Returns "tile", "accordion", or "column"
 */
export function getBlockLevel(
  blockId: number,
  levelMap: Map<number, BlockLevel>
): BlockLevel | undefined {
  return levelMap.get(blockId);
}
