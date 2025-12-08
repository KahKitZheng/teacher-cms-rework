import { ChangeEvent, useState } from "react";
import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import "./TileInfoHeadingTemplate.module.scss";

export type TileInfoHeadingTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockHeading;
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column"; // Hierarchy level for collision detection
  onEditElement?: () => void;
  onDeleteElement?: () => void;
  isPreview?: boolean;
};

export default function TileInfoHeadingTemplate(
  props: Readonly<TileInfoHeadingTemplateProps>
) {
  const {
    tileInfo,
    activeBlockId,
    activeId,
    hoveredBlockId,
    isDragOverlay,
    level,
    onEditElement,
    onDeleteElement,
    isPreview,
  } = props;

  const [heading, setHeading] = useState(tileInfo.name);

  function handleHeadingChange(event: ChangeEvent<HTMLInputElement>) {
    setHeading(event.target.value);
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
        styleName="heading-input"
        type="text"
        placeholder="Enter heading..."
        value={heading}
        onChange={handleHeadingChange}
      />
    </TileInfoBaseTemplate>
  );
}
