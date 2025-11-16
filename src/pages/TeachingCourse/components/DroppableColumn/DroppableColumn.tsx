import { useDroppable } from "@dnd-kit/core";
import { getColumnDropZoneStyles } from "../../utils/dragDropStyles";
import { DRAG_TYPE } from "../../utils/dragDropConstants";

type DroppableColumnProps = {
  column: { id: number };
  rowId: number;
  activeBlockId: number | null;
  hoveredColumnId: string | null;
  children: React.ReactNode;
};

/**
 * Droppable column component for drag and drop
 * Provides visual feedback when blocks are dragged over it
 */
export default function DroppableColumn(props: Readonly<DroppableColumnProps>) {
  const { column, rowId, activeBlockId, hoveredColumnId, children } = props;

  const columnId = `column-${rowId}-${column.id}`;

  const { setNodeRef } = useDroppable({
    id: columnId,
    data: {
      type: DRAG_TYPE.COLUMN,
      columnId: column.id,
      rowId: rowId,
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
