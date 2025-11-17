import TileInfoText from "../../TileInfoBlocks/TileInfoText";
import TileInfoDropdown from "../../TileInfoBlocks/TileInfoDropdown/TileInfoDropdown";

type TileInfoBlockProps = {
  block: TileInfoBlock;
  variant: "template" | "edit" | "read";
  activeBlockId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
};

export default function TileInfoBlock(props: Readonly<TileInfoBlockProps>) {
  const {
    block,
    variant,
    activeBlockId,
    hoveredBlockId,
    isDragOverlay,
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
          hoveredBlockId={hoveredBlockId}
          isDragOverlay={isDragOverlay}
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
          hoveredBlockId={hoveredBlockId}
          isDragOverlay={isDragOverlay}
          // onAddElement={onAddElement}
          onEditElement={onEditElement}
          onDeleteElement={onDeleteElement}
        />
      );
    default:
      return null;
  }
}
