import { useState } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import DragHandle from "../DragHandle/DragHandle";
import InfoBlockActions from "../InfoBlockActions/InfoBlockActions";
import "./TileInfoRow.module.scss";
import IconPicker from "src/components/IconPicker/IconPicker";
import { ICONS } from "src/constants/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getRowOpacity,
  getPointerEvents,
  getDragOverlayStyles,
} from "../../utils/dragDropStyles";

type TileInfoRowProps = {
  tileInfoRow: TileInfoRow;
  children: React.ReactNode;
  activeId?: number | null;
  activeBlockId?: number | null;
  isDragOverlay?: boolean;
};

export default function TileInfoRow(props: Readonly<TileInfoRowProps>) {
  const { tileInfoRow, children, activeId, activeBlockId, isDragOverlay = false } = props;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [title, setTitle] = useState(tileInfoRow.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tileInfoRow.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: getRowOpacity(isDragging, activeId, tileInfoRow.id),
    pointerEvents: getPointerEvents(isDragging, activeBlockId, isDragOverlay),
    ...getDragOverlayStyles(isDragOverlay),
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
          options={{ theme: "channel", borderStyle: "dashed" }}
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
          options={{ theme: "channel", borderStyle: "dashed" }}
          isDragOverlay={isDragOverlay}
        />
      </div>

      {/* Content */}
      <div styleName="header">
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
      <div style={{ display: "flex", gap: "16px" }}>
        {isCollapsed ? null : children}
      </div>
    </div>
  );
}
