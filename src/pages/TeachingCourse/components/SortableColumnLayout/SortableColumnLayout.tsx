import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getBlockDragStyles,
  getBlockContentOpacity,
  getPointerEvents,
} from "../../utils/dragDropStyles";
import { DRAG_STYLES } from "../../utils/dragDropConstants";
import DragHandle from "../DragHandle/DragHandle";
import InfoBlockActions from "../InfoBlockActions/InfoBlockActions";
import "./SortableColumnLayout.module.scss";

type SortableColumnLayoutProps = {
  columnLayout: TileInfoColumnLayout;
  children: React.ReactNode;
  activeLayoutId?: number | null;
  activeId?: number | null;
  hoveredLayoutId?: number | null;
  isDragOverlay?: boolean;
  onAddElement?: () => void;
  onDeleteElement?: () => void;
};

/**
 * Sortable wrapper for column layouts
 * Allows 2-column layouts to be dragged and reordered within a row
 */
export default function SortableColumnLayout(
  props: Readonly<SortableColumnLayoutProps>
) {
  const {
    columnLayout,
    children,
    activeLayoutId,
    activeId,
    hoveredLayoutId,
    isDragOverlay = false,
    onAddElement,
    onDeleteElement,
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnLayout.id,
    data: {
      type: "columnLayout",
      layoutId: columnLayout.id,
    },
    disabled: isDragOverlay,
  });

  const isHovered = hoveredLayoutId === columnLayout.id;

  const style = {
    transform: isDragOverlay ? undefined : CSS.Transform.toString(transform),
    transition: isDragOverlay ? undefined : transition,
    pointerEvents: getPointerEvents(isDragging, activeLayoutId, isDragOverlay),
    ...getBlockDragStyles(activeLayoutId, columnLayout.id, isHovered),
    ...(isDragOverlay && {
      border: "1px solid var(--primary-color)",
      borderRadius: "8px",
    }),
  };

  const contentStyle = {
    opacity: isDragOverlay
      ? 1
      : getBlockContentOpacity(
          isDragging,
          activeLayoutId,
          columnLayout.id,
          isHovered,
          activeId
        ),
    transition: `opacity ${DRAG_STYLES.TRANSITION}`,
    display: "flex",
    gap: "16px",
    width: "100%",
  };

  return (
    <div
      id={columnLayout.id.toString()}
      styleName="sortable-column-layout"
      ref={setNodeRef}
      style={style}
      {...(isDragOverlay ? {} : attributes)}
    >
      {/* Actions */}
      <div
        style={{
          position: "absolute",
          transform: "translateY(calc(-32px - 50%))",
          zIndex: 10,
        }}
      >
        <DragHandle
          listeners={listeners}
          isHovered={isHovered}
          isDragOverlay={isDragOverlay}
        />
      </div>
      <div
        styleName="actions"
        style={{
          position: "absolute",
          transform: "translateY(calc(-32px - 50%))",
          right: "16px",
          zIndex: 10,
        }}
      >
        <InfoBlockActions
          isDragOverlay={isDragOverlay}
          handleAdd={onAddElement}
          handleDelete={onDeleteElement}
        />
      </div>

      {/* Content */}
      <div style={contentStyle}>{children}</div>
    </div>
  );
}
