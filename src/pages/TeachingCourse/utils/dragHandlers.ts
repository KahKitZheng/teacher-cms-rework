import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  isRowId,
  findBlockById,
  parseColumnId,
  findColumnByIds,
  moveBlockToColumn,
  moveBlockToRow,
  cloneTiles,
} from "./dragDropHelpers";
import { canBeInColumn, isContentBlock, getBlockMetadata } from "./blockRegistry";

/**
 * Check if two blocks have the same category (both containers or both content)
 * This enforces that containers can only swap with containers, and content with content
 */
function haveSameCategory(block1: TileInfoBlock, block2: TileInfoBlock): boolean {
  const meta1 = getBlockMetadata(block1.type);
  const meta2 = getBlockMetadata(block2.type);

  if (!meta1 || !meta2) return false;

  return meta1.category === meta2.category;
}

/**
 * Check if an ID belongs to a column layout
 * Works with unified children arrays (recursively)
 */
function isColumnLayoutId(id: number, tiles: Tile[]): boolean {
  function searchInChildren(children: TileInfoBlock[]): boolean {
    for (const child of children) {
      if (child.type === "columnLayout" && child.id === id) {
        return true;
      }
      if (child.type === "accordion") {
        if (searchInChildren(child.children)) {
          return true;
        }
      }
    }
    return false;
  }

  for (const tile of tiles) {
    if (searchInChildren(tile.children)) {
      return true;
    }
  }
  return false;
}

/**
 * Handle drag start event and return updated drag state
 */
export function handleDragStart(
  event: DragStartEvent,
  tiles: Tile[]
): {
  activeId: number | null;
  activeBlockId: number | null;
  activeLayoutId: number | null;
  overlayWidth: number | null;
} {
  const draggedId = event.active.id as number;
  const isRow = isRowId(draggedId, tiles);
  const isLayout = isColumnLayoutId(draggedId, tiles);

  if (isRow) {
    return {
      activeId: draggedId,
      activeBlockId: null,
      activeLayoutId: null,
      overlayWidth: null,
    };
  } else if (isLayout) {
    return {
      activeId: null,
      activeBlockId: null,
      activeLayoutId: draggedId,
      overlayWidth: null,
    };
  } else {
    // Set initial overlay width based on the block's current column
    let overlayWidth: number | null = null;
    const blockElement = document.getElementById(draggedId.toString());
    if (blockElement) {
      const columnElement = blockElement.closest('[id^="column-"]');
      if (columnElement) {
        const rect = columnElement.getBoundingClientRect();
        overlayWidth = rect.width;
      }
    }

    return {
      activeId: null,
      activeBlockId: draggedId,
      activeLayoutId: null,
      overlayWidth,
    };
  }
}

/**
 * Handle drag end event for row reordering
 * Works with unified children array: rows can sort with tile-level blocks
 */
export function handleRowDragEnd(
  event: DragEndEvent,
  tiles: Tile[]
): Tile[] | null {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return null;
  }

  const updatedTiles = cloneTiles(tiles);
  const tile = updatedTiles[0];

  // Sort children by order
  const sorted = [...tile.children].sort((a, b) => a.order - b.order);

  // Find old and new positions
  const oldIndex = sorted.findIndex((item) => item.id === active.id);
  const newIndex = sorted.findIndex((item) => item.id === over.id);

  if (oldIndex === -1 || newIndex === -1) {
    return null;
  }

  // Reorder the sorted array
  const reordered = arrayMove(sorted, oldIndex, newIndex);

  // Update order fields
  reordered.forEach((item, idx) => {
    item.order = idx;
  });

  // Replace children with reordered array
  tile.children = reordered;

  return updatedTiles;
}

/**
 * Handle drag end event for block reordering/moving
 */
export function handleBlockDragEnd(
  event: DragEndEvent,
  tiles: Tile[],
  _hoveredBlockId: number | null,
  hoveredColumnId: string | null
): Tile[] | null {
  const { active, over } = event;

  if (!over) {
    return null;
  }

  // Find the dragged block
  const sourceResult = findBlockById(tiles, active.id as number);
  if (!sourceResult) {
    return null;
  }

  // Check if this is a tile-level block (for restricting drop targets)
  const isTileLevelBlock = sourceResult.location.itemIdx === -1;

  // Prioritize hovered column over collision detection when available
  // This ensures empty columns can receive blocks even when other blocks are nearby
  // But only blocks that can be in columns should be allowed
  if (hoveredColumnId && !isTileLevelBlock && canBeInColumn(sourceResult.block)) {
    const parsedColumnId = parseColumnId(hoveredColumnId);
    if (parsedColumnId) {
      const targetLocation = findColumnByIds(
        tiles,
        parsedColumnId.rowId,
        parsedColumnId.layoutId,
        parsedColumnId.colIdx
      );
      if (targetLocation) {
        return moveBlockToColumn(tiles, sourceResult.location, targetLocation);
      }
    }
  }

  // Check what we're dropping over using DndKit's over data
  const overData = over.data.current;
  const overType = overData?.type;

  // Case 0: Check if dropping a tile-level block on a row (for reordering at tile level)
  const isOverRow = isRowId(over.id as number, tiles);

  if (isOverRow && isTileLevelBlock && over.id !== active.id) {
    // REORDER: Reorder tile-level block with row at tile level
    const updatedTiles = cloneTiles(tiles);
    const tile = updatedTiles[0];

    // Sort children by order
    const sorted = [...tile.children].sort((a, b) => a.order - b.order);

    const oldIndex = sorted.findIndex((item) => item.id === active.id);
    const newIndex = sorted.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder array
      const reordered = arrayMove(sorted, oldIndex, newIndex);

      // Update order fields
      reordered.forEach((item, idx) => {
        item.order = idx;
      });

      // Replace children
      tile.children = reordered;

      return updatedTiles;
    }
  }

  // Case 1: Dropping over another block (for swapping or reordering)
  if (overType === "block" && over.id !== active.id) {
    const targetResult = findBlockById(tiles, over.id as number);
    if (!targetResult) {
      return null;
    }

    // Check if both blocks are at tile level (for reordering at tile level)
    const bothAtTileLevel =
      sourceResult.location.itemIdx === -1 && targetResult.location.itemIdx === -1;

    if (bothAtTileLevel) {
      // Enforce category restriction: containers can only swap with containers, content with content
      if (!haveSameCategory(sourceResult.block, targetResult.block)) {
        return null;
      }

      // REORDER: Reorder blocks at tile level
      const updatedTiles = cloneTiles(tiles);
      const tile = updatedTiles[0];

      // Sort children by order
      const sorted = [...tile.children].sort((a, b) => a.order - b.order);

      const oldIndex = sorted.findIndex((item) => item.id === active.id);
      const newIndex = sorted.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder array
        const reordered = arrayMove(sorted, oldIndex, newIndex);

        // Update order fields
        reordered.forEach((item, idx) => {
          item.order = idx;
        });

        // Replace children
        tile.children = reordered;

        return updatedTiles;
      }
    }

    // Check if both blocks are at row level in the same row (for reordering within row)
    const bothAtRowLevel =
      sourceResult.location.itemIdx !== -1 &&
      targetResult.location.itemIdx !== -1 &&
      sourceResult.location.colIdx === -1 &&
      targetResult.location.colIdx === -1 &&
      sourceResult.location.tileIdx === targetResult.location.tileIdx &&
      sourceResult.location.rowIdx === targetResult.location.rowIdx;

    if (bothAtRowLevel) {
      // Enforce category restriction: containers can only swap with containers, content with content
      if (!haveSameCategory(sourceResult.block, targetResult.block)) {
        return null;
      }

      // REORDER: Reorder blocks at row level
      const updatedTiles = cloneTiles(tiles);
      const row = updatedTiles[sourceResult.location.tileIdx].children[sourceResult.location.rowIdx] as TileInfoBlockAccordion;

      // Sort children by order
      const sorted = [...row.children].sort((a, b) => a.order - b.order);

      const oldIndex = sorted.findIndex((item) => item.id === active.id);
      const newIndex = sorted.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder array
        const reordered = arrayMove(sorted, oldIndex, newIndex);

        // Update order fields
        reordered.forEach((item, idx) => {
          item.order = idx;
        });

        // Replace children
        row.children = reordered;

        return updatedTiles;
      }
    }

    // Check if both blocks are in the same column (for reordering within column)
    const sameColumn =
      sourceResult.location.tileIdx === targetResult.location.tileIdx &&
      sourceResult.location.rowIdx === targetResult.location.rowIdx &&
      sourceResult.location.layoutIdx === targetResult.location.layoutIdx &&
      sourceResult.location.colIdx === targetResult.location.colIdx &&
      sourceResult.location.colIdx !== -1; // Both are in column layouts

    if (sameColumn) {
      // Enforce category restriction: containers can only swap with containers, content with content
      if (!haveSameCategory(sourceResult.block, targetResult.block)) {
        return null;
      }

      // REORDER: Reorder blocks within the same column
      const updatedTiles = cloneTiles(tiles);
      const row = updatedTiles[sourceResult.location.tileIdx].children[sourceResult.location.rowIdx] as TileInfoBlockAccordion;
      const layout = row.children[sourceResult.location.layoutIdx] as TileInfoColumnLayout;
      const column = layout.children.find(col => col.order === sourceResult.location.colIdx);

      if (!column || column.type !== "column") return null;

      const oldIndex = sourceResult.location.blockIdx;
      const newIndex = targetResult.location.blockIdx;

      // Use arrayMove to reorder
      const reorderedColumn = arrayMove(column.children, oldIndex, newIndex);

      // Update column children
      column.children = reorderedColumn;

      return updatedTiles;
    }

    // Blocks are at different containers/levels - no sorting allowed
    // (Only blocks at the same level can sort together)
    return null;
  }

  // Case 1b: Dropping over a column layout (for swapping block with layout at row level)
  if (overType === "columnLayout" && over.id !== active.id) {
    return swapBlockWithColumnLayout(tiles, active.id as number, over.id as number);
  }

  // Case 1c: Dropping over a row drop zone (to move into row)
  // Tile-level blocks CANNOT be moved into rows
  if (overType === "row-dropzone") {
    const targetRowId = overData?.rowId;
    if (!targetRowId) return null;

    // Prevent tile-level blocks from being moved into rows
    if (isTileLevelBlock) {
      return null;
    }

    // Check if source is NOT already in this row
    const sourceIsInRow = sourceResult.location.rowIdx !== -1;
    let isSameRow = false;

    if (sourceIsInRow) {
      // Find source row by using parentId from the block
      const sourceBlock = sourceResult.block;
      if (sourceBlock.parentId) {
        isSameRow = sourceBlock.parentId === targetRowId;
      }
    }

    if (!isSameRow) {
      // Move block into the target row
      return moveBlockToRow(tiles, sourceResult.location, targetRowId);
    }
  }

  // Case 2: Dropping over a column (for moving to empty/different column)
  // Only content blocks can be moved into columns
  if (overType === "column") {
    // Prevent tile-level blocks from being moved into columns
    if (isTileLevelBlock) {
      return null;
    }

    // Validate that this block type can be in columns
    if (!canBeInColumn(sourceResult.block)) {
      return null;
    }

    const columnId = over.id as string;
    const parsedColumnId = parseColumnId(columnId);
    if (!parsedColumnId) {
      return null;
    }

    const targetLocation = findColumnByIds(
      tiles,
      parsedColumnId.rowId,
      parsedColumnId.layoutId,
      parsedColumnId.colIdx
    );
    if (!targetLocation) {
      return null;
    }

    return moveBlockToColumn(tiles, sourceResult.location, targetLocation);
  }

  return null;
}

/**
 * Swap a block with a column layout in the same row (both at row level)
 * Works with separated arrays: row.blocks and row.layouts
 */
function swapBlockWithColumnLayout(
  tiles: Tile[],
  blockId: number,
  layoutId: number
): Tile[] | null {
  const updatedTiles = cloneTiles(tiles);

  // Recursively search for the row containing both items
  function searchAndSwap(children: TileInfoBlock[]): boolean {
    for (const child of children) {
      if (child.type === "accordion") {
        const block = child.children.find((item) => isContentBlock(item) && item.id === blockId);
        const layout = child.children.find((item) => item.type === "columnLayout" && item.id === layoutId);

        // If both are found in the same row, swap their order fields
        if (block && layout) {
          const tempOrder = block.order;
          block.order = layout.order;
          layout.order = tempOrder;
          return true;
        }

        // Recursively search in nested rows
        if (searchAndSwap(child.children)) {
          return true;
        }
      }
    }
    return false;
  }

  for (const tile of updatedTiles) {
    if (searchAndSwap(tile.children)) {
      return updatedTiles;
    }
  }

  return null;
}

/**
 * Handle drag end event for column layout reordering
 * Column layouts can reorder with row-level blocks and other layouts (all at row level)
 */
export function handleLayoutDragEnd(
  event: DragEndEvent,
  tiles: Tile[]
): Tile[] | null {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return null;
  }

  // Check if we're dropping over a block (for swapping)
  const overData = over.data.current;
  const overType = overData?.type;

  if (overType === "block") {
    // Swap layout with block (both at row level)
    return swapBlockWithColumnLayout(tiles, over.id as number, active.id as number);
  }

  // Otherwise, reorder within the row using unified children approach
  const updatedTiles = cloneTiles(tiles);

  // Recursively search for the row containing the layout
  function searchAndReorder(children: TileInfoBlock[]): boolean {
    for (const child of children) {
      if (child.type === "accordion") {
        // Check if this row contains the active layout
        const hasActiveLayout = child.children.some(
          (item) => item.type === "columnLayout" && item.id === active.id
        );

        if (hasActiveLayout) {
          // Sort children by order
          const sorted = [...child.children].sort((a, b) => a.order - b.order);

          // Find old and new positions
          const oldIndex = sorted.findIndex((item) => item.id === active.id);
          const newIndex = sorted.findIndex((item) => item.id === over!.id);

          if (oldIndex !== -1 && newIndex !== -1) {
            // Reorder array
            const reordered = arrayMove(sorted, oldIndex, newIndex);

            // Update order fields
            reordered.forEach((item, idx) => {
              item.order = idx;
            });

            // Replace children
            child.children = reordered;

            return true;
          }
        }

        // Recursively search in nested rows
        if (searchAndReorder(child.children)) {
          return true;
        }
      }
    }
    return false;
  }

  for (const tile of updatedTiles) {
    if (searchAndReorder(tile.children)) {
      return updatedTiles;
    }
  }

  return null;
}
