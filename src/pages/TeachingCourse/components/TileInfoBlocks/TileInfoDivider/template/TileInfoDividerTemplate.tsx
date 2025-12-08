import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import "./TileInfoDividerTemplate.module.scss";

export type TileInfoDividerTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockDivider;
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column"; // Hierarchy level for collision detection
  onEditElement?: () => void;
  onDeleteElement?: () => void;
  isPreview?: boolean;
};

export default function TileInfoDividerTemplate(
  props: Readonly<TileInfoDividerTemplateProps>
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

  return (
    <TileInfoBaseTemplate
      title="Divider"
      blockId={tileInfo.id}
      activeBlockId={activeBlockId}
      activeId={activeId}
      hoveredBlockId={hoveredBlockId}
      isDragOverlay={isDragOverlay}
      level={level}
      isPreview={isPreview}
      hasLabel={false}
      actions={{
        update: onEditElement,
        delete: onDeleteElement,
      }}
    >
      <div styleName="divider-line"></div>
    </TileInfoBaseTemplate>
  );
}
