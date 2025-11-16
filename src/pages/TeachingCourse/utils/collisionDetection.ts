import { closestCenter, closestCorners, type CollisionDetection } from "@dnd-kit/core";
import { getAllRowIds } from "./dragDropHelpers";
import { SELECTORS } from "./dragDropConstants";

/**
 * Custom collision detection that filters droppable containers based on drag type
 * - Rows can only drop on other rows
 * - Blocks can drop on other blocks (for swapping) or columns (for moving)
 */
export function createCustomCollisionDetection(
  tileInfo: Tile[]
): CollisionDetection {
  return (args) => {
    const allRowIds = getAllRowIds(tileInfo);

    // Convert active.id to number for comparison
    const activeIdNum =
      typeof args.active.id === "number"
        ? args.active.id
        : Number(args.active.id);

    // Determine what type of item is being dragged
    const isDraggingRow = allRowIds.includes(activeIdNum);

    if (isDraggingRow) {
      // Rows: only allow dropping on other rows
      const filteredContainers = args.droppableContainers.filter(
        (container: any) => {
          const containerId = container.id;
          return (
            typeof containerId === "number" && allRowIds.includes(containerId)
          );
        }
      );

      return closestCorners({
        ...args,
        droppableContainers: filteredContainers,
      });
    } else {
      // Blocks: allow dropping on both blocks and columns, but prefer blocks
      const blockContainers = args.droppableContainers.filter(
        (container: any) => {
          const containerId = container.id;
          return (
            typeof containerId === "string" &&
            containerId.toString().startsWith(SELECTORS.BLOCK_PREFIX)
          );
        }
      );

      const columnContainers = args.droppableContainers.filter(
        (container: any) => {
          const containerId = container.id;
          return (
            typeof containerId === "string" &&
            containerId.toString().startsWith(SELECTORS.COLUMN_PREFIX)
          );
        }
      );

      // First check if we're colliding with any blocks (for swapping)
      const blockCollisions = closestCenter({
        ...args,
        droppableContainers: blockContainers,
      });

      if (blockCollisions.length > 0) {
        return blockCollisions;
      }

      // Otherwise, check for column collisions (for appending)
      return closestCenter({
        ...args,
        droppableContainers: columnContainers,
      });
    }
  };
}
