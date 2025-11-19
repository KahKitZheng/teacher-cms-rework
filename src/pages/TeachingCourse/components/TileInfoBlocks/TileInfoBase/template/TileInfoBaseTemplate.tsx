import "./TileInfoBaseTemplate.module.scss";
import { useState } from "react";
import DragHandle from "../../../DragHandle/DragHandle";
import InfoBlockActions from "../../../InfoBlockActions/InfoBlockActions";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getBlockContentOpacity,
  getPointerEvents,
  getBlockDragStyles,
} from "../../../../utils/dragDropStyles";
import { DRAG_STYLES } from "../../../../utils/dragDropConstants";

type TileInfoBaseTemplateProps = {
  children: React.ReactNode;
  title: string;
  blockId: number;
  activeBlockId?: number | null;
  activeId?: number | null; // For row drags
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "row" | "column"; // Hierarchy level for collision detection
  actions?: {
    add?: () => void;
    update?: () => void;
    delete?: () => void;
  };
};

export default function TileInfoBaseTemplate(
  props: Readonly<TileInfoBaseTemplateProps>
) {
  const {
    children,
    actions,
    blockId,
    activeBlockId,
    activeId,
    hoveredBlockId,
    isDragOverlay = false,
    level = "tile",
  } = props;

  const [title, setTitle] = useState(props.title);

  // Make block sortable (skip if drag overlay)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: blockId,
    data: {
      type: "block",
      blockId: blockId,
      level: level, // Add level for collision detection
    },
    disabled: isDragOverlay,
  });

  // Use cursor-based hover detection instead of dnd-kit's collision detection
  const isHovered = hoveredBlockId === blockId;

  const style = {
    transform: isDragOverlay ? undefined : CSS.Transform.toString(transform),
    transition: isDragOverlay ? undefined : transition,
    pointerEvents: getPointerEvents(isDragging, activeBlockId, isDragOverlay),
    width: "100%",
    minWidth: 0,
    ...getBlockDragStyles(activeBlockId, blockId, isHovered),
    ...(isDragOverlay && {
      border: "1px solid var(--primary-color)",
      borderRadius: "8px",
    }),
  };

  const contentStyle = {
    opacity: isDragOverlay
      ? 1
      : getBlockContentOpacity(isDragging, activeBlockId, blockId, isHovered, activeId),
    transition: `opacity ${DRAG_STYLES.TRANSITION}`,
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    minWidth: 0,
    width: "100%",
  };

  return (
    <div
      id={blockId.toString()}
      styleName="tile-info-base"
      ref={setNodeRef}
      style={style}
      {...(isDragOverlay ? {} : attributes)}
    >
      {/* Actions - show with overlay styling if isDragOverlay */}
      <div
        style={{
          position: "absolute",
          transform: "translateY(calc(-24px - 50%))",
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
          transform: "translateY(calc(-24px - 50%))",
          right: "16px",
        }}
      >
        <InfoBlockActions
          isDragOverlay={isDragOverlay}
          // handleAdd={actions?.add}
          handleEdit={actions?.update}
          handleDelete={actions?.delete}
        />
      </div>

      {/* Content */}
      <div style={contentStyle}>
        <div styleName="header">
          <input
            type="text"
            value={title}
            placeholder="Title"
            styleName="title-input"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        {children}
      </div>
    </div>
  );
}
