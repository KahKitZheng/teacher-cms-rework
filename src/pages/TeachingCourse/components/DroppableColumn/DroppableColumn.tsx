import { useDroppable } from "@dnd-kit/core";
import { getColumnDropZoneStyles } from "../../utils/dragDropStyles";
import { DRAG_TYPE } from "../../utils/dragDropConstants";

type DroppableColumnProps = {
  layoutId: number;
  rowId: number;
  side: "left" | "right";
  activeBlockId: number | null;
  hoveredColumnId: string | null;
  children: React.ReactNode;
};

/**
 * Droppable column component for drag and drop
 * Provides visual feedback when blocks are dragged over it
 * New column ID format: column-{rowId}-{layoutId}-{side}
 */
export default function DroppableColumn(props: Readonly<DroppableColumnProps>) {
  const { layoutId, rowId, side, activeBlockId, hoveredColumnId, children } = props;

  const columnId = `column-${rowId}-${layoutId}-${side}`;

  const { setNodeRef } = useDroppable({
    id: columnId,
    data: {
      type: DRAG_TYPE.COLUMN,
      layoutId: layoutId,
      rowId: rowId,
      side: side,
    },
  });

  const isHovered = hoveredColumnId === columnId;
  const style = getColumnDropZoneStyles(activeBlockId, isHovered);

  return (
    <div id={columnId} ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}
