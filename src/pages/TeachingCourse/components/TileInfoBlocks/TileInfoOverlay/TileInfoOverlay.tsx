import TileInfoRow from "../../TileInfoRow/TileInfoRow";
import TileInfoBlock from "../TileInfoBlock/TileInfoBlock";
import SortableColumnLayout from "../../SortableColumnLayout/SortableColumnLayout";
import { DRAG_STYLES } from "../../../utils/dragDropConstants";

type TileInfoOverlayProps = {
  activeRow?: TileInfoRow | null;
  activeBlock?: TileInfoBlock | null;
  activeLayout?: TileInfoColumnLayout | null;
  activeId: number | null;
  activeBlockId: number | null;
  activeLayoutId: number | null;
};

/**
 * Type guard to check if an item is a TileInfoColumnLayout
 */
function isTileInfoColumnLayout(
  item: TileInfoBlock | TileInfoColumnLayout
): item is TileInfoColumnLayout {
  return (item as TileInfoColumnLayout).type === "columnLayout";
}

/**
 * Content for the drag overlay
 * Shows a preview of the item being dragged
 */
export default function TileInfoOverlay(props: Readonly<TileInfoOverlayProps>) {
  const { activeRow, activeBlock, activeLayout, activeId, activeBlockId, activeLayoutId } = props;

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
          {[
            ...activeRow.blocks.map((block) => ({ ...block, _itemType: 'block' as const })),
            ...activeRow.layouts.map((layout) => ({ ...layout, _itemType: 'layout' as const })),
          ]
            .sort((a, b) => a.order - b.order)
            .map((item) =>
              item._itemType === 'layout' ? (
                // Render column layout
                <div key={item.id} style={{ display: "flex", gap: "16px", width: "100%" }}>
                  {/* Left column */}
                  <div
                    style={{
                      flex: "1",
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {item.leftColumn.map((block: TileInfoBlock) => (
                      <TileInfoBlock
                        key={block.id}
                        block={block}
                        variant="template"
                        isDragOverlay={true}
                      />
                    ))}
                  </div>
                  {/* Right column */}
                  <div
                    style={{
                      flex: "1",
                      display: "flex",
                      flexDirection: "column",
                      gap: "24px",
                    }}
                  >
                    {item.rightColumn.map((block: TileInfoBlock) => (
                      <TileInfoBlock
                        key={block.id}
                        block={block}
                        variant="template"
                        isDragOverlay={true}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // Render direct block
                <TileInfoBlock
                  key={item.id}
                  block={item}
                  variant="template"
                  isDragOverlay={true}
                />
              )
            )}
        </TileInfoRow>
      </div>
    );
  }

  if (activeLayout) {
    return (
      <div
        style={{
          opacity: 1,
          cursor: "grabbing",
          width: "100%",
          pointerEvents: "none",
        }}
      >
        <SortableColumnLayout
          columnLayout={activeLayout}
          activeLayoutId={activeLayoutId}
          isDragOverlay={true}
        >
          {/* Left column */}
          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              minHeight: "100px",
              borderRadius: "8px",
            }}
          >
            {activeLayout.leftColumn.map((block) => (
              <TileInfoBlock
                key={block.id}
                block={block}
                variant="template"
                isDragOverlay={true}
              />
            ))}
          </div>
          {/* Right column */}
          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              minHeight: "100px",
              borderRadius: "8px",
            }}
          >
            {activeLayout.rightColumn.map((block) => (
              <TileInfoBlock
                key={block.id}
                block={block}
                variant="template"
                isDragOverlay={true}
              />
            ))}
          </div>
        </SortableColumnLayout>
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
