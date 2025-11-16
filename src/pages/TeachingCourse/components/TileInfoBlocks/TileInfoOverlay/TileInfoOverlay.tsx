import TileInfoRow from "../../TileInfoRow/TileInfoRow";
import TileInfoBlock from "../TileInfoBlock/TileInfoBlock";
import { DRAG_STYLES } from "../../../utils/dragDropConstants";

type TileInfoOverlayProps = {
  activeRow?: TileInfoRow | null;
  activeBlock?: TileInfoBlock | null;
  activeId: number | null;
  activeBlockId: number | null;
};

/**
 * Content for the drag overlay
 * Shows a preview of the item being dragged
 */
export default function TileInfoOverlay(props: Readonly<TileInfoOverlayProps>) {
  const { activeRow, activeBlock, activeId, activeBlockId } = props;

  if (activeRow) {
    return (
      <div
        style={{
          width: "100%",
          opacity: 1,
          cursor: "grabbing",
        }}
      >
        <TileInfoRow
          tileInfoRow={activeRow}
          isDragOverlay={true}
          activeId={activeId}
          activeBlockId={activeBlockId}
        >
          {activeRow.columns.map((column) => (
            <div
              key={column.id}
              style={{
                flex: "1",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
              }}
            >
              {column.blocks.map((block) => (
                <TileInfoBlock
                  key={block.id}
                  block={block}
                  variant="template"
                  isDragOverlay={true}
                />
              ))}
            </div>
          ))}
        </TileInfoRow>
      </div>
    );
  }

  if (activeBlock) {
    return (
      <div
        style={{
          opacity: 1,
          cursor: "grabbing",
          minWidth: `${DRAG_STYLES.MIN_OVERLAY_WIDTH}px`,
          pointerEvents: "none",
        }}
      >
        <TileInfoBlock block={activeBlock} variant="template" isDragOverlay={true} />
      </div>
    );
  }

  return null;
}
