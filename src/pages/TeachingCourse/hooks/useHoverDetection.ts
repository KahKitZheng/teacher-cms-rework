import { useEffect, useRef, useState } from "react";
import { SELECTORS, REGEX } from "../utils/dragDropConstants";
import { getAllRowIds } from "../utils/dragDropHelpers";

type HoverState = {
  hoveredColumnId: string | null;
  hoveredBlockId: number | null;
};

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
      const columns = document.querySelectorAll(SELECTORS.ALL_COLUMNS);
      let foundColumnId: string | null = null;

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
