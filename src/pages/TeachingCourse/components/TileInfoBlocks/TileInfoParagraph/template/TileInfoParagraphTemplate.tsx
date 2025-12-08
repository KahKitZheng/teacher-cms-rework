import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import TipTapEditor from "../../../shared/TipTapEditor";
import "./TileInfoParagraphTemplate.module.scss";

export type TileInfoParagraphTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockParagraph;
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column";
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
  isPreview?: boolean;
};

export default function TileInfoParagraphTemplate(
  props: Readonly<TileInfoParagraphTemplateProps>
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

  return (
    <TileInfoBaseTemplate
      title={tileInfo.data?.name || "Paragraph"}
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
      <div styleName="editor-section">
        <TipTapEditor
          content={tileInfo.data?.content || ""}
          editable={!isPreview}
          placeholder="Enter paragraph content..."
        />
      </div>
    </TileInfoBaseTemplate>
  );
}
