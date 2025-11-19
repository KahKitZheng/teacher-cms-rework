import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  isRowId,
  findBlockById,
  parseColumnId,
  findColumnByIds,
  swapBlocks,
  moveBlockToColumn,
  moveBlockToRow,
  cloneTiles,
} from "./dragDropHelpers";

/**
 * Check if an ID belongs to a column layout
 * Works with separated arrays: row.layouts
 */
function isColumnLayoutId(id: number, tiles: Tile[]): boolean {
  for (const tile of tiles) {
    for (const row of tile.rows) {
      for (const layout of row.layouts) {
        if (layout.id === id) {
          return true;
        }
      }
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
 * Works with separated arrays: rows can sort with tile-level blocks
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

  // Combine blocks and rows for sorting (with temp markers)
  const combined = [
    ...tile.blocks.map((block, idx) => ({ item: block, type: 'block' as const, idx })),
    ...tile.rows.map((row, idx) => ({ item: row, type: 'row' as const, idx })),
  ].sort((a, b) => a.item.order - b.item.order);

  // Find old and new positions in combined array
  const oldIndex = combined.findIndex((entry) => entry.item.id === active.id);
  const newIndex = combined.findIndex((entry) => entry.item.id === over.id);

  if (oldIndex === -1 || newIndex === -1) {
    return null;
  }

  // Reorder the combined array
  const reordered = arrayMove(combined, oldIndex, newIndex);

  // Update order fields
  reordered.forEach((entry, idx) => {
    entry.item.order = idx;
  });

  // No need to separate back - arrays are already updated by reference

  return updatedTiles;
}

/**
 * Handle drag end event for block reordering/moving
 */
export function handleBlockDragEnd(
  event: DragEndEvent,
  tiles: Tile[],
  hoveredBlockId: number | null,
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
  // But tile-level blocks CANNOT be moved into columns
  if (hoveredColumnId && !isTileLevelBlock) {
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

    // Combine blocks and rows for sorting
    const combined = [
      ...tile.blocks.map((block, idx) => ({ item: block, type: 'block' as const, idx })),
      ...tile.rows.map((row, idx) => ({ item: row, type: 'row' as const, idx })),
    ].sort((a, b) => a.item.order - b.item.order);

    const oldIndex = combined.findIndex((entry) => entry.item.id === active.id);
    const newIndex = combined.findIndex((entry) => entry.item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder the combined array
      const reordered = arrayMove(combined, oldIndex, newIndex);

      // Update order fields
      reordered.forEach((entry, idx) => {
        entry.item.order = idx;
      });

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
      // REORDER: Reorder blocks at tile level
      const updatedTiles = cloneTiles(tiles);
      const tile = updatedTiles[0];

      // Combine blocks and rows for sorting
      const combined = [
        ...tile.blocks.map((block, idx) => ({ item: block, type: 'block' as const, idx })),
        ...tile.rows.map((row, idx) => ({ item: row, type: 'row' as const, idx })),
      ].sort((a, b) => a.item.order - b.item.order);

      const oldIndex = combined.findIndex((entry) => entry.item.id === active.id);
      const newIndex = combined.findIndex((entry) => entry.item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder the combined array
        const reordered = arrayMove(combined, oldIndex, newIndex);

        // Update order fields
        reordered.forEach((entry, idx) => {
          entry.item.order = idx;
        });

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
      // REORDER: Reorder blocks at row level
      const updatedTiles = cloneTiles(tiles);
      const row = updatedTiles[sourceResult.location.tileIdx].rows[sourceResult.location.rowIdx];

      // Combine blocks and layouts for sorting
      const combined = [
        ...row.blocks.map((block, idx) => ({ item: block, type: 'block' as const, idx })),
        ...row.layouts.map((layout, idx) => ({ item: layout, type: 'layout' as const, idx })),
      ].sort((a, b) => a.item.order - b.item.order);

      const oldIndex = combined.findIndex((entry) => entry.item.id === active.id);
      const newIndex = combined.findIndex((entry) => entry.item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder the combined array
        const reordered = arrayMove(combined, oldIndex, newIndex);

        // Update order fields
        reordered.forEach((entry, idx) => {
          entry.item.order = idx;
        });

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
      // REORDER: Reorder blocks within the same column
      const updatedTiles = cloneTiles(tiles);
      const row = updatedTiles[sourceResult.location.tileIdx].rows[sourceResult.location.rowIdx];
      const layout = row.layouts[sourceResult.location.layoutIdx];
      const column = sourceResult.location.colIdx === 0 ? layout.leftColumn : layout.rightColumn;

      const oldIndex = sourceResult.location.blockIdx;
      const newIndex = targetResult.location.blockIdx;

      // Use arrayMove to reorder
      const reorderedColumn = arrayMove(column, oldIndex, newIndex);

      // Update the column reference
      if (sourceResult.location.colIdx === 0) {
        layout.leftColumn = reorderedColumn;
      } else {
        layout.rightColumn = reorderedColumn;
      }

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
      const sourceRow = tiles[sourceResult.location.tileIdx].rows[sourceResult.location.rowIdx];
      isSameRow = sourceRow.id === targetRowId;
    }

    if (!isSameRow) {
      // Move block into the target row
      return moveBlockToRow(tiles, sourceResult.location, targetRowId);
    }
  }

  // Case 2: Dropping over a column (for moving to empty/different column)
  // Tile-level blocks CANNOT be moved into columns
  if (overType === "column") {
    // Prevent tile-level blocks from being moved into columns
    if (isTileLevelBlock) {
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

  // Find the row containing both the block and the layout
  for (const tile of updatedTiles) {
    for (const row of tile.rows) {
      const block = row.blocks.find((b) => b.id === blockId);
      const layout = row.layouts.find((l) => l.id === layoutId);

      // If both are found in the same row, swap their order fields
      if (block && layout) {
        const tempOrder = block.order;
        block.order = layout.order;
        layout.order = tempOrder;
        return updatedTiles;
      }
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

  // Otherwise, reorder within the row using combined array approach
  const updatedTiles = cloneTiles(tiles);

  for (const tile of updatedTiles) {
    for (const row of tile.rows) {
      // Check if this row contains the active layout
      const hasActiveLayout = row.layouts.some(layout => layout.id === active.id);

      if (hasActiveLayout) {
        // Combine blocks and layouts for sorting
        const combined = [
          ...row.blocks.map((block, idx) => ({ item: block, type: 'block' as const, idx })),
          ...row.layouts.map((layout, idx) => ({ item: layout, type: 'layout' as const, idx })),
        ].sort((a, b) => a.item.order - b.item.order);

        // Find old and new positions in combined array
        const oldIndex = combined.findIndex((entry) => entry.item.id === active.id);
        const newIndex = combined.findIndex((entry) => entry.item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Reorder the combined array
          const reordered = arrayMove(combined, oldIndex, newIndex);

          // Update order fields
          reordered.forEach((entry, idx) => {
            entry.item.order = idx;
          });

          return updatedTiles;
        }
      }
    }
  }

  return null;
}
