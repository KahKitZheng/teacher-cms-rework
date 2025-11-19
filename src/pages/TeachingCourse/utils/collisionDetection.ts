import { closestCenter, closestCorners, type CollisionDetection } from "@dnd-kit/core";
import { getAllRowIds, getAllColumnLayoutIds } from "./dragDropHelpers";
import { SELECTORS } from "./dragDropConstants";

/**
 * Custom collision detection that filters droppable containers based on drag type and level
 * - Rows can drop on other rows or tile-level blocks (for reordering at tile level, vertical only)
 * - Tile-level blocks can drop on rows AND other tile-level blocks (for vertical sorting at tile level)
 *   - Tile-level blocks CANNOT move into rows or columns
 * - Row-level blocks can drop on other row-level blocks (for sorting within row)
 *   - Row-level blocks can also move into rows (via row-dropzone) or between columns
 * - Column-level blocks can drop on other column-level blocks (for sorting within column)
 *   - Column-level blocks can also move between columns
 * - Column layouts can drop on blocks or other column layouts within the same row
 */
export function createCustomCollisionDetection(
  tileInfo: Tile[]
): CollisionDetection {
  return (args) => {
    const allRowIds = getAllRowIds(tileInfo);
    const allLayoutIds = getAllColumnLayoutIds(tileInfo);

    // Convert active.id to number for comparison
    const activeIdNum =
      typeof args.active.id === "number"
        ? args.active.id
        : Number(args.active.id);

    // Determine what type of item is being dragged
    const isDraggingRow = allRowIds.includes(activeIdNum);
    const isDraggingLayout = allLayoutIds.includes(activeIdNum);

    if (isDraggingRow) {
      // Rows: allow dropping on other rows and tile-level blocks (same level)
      const filteredContainers = args.droppableContainers.filter(
        (container: any) => {
          const containerId = container.id;
          // Allow dropping on rows or tile-level blocks (numeric IDs that are not layouts)
          return (
            typeof containerId === "number" &&
            !allLayoutIds.includes(containerId) &&
            containerId !== activeIdNum
          );
        }
      );

      return closestCorners({
        ...args,
        droppableContainers: filteredContainers,
      });
    } else if (isDraggingLayout) {
      // Column layouts: allow dropping on row-level blocks and other layouts (same level - row level)
      const filteredContainers = args.droppableContainers.filter(
        (container: any) => {
          const containerId = container.id;
          const containerData = container.data?.current;
          // Allow dropping on blocks or other column layouts at row level
          return (
            (containerData?.type === "block" && containerId !== activeIdNum) ||
            (containerData?.type === "columnLayout" && containerId !== activeIdNum) ||
            (typeof containerId === "number" &&
             !allRowIds.includes(containerId) &&
             containerId !== activeIdNum)
          );
        }
      );

      return closestCenter({
        ...args,
        droppableContainers: filteredContainers,
      });
    } else {
      // Blocks: allow dropping on blocks at same level, columns, and rows (to move into row)
      // Get the level of the active block
      const activeData = args.active.data?.current;
      const activeLevel = activeData?.level;

      const blockContainers = args.droppableContainers.filter(
        (container: any) => {
          const containerId = container.id;
          const containerData = container.data?.current;

          // Check if container is a row (rows are at tile level)
          const isRow = allRowIds.includes(containerId as number);

          // Check if it's a block by looking at the data type or if it's a numeric ID (sortable blocks)
          const isBlock = (containerData?.type === "block") ||
            (typeof containerId === "number" && !isRow && !allLayoutIds.includes(containerId as number));

          // Special case: Tile-level blocks can drop on rows AND other tile-level blocks
          // This makes them sort vertically at tile level
          if (activeLevel === "tile") {
            // Allow dropping on rows OR tile-level blocks
            return isRow || (isBlock && containerData?.level === "tile");
          }

          // Level-based filtering for non-tile-level blocks:
          // - Row-level blocks can only drop on other row-level blocks
          // - Column-level blocks can only drop on other column-level blocks
          if (isBlock && activeLevel && containerData?.level) {
            // Blocks can only swap with blocks at the same level
            return containerData.level === activeLevel;
          }

          return isBlock;
        }
      );

      // First check if we're colliding with any blocks (for swapping/reordering)
      const blockCollisions = closestCenter({
        ...args,
        droppableContainers: blockContainers,
      });

      if (blockCollisions.length > 0) {
        return blockCollisions;
      }

      // Tile-level blocks can ONLY sort with other tile-level items (rows/blocks)
      // They CANNOT move into rows or columns
      if (activeLevel === "tile") {
        return []; // No other valid drop targets for tile-level blocks
      }

      // For row-level and column-level blocks, allow moving into rows and between columns
      const rowDropZoneContainers = args.droppableContainers.filter(
        (container: any) => {
          const containerData = container.data?.current;
          // Only row-dropzones (for moving into row)
          return containerData?.type === "row-dropzone";
        }
      );

      const columnContainers = args.droppableContainers.filter(
        (container: any) => {
          const containerId = container.id;
          const containerData = container.data?.current;
          // Check if it's a column by looking at data type or string prefix
          return (
            containerData?.type === "column" ||
            (typeof containerId === "string" &&
              containerId.toString().startsWith(SELECTORS.COLUMN_PREFIX))
          );
        }
      );

      // Then check for row-dropzone collisions (for moving block into row)
      const rowDropZoneCollisions = closestCorners({
        ...args,
        droppableContainers: rowDropZoneContainers,
      });

      if (rowDropZoneCollisions.length > 0) {
        return rowDropZoneCollisions;
      }

      // Finally, check for column collisions (for moving to different column)
      return closestCenter({
        ...args,
        droppableContainers: columnContainers,
      });
    }
  };
}
