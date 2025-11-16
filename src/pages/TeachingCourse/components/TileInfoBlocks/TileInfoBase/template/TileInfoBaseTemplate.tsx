import "./TileInfoBaseTemplate.module.scss";
import { useState } from "react";
import DragHandle from "../../../DragHandle/DragHandle";
import InfoBlockActions from "../../../InfoBlockActions/InfoBlockActions";
import { useDraggable, useDroppable } from "@dnd-kit/core";
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
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  actions?: {
    update: {
      enabled: boolean;
      callback: () => void;
    };
    delete: {
      enabled: boolean;
      callback: () => void;
    };
  };
};

export default function TileInfoBaseTemplate(
  props: Readonly<TileInfoBaseTemplateProps>
) {
  const { children, actions, blockId, activeBlockId, hoveredBlockId, isDragOverlay = false } = props;

  const [title, setTitle] = useState(props.title);

  // Make block draggable (skip if drag overlay)
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: blockId,
    data: {
      type: "block",
      blockId: blockId,
    },
    disabled: isDragOverlay,
  });

  // Make block droppable (for swapping, skip if drag overlay)
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `block-${blockId}`,
    data: {
      type: "block",
      blockId: blockId,
    },
    disabled: isDragOverlay,
  });

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    if (!isDragOverlay) {
      setDraggableRef(node);
      setDroppableRef(node);
    }
  };

  // Use cursor-based hover detection instead of dnd-kit's collision detection
  const isHovered = hoveredBlockId === blockId;

  const style = {
    transform: isDragOverlay ? undefined : CSS.Translate.toString(transform),
    pointerEvents: getPointerEvents(isDragging, activeBlockId, isDragOverlay),
    transition: `outline ${DRAG_STYLES.TRANSITION}, background-color ${DRAG_STYLES.TRANSITION}`,
    width: "100%",
    minWidth: 0,
    ...getBlockDragStyles(activeBlockId, blockId, isHovered),
    ...(isDragOverlay && {
      border: "1px solid var(--primary-color)",
      borderRadius: "8px",
    }),
  };

  const contentStyle = {
    opacity: isDragOverlay ? 1 : getBlockContentOpacity(isDragging, activeBlockId, blockId, isHovered),
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
        <InfoBlockActions isDragOverlay={isDragOverlay} />
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
