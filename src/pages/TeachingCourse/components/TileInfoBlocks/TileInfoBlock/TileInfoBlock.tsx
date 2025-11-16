import TileInfoText from "../../TileInfoBlocks/TileInfoText";
import TileInfoDropdown from "../../TileInfoBlocks/TileInfoDropdown/TileInfoDropdown";

type TileInfoBlockProps = {
  block: TileInfoBlock;
  variant: "template" | "edit" | "read";
  activeBlockId?: number | null;
  hoveredBlockId?: number | null;
};

export default function TileInfoBlock(props: Readonly<TileInfoBlockProps>) {
  const { block, variant, activeBlockId, hoveredBlockId } = props;

  switch (block.type) {
    case "text":
      return (
        <TileInfoText
          key={block.id}
          variant={variant}
          tileInfo={block}
          activeBlockId={activeBlockId}
          hoveredBlockId={hoveredBlockId}
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
        />
      );
    default:
      return null;
  }
}
