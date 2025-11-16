import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  isRowId,
  findBlockById,
  parseColumnId,
  findColumnByIds,
  swapBlocks,
  moveBlockToColumn,
} from "./dragDropHelpers";

/**
 * Handle drag start event and return updated drag state
 */
export function handleDragStart(
  event: DragStartEvent,
  tiles: Tile[]
): {
  activeId: number | null;
  activeBlockId: number | null;
  overlayWidth: number | null;
} {
  const draggedId = event.active.id as number;
  const isRow = isRowId(draggedId, tiles);

  if (isRow) {
    return {
      activeId: draggedId,
      activeBlockId: null,
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
      overlayWidth,
    };
  }
}

/**
 * Handle drag end event for row reordering
 */
export function handleRowDragEnd(
  event: DragEndEvent,
  tiles: Tile[]
): Tile[] | null {
  const { active, over } = event;

  if (!over || active.id === over.id) {
    return null;
  }

  const allRowIds = tiles.flatMap((tile) => tile.data.map((row) => row.id));
  const isOverRow = allRowIds.includes(over.id as number);

  if (!isOverRow) {
    return null;
  }

  const allRows = tiles.flatMap((tile) => tile.data);
  const oldIndex = allRows.findIndex((row) => row.id === active.id);
  const newIndex = allRows.findIndex((row) => row.id === over.id);

  // Reorder rows within first tile (assuming single tile for now)
  const updatedTiles = [...tiles];
  updatedTiles[0] = {
    ...updatedTiles[0],
    data: arrayMove(updatedTiles[0].data, oldIndex, newIndex),
  };

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
  const { active } = event;

  const isDropOnBlock = hoveredBlockId !== null;
  const isDropOnColumn = hoveredColumnId !== null && hoveredBlockId === null;

  if (!isDropOnBlock && !isDropOnColumn) {
    return null;
  }

  // Find the dragged block
  const sourceResult = findBlockById(tiles, active.id as number);
  if (!sourceResult) {
    return null;
  }

  if (isDropOnBlock) {
    // SWAP: Dropping on another block
    if (hoveredBlockId === active.id) {
      return null; // Don't swap with itself
    }

    const targetResult = findBlockById(tiles, hoveredBlockId);
    if (!targetResult) {
      return null;
    }

    return swapBlocks(tiles, sourceResult.location, targetResult.location);
  } else if (isDropOnColumn) {
    // APPEND: Dropping on empty column space
    const parsedColumnId = parseColumnId(hoveredColumnId!);
    if (!parsedColumnId) {
      return null;
    }

    const targetLocation = findColumnByIds(
      tiles,
      parsedColumnId.rowId,
      parsedColumnId.columnId
    );
    if (!targetLocation) {
      return null;
    }

    return moveBlockToColumn(tiles, sourceResult.location, targetLocation);
  }

  return null;
}
