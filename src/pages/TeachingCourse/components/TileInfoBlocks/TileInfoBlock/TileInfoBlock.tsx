import TileInfoText from "../../TileInfoBlocks/TileInfoText";
import TileInfoDropdown from "../../TileInfoBlocks/TileInfoDropdown/TileInfoDropdown";

type TileInfoBlockProps = {
  block: TileInfoBlock;
  variant: "template" | "edit" | "read";
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "row" | "column"; // Hierarchy level for collision detection
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
};

export default function TileInfoBlock(props: Readonly<TileInfoBlockProps>) {
  const {
    block,
    variant,
    activeBlockId,
    activeId,
    hoveredBlockId,
    isDragOverlay,
    level,
    onAddElement,
    onEditElement,
    onDeleteElement,
  } = props;

  switch (block.type) {
    case "text":
      return (
        <TileInfoText
          key={block.id}
          variant={variant}
          tileInfo={block}
          activeBlockId={activeBlockId}
          activeId={activeId}
          hoveredBlockId={hoveredBlockId}
          isDragOverlay={isDragOverlay}
          level={level}
          // onAddElement={onAddElement}
          onEditElement={onEditElement}
          onDeleteElement={onDeleteElement}
        />
      );
    case "dropdown":
      return (
        <TileInfoDropdown
          key={block.id}
          variant={variant}
          tileInfo={block}
          activeBlockId={activeBlockId}
          activeId={activeId}
          hoveredBlockId={hoveredBlockId}
          isDragOverlay={isDragOverlay}
          level={level}
          // onAddElement={onAddElement}
          onEditElement={onEditElement}
          onDeleteElement={onDeleteElement}
        />
      );
    default:
      return null;
  }
}
