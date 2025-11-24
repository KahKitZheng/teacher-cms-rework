import { useDroppable } from "@dnd-kit/core";
import { getColumnDropZoneStyles } from "../../utils/dragDropStyles";
import { DRAG_TYPE } from "../../utils/dragDropConstants";

type DroppableColumnProps = {
  layoutId: number;
  rowId: number;
  columnOrder: number;
  activeBlockId: number | null;
  hoveredColumnId: string | null;
  children: React.ReactNode;
};

/**
 * Droppable column component for drag and drop
 * Provides visual feedback when blocks are dragged over it
 * New column ID format: column-{rowId}-{layoutId}-{columnOrder}
 */
export default function DroppableColumn(props: Readonly<DroppableColumnProps>) {
  const { layoutId, rowId, columnOrder, activeBlockId, hoveredColumnId, children } = props;

  const columnId = `column-${rowId}-${layoutId}-${columnOrder}`;

  const { setNodeRef } = useDroppable({
    id: columnId,
    data: {
      type: DRAG_TYPE.COLUMN,
      layoutId: layoutId,
      rowId: rowId,
      columnOrder: columnOrder,
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
