import TileInfoRow from "../../components/TileInfoRow/TileInfoRow";
import TileInfoBlock from "../../components/TileInfoBlocks/TileInfoBlock/TileInfoBlock";
import TileInfoOverlay from "../../components/TileInfoBlocks/TileInfoOverlay/TileInfoOverlay";
import DroppableColumn from "../../components/DroppableColumn/DroppableColumn";
import Button from "src/components/Button/Button";
import { tilesData } from "../../mock-data/tileInfo";
import { CircleQuestionMark, Plus } from "lucide-react";
import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useHoverDetection } from "../../hooks/useHoverDetection";
import { createCustomCollisionDetection } from "../../utils/collisionDetection";
import {
  handleDragStart as handleDragStartUtil,
  handleRowDragEnd,
  handleBlockDragEnd,
} from "../../utils/dragHandlers";
import { getAllRows, getAllBlocks } from "../../utils/dragDropHelpers";
import { DRAG_STYLES } from "../../utils/dragDropConstants";

export default function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [overlayWidth, setOverlayWidth] = useState<number | null>(null);

  // Use custom hook for hover detection
  const { hoveredColumnId, hoveredBlockId } = useHoverDetection(
    activeBlockId,
    tileInfo
  );

  // Setup sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: DRAG_STYLES.ACTIVATION_DISTANCE,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection based on drag type
  const customCollisionDetection = createCustomCollisionDetection(tileInfo);

  function handleDragStart(event: any) {
    const result = handleDragStartUtil(event, tileInfo);
    setActiveId(result.activeId);
    setActiveBlockId(result.activeBlockId);
    // setOverlayWidth(result.overlayWidth);
  }

  function resetDragState() {
    setActiveId(null);
    setActiveBlockId(null);
    // setOverlayWidth(null);
  }

  function handleDragEnd(event: any) {
    // Handle row dragging
    if (activeId) {
      const updatedTiles = handleRowDragEnd(event, tileInfo);
      if (updatedTiles) {
        setTileInfo(updatedTiles);
      }
    }
    // Handle block dragging
    else if (activeBlockId) {
      const updatedTiles = handleBlockDragEnd(
        event,
        tileInfo,
        hoveredBlockId,
        hoveredColumnId
      );
      if (updatedTiles) {
        setTileInfo(updatedTiles);
      }
    }

    resetDragState();
  }

  function handleDragCancel() {
    resetDragState();
  }

  // Get active items for overlay
  const activeRow = activeId
    ? getAllRows(tileInfo).find((row) => row.id === activeId)
    : null;
  const activeBlock = activeBlockId
    ? getAllBlocks(tileInfo).find((block) => block.id === activeBlockId)
    : null;

  return (
    <>
      {tileInfo.length <= 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            flex: 1,
            gap: "16px",
          }}
        >
          <CircleQuestionMark size={48} />
          <p>No info blocks found!</p>
          <Button>
            <span>Element</span>
            <Plus size={14} />
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          modifiers={
            activeId ? [restrictToVerticalAxis, restrictToParentElement] : []
          }
        >
          {/* Rows sortable context */}
          <SortableContext
            items={tileInfo.flatMap((tile) => tile.data.map((row) => row.id))}
            strategy={verticalListSortingStrategy}
          >
            {tileInfo.map((tile) => (
              <div key={tile.id} style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  {tile.data.map((tileInfoRow) => (
                    <TileInfoRow
                      key={tileInfoRow.id}
                      tileInfoRow={tileInfoRow}
                      activeId={activeId}
                      activeBlockId={activeBlockId}
                    >
                      {tileInfoRow.columns.map((column) => (
                        <DroppableColumn
                          key={column.id}
                          column={column}
                          rowId={tileInfoRow.id}
                          activeBlockId={activeBlockId}
                          hoveredColumnId={hoveredColumnId}
                        >
                          {column.blocks.map((block) => (
                            <TileInfoBlock
                              key={block.id}
                              block={block}
                              variant="template"
                              activeBlockId={activeBlockId}
                              hoveredBlockId={hoveredBlockId}
                            />
                          ))}
                        </DroppableColumn>
                      ))}
                    </TileInfoRow>
                  ))}
                </div>
              </div>
            ))}
          </SortableContext>
          <Button style={{ width: "fit-content", margin: "0 auto" }}>
            <span>Element</span>
            <Plus size={14} />
          </Button>
          <DragOverlay>
            <TileInfoOverlay
              activeRow={activeRow}
              activeBlock={activeBlock}
              activeId={activeId}
              activeBlockId={activeBlockId}
            />
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}
