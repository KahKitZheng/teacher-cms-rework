import { ChangeEvent, useState } from "react";
import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import "./TileInfoTextTemplate.module.scss";

export type TileInfoTextTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockText;
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column"; // Hierarchy level for collision detection
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
  isPreview?: boolean;
};

export default function TileInfoTextTemplate(
  props: Readonly<TileInfoTextTemplateProps>
) {
  const {
    tileInfo,
    activeBlockId,
    activeId,
    hoveredBlockId,
    isDragOverlay,
    level,
    onAddElement,
    onEditElement,
    onDeleteElement,
    isPreview,
  } = props;
  const textData = tileInfo;

  const [text, setText] = useState(textData.data);

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }

  return (
    <TileInfoBaseTemplate
      title={tileInfo.name}
      blockId={tileInfo.id}
      activeBlockId={activeBlockId}
      activeId={activeId}
      hoveredBlockId={hoveredBlockId}
      isDragOverlay={isDragOverlay}
      level={level}
      isPreview={isPreview}
      actions={{
        update: onEditElement,
        delete: onDeleteElement,
      }}
    >
      <input
        type="text"
        placeholder="Description"
        value={text}
        onChange={handleTextChange}
      />
    </TileInfoBaseTemplate>
  );
}
