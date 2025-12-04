import { useState } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import DragHandle from "../DragHandle/DragHandle";
import InfoBlockActions from "../InfoBlockActions/InfoBlockActions";
import "./TileInfoAccordion.module.scss";
import IconPicker from "src/components/IconPicker/IconPicker";
import { ICONS } from "src/constants/icons";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  getRowOpacity,
  getPointerEvents,
  getRowDropZoneStyles,
} from "../../utils/dragDropStyles";
import { DRAG_STYLES } from "../../utils/dragDropConstants";

type TileInfoAccordionProps = {
  tileInfoRow: TileInfoBlockAccordion;
  children: React.ReactNode;
  activeId?: number | null;
  activeBlockId?: number | null;
  isDragOverlay?: boolean;
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
};

export default function TileInfoAccordion(props: Readonly<TileInfoAccordionProps>) {
  const {
    tileInfoRow,
    children,
    activeId,
    activeBlockId,
    isDragOverlay = false,
    onAddElement,
    onEditElement,
    onDeleteElement,
  } = props;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [title, setTitle] = useState(tileInfoRow.name);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tileInfoRow.id });

  // Make row droppable for blocks to move into
  // Use a special ID to distinguish from sortable row ID
  const dropZoneId = `row-dropzone-${tileInfoRow.id}`;
  const {
    setNodeRef: setDroppableNodeRef,
    isOver: isBlockOver,
  } = useDroppable({
    id: dropZoneId,
    disabled: isDragOverlay || !activeBlockId,
    data: {
      type: "row-dropzone",
      rowId: tileInfoRow.id,
    },
  });

  // Set sortable ref on main container
  const setNodeRef = setSortableNodeRef;

  // Show visual feedback when a block is dragged over
  const showDropFeedback = activeBlockId && isBlockOver;

  const style = {
    transform: isDragOverlay ? undefined : CSS.Transform.toString(transform),
    transition: isDragOverlay ? undefined : transition,
    pointerEvents: getPointerEvents(isDragging, activeBlockId, isDragOverlay),
    ...(isDragOverlay && {
      border: "1px solid var(--primary-color)",
      borderRadius: "8px",
    }),
  };

  const contentStyle = {
    opacity: isDragOverlay ? 1 : getRowOpacity(isDragging, activeId, tileInfoRow.id, activeBlockId),
    transition: `opacity ${DRAG_STYLES.TRANSITION}`,
  };

  return (
    <div
      id={tileInfoRow.id.toString()}
      styleName="tileSectionBuilder"
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      {/* Actions */}
      <div
        style={{
          position: "absolute",
          transform: "translateY(calc(-16px - 50%))",
        }}
      >
        <DragHandle
          listeners={listeners}
          isDragOverlay={isDragOverlay}
        />
      </div>
      <div
        styleName="actions"
        style={{
          position: "absolute",
          transform: "translateY(calc(-16px - 50%))",
          right: "16px",
        }}
      >
        <InfoBlockActions
          isDragOverlay={isDragOverlay}
          handleAdd={onAddElement}
          handleEdit={onEditElement}
          handleDelete={onDeleteElement}
        />
      </div>

      {/* Content */}
      <div styleName="header" style={contentStyle}>
        <div styleName="iconAndName">
          <IconPicker icon={{ label: "Eye", value: "eye" }} icons={ICONS} />
          <input
            type="text"
            styleName="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
        </div>
        <DynamicIcon
          size={16}
          name={isCollapsed ? "chevron-down" : "chevron-up"}
          onClick={() => setIsCollapsed(!isCollapsed)}
          cursor="pointer"
        />
      </div>
      <div
        ref={setDroppableNodeRef}
        style={{
          ...getRowDropZoneStyles(activeBlockId, isBlockOver),
          ...contentStyle,
        }}
      >
        {isCollapsed ? null : children}
      </div>
    </div>
  );
}
