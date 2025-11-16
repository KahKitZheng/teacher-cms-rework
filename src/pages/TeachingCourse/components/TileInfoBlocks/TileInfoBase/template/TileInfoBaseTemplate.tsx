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
  const { children, actions, blockId, activeBlockId, hoveredBlockId } = props;

  const [title, setTitle] = useState(props.title);

  // Make block draggable
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
  });

  // Make block droppable (for swapping)
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `block-${blockId}`,
    data: {
      type: "block",
      blockId: blockId,
    },
  });

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  // Use cursor-based hover detection instead of dnd-kit's collision detection
  const isHovered = hoveredBlockId === blockId;

  const style = {
    transform: CSS.Translate.toString(transform),
    pointerEvents: getPointerEvents(isDragging, activeBlockId, false),
    transition: `outline ${DRAG_STYLES.TRANSITION}, background-color ${DRAG_STYLES.TRANSITION}`,
    width: "100%",
    minWidth: 0,
    ...getBlockDragStyles(activeBlockId, blockId, isHovered),
  };

  const contentStyle = {
    opacity: getBlockContentOpacity(isDragging, activeBlockId, blockId, isHovered),
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
      {...attributes}
    >
      {/* Actions */}
      <div
        style={{
          position: "absolute",
          transform: "translateY(calc(-24px - 50%))",
        }}
      >
        <DragHandle listeners={listeners} isHovered={isHovered} />
      </div>
      <div
        styleName="actions"
        style={{
          position: "absolute",
          transform: "translateY(calc(-24px - 50%))",
          right: "16px",
        }}
      >
        <InfoBlockActions />
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
