import { useEffect, useRef, useState } from "react";
import { SELECTORS, REGEX } from "../utils/dragDropConstants";
import { getAllRowIds, findBlockById } from "../utils/dragDropHelpers";

type HoverState = {
  hoveredColumnId: string | null;
  hoveredBlockId: number | null;
};

/**
 * Helper to determine a block's level
 */
function getBlockLevel(
  blockId: number,
  tileInfo: Tile[]
): "tile" | "row" | "column" | null {
  const result = findBlockById(tileInfo, blockId);
  if (!result) return null;

  const { location } = result;

  // Tile-level: itemIdx === -1
  if (location.itemIdx === -1) return "tile";

  // Column-level: colIdx !== -1
  if (location.colIdx !== -1) return "column";

  // Row-level: itemIdx !== -1 && colIdx === -1
  return "row";
}

/**
 * Check if a dragged block can be dropped on a target block based on their levels
 */
function canDropOnBlock(
  activeLevel: string | null,
  targetLevel: string | null
): boolean {
  if (!activeLevel || !targetLevel) return false;

  // Tile-level blocks can only drop on other tile-level blocks
  if (activeLevel === "tile") return targetLevel === "tile";

  // Row-level and column-level blocks can drop on blocks at the same level
  return activeLevel === targetLevel;
}

/**
 * Custom hook for cursor-based hover detection during drag operations
 * This provides more accurate drop zone detection than collision detection alone
 */
export function useHoverDetection(
  activeBlockId: number | null,
  tileInfo: Tile[]
): HoverState {
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<number | null>(null);
  const cursorPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorPositionRef.current = { x: e.clientX, y: e.clientY };

      if (!activeBlockId) {
        setHoveredColumnId(null);
        setHoveredBlockId(null);
        return;
      }

      // Detect hovered column
      // Get the active block's level for compatibility checking
      const activeLevel = activeBlockId
        ? getBlockLevel(activeBlockId, tileInfo)
        : null;

      // Only detect column hovers if the active block can move into columns
      // Tile-level blocks cannot move into columns
      let foundColumnId: string | null = null;

      if (activeLevel !== "tile") {
        const columns = document.querySelectorAll(SELECTORS.ALL_COLUMNS);

        for (const column of columns) {
          const rect = (column as HTMLElement).getBoundingClientRect();
          const isInside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;

          if (isInside) {
            foundColumnId = column.id;
            break;
          }
        }
      }

      setHoveredColumnId(foundColumnId);

      // Detect hovered block
      const allRowIds = getAllRowIds(tileInfo);
      const blocks = document.querySelectorAll(
        `${SELECTORS.ALL_IDS}${SELECTORS.EXCLUDE_COLUMNS}${SELECTORS.EXCLUDE_BLOCKS}`
      );
      let foundBlockId: number | null = null;

      for (const block of blocks) {
        const blockElement = block as HTMLElement;

        // Skip if not a numeric ID
        if (!REGEX.NUMERIC_ID.test(blockElement.id)) continue;

        const blockId = parseInt(blockElement.id);

        // Skip row IDs
        if (allRowIds.includes(blockId)) continue;

        // Don't highlight the block being dragged
        if (blockId === activeBlockId) continue;

        // Check if the hovered block is compatible with the active block's level
        const targetLevel = getBlockLevel(blockId, tileInfo);
        if (!canDropOnBlock(activeLevel, targetLevel)) continue;

        const rect = blockElement.getBoundingClientRect();
        const isInside =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isInside) {
          foundBlockId = blockId;
          break;
        }
      }

      setHoveredBlockId(foundBlockId);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [activeBlockId, tileInfo]);

  return { hoveredColumnId, hoveredBlockId };
}
