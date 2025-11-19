import TileInfoRow from "../../components/TileInfoRow/TileInfoRow";
import TileInfoBlock from "../../components/TileInfoBlocks/TileInfoBlock/TileInfoBlock";
import TileInfoOverlay from "../../components/TileInfoBlocks/TileInfoOverlay/TileInfoOverlay";
import DroppableColumn from "../../components/DroppableColumn/DroppableColumn";
import SortableColumnLayout from "../../components/SortableColumnLayout/SortableColumnLayout";
import Button from "src/components/Button/Button";
import { tilesData } from "../../mock-data/tileInfo";
import { CircleQuestionMark, Plus } from "lucide-react";
import { useState } from "react";
import ElementPickerModal from "../../components/ElementPickerModal/ElementPickerModal";
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
  handleLayoutDragEnd,
} from "../../utils/dragHandlers";
import {
  getAllRows,
  getAllBlocks,
  getAllColumnLayouts,
  findBlockById,
} from "../../utils/dragDropHelpers";
import { DRAG_STYLES } from "../../utils/dragDropConstants";
import { randomId } from "../../utils/randomId";

export default function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalAllowedTypes, setModalAllowedTypes] = useState<
    ("row" | "text" | "dropdown" | "columnLayout")[]
  >(["row", "text", "dropdown"]);
  const [targetRowId, setTargetRowId] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [initialSelection, setInitialSelection] = useState<
    | {
        type: "row" | "text" | "dropdown" | "columnLayout";
        options?: { columns?: 1 | 2 };
      }
    | undefined
  >(undefined);

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
    setActiveLayoutId(result.activeLayoutId);
  }

  // Check if the active block is a tile-level block
  const isTileLevelBlock = activeBlockId
    ? tileInfo[0].blocks.some(block => block.id === activeBlockId)
    : false;

  function resetDragState() {
    setActiveId(null);
    setActiveBlockId(null);
    setActiveLayoutId(null);
  }

  function handleDragEnd(event: any) {
    // Handle row dragging
    if (activeId) {
      const updatedTiles = handleRowDragEnd(event, tileInfo);
      if (updatedTiles) {
        setTileInfo(updatedTiles);
      }
    }
    // Handle column layout dragging
    else if (activeLayoutId) {
      const updatedTiles = handleLayoutDragEnd(event, tileInfo);
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

  function handleOpenModal(
    mode: "add" | "edit",
    allowedTypes: ("row" | "text" | "dropdown" | "columnLayout")[] = [
      "row",
      "text",
      "dropdown",
    ],
    rowId: number | null = null,
    blockId: number | null = null
  ) {
    setModalMode(mode);
    setModalAllowedTypes(allowedTypes);
    setTargetRowId(rowId);
    setEditingBlockId(blockId);

    // Set initial selection for edit mode
    if (mode === "edit") {
      if (rowId !== null) {
        // Editing a row - rows are now just containers
        setInitialSelection({
          type: "row",
        });
      } else if (blockId !== null) {
        // Editing a block - find its type
        const block = getAllBlocks(tileInfo).find((b) => b.id === blockId);
        if (block && (block.type === "text" || block.type === "dropdown")) {
          setInitialSelection({ type: block.type });
        }
      }
    } else {
      setInitialSelection(undefined);
    }

    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setTargetRowId(null);
    setEditingBlockId(null);
    setInitialSelection(undefined);
  }

  function handleDeleteRow(rowId: number) {
    setTileInfo((prev) => {
      const updatedTiles = [...prev];
      updatedTiles[0] = {
        ...updatedTiles[0],
        rows: updatedTiles[0].rows.filter((row) => row.id !== rowId),
      };
      return updatedTiles;
    });
  }

  function handleDeleteBlock(blockId: number) {
    setTileInfo((prev) => {
      const updatedTiles = [...prev];

      // Remove from tile-level blocks
      updatedTiles[0] = {
        ...updatedTiles[0],
        blocks: updatedTiles[0].blocks.filter((block) => block.id !== blockId),
        rows: updatedTiles[0].rows.map((row) => ({
          ...row,
          // Remove from row-level blocks
          blocks: row.blocks.filter((block) => block.id !== blockId),
          // Remove from column layouts
          layouts: row.layouts.map((layout) => ({
            ...layout,
            leftColumn: layout.leftColumn.filter((block) => block.id !== blockId),
            rightColumn: layout.rightColumn.filter((block) => block.id !== blockId),
          })),
        })),
      };

      return updatedTiles;
    });
  }

  function handleDeleteColumnLayout(layoutId: number) {
    setTileInfo((prev) => {
      const updatedTiles = [...prev];

      // Remove column layout from rows
      updatedTiles[0] = {
        ...updatedTiles[0],
        rows: updatedTiles[0].rows.map((row) => ({
          ...row,
          layouts: row.layouts.filter((layout) => layout.id !== layoutId),
        })),
      };

      return updatedTiles;
    });
  }

  // Helper function to create a new block based on type
  function createBlock(
    blockId: number,
    type: "text" | "dropdown",
    level: "tile" | "row" | "column",
    order: number,
    name: string = "",
    parentId?: number,
    columnSide?: "left" | "right"
  ): TileInfoBlock {
    const baseFields = {
      id: blockId,
      level,
      order,
      parentId,
      columnSide,
    };

    if (type === "text") {
      return {
        ...baseFields,
        type: "text",
        name,
        data: "",
        placeholder: { template: "Enter text..." },
      } as TileInfoBlockText;
    }
    return {
      ...baseFields,
      type: "dropdown",
      name,
      placeholder: { template: "Select option(s)" },
      options: [],
    } as TileInfoBlockDropdown;
  }

  // Handle row selection (add or edit)
  function handleRowSelect() {
    // Add new row (edit mode not supported for rows anymore)
    const newRowId = +randomId();
    const newRow: TileInfoRow = {
      type: "row",
      level: "tile",
      id: newRowId,
      order: tileInfo[0].blocks.length + tileInfo[0].rows.length, // Total count of tile-level items
      icon: "eye",
      name: "",
      blocks: [], // Start with empty blocks
      layouts: [], // Start with empty layouts
    };

    setTileInfo((prev) => [{
      ...prev[0],
      rows: [...prev[0].rows, newRow]
    }]);
    handleCloseModal();
  }

  // Handle block selection (add or edit)
  function handleBlockSelect(type: "text" | "dropdown") {
    if (modalMode === "edit" && editingBlockId !== null) {
      // Edit existing block - change its type
      setTileInfo((prev) => {
        const updatedTiles = [...prev];
        const blockResult = findBlockById(updatedTiles, editingBlockId);

        if (!blockResult) {
          return updatedTiles;
        }

        const { block: oldBlock, location } = blockResult;
        const tile = updatedTiles[location.tileIdx];

        // Create updated block with same properties but different type
        const updatedBlock = createBlock(
          oldBlock.id,
          type,
          oldBlock.level,
          oldBlock.order,
          oldBlock.name,
          oldBlock.parentId,
          oldBlock.columnSide
        );

        // Update block in the correct array
        if (location.rowIdx === -1) {
          // Tile-level block
          tile.blocks[location.blockIdx] = updatedBlock;
        } else if (location.layoutIdx === -1) {
          // Row-level block
          tile.rows[location.rowIdx].blocks[location.blockIdx] = updatedBlock;
        } else {
          // Column-level block
          const layout = tile.rows[location.rowIdx].layouts[location.layoutIdx];
          const column = location.colIdx === 0 ? layout.leftColumn : layout.rightColumn;
          column[location.blockIdx] = updatedBlock;
        }

        return updatedTiles;
      });
      handleCloseModal();
    } else {
      // Add new block
      const newBlockId = +randomId();

      setTileInfo((prev) => {
        const updatedTiles = [...prev];
        const tile = updatedTiles[0];

        if (targetRowId !== null) {
          // Add to specific row's blocks array
          const targetRow = tile.rows.find((row) => row.id === targetRowId);
          if (targetRow) {
            const newBlock = createBlock(
              newBlockId,
              type,
              "row",
              targetRow.blocks.length + targetRow.layouts.length, // Order within row
              "",
              targetRowId
            );
            targetRow.blocks.push(newBlock);
          }
        } else {
          // Add as direct block to tile.blocks
          const newBlock = createBlock(
            newBlockId,
            type,
            "tile",
            tile.blocks.length + tile.rows.length, // Order within tile
            ""
          );
          tile.blocks.push(newBlock);
        }

        return updatedTiles;
      });
      handleCloseModal();
    }
  }

  // Main handler for element selection
  function handleElementSelect(
    type: "row" | "text" | "dropdown" | "columnLayout"
  ) {
    if (type === "row") {
      handleRowSelect();
    } else if (type === "columnLayout") {
      handleColumnLayoutSelect();
    } else {
      handleBlockSelect(type);
    }
  }

  // Handle column layout selection (2-column layout inside a row)
  function handleColumnLayoutSelect() {
    if (targetRowId === null) return;

    const newLayoutId = +randomId();

    setTileInfo((prev) => {
      const updatedTiles = [...prev];
      const targetRow = updatedTiles[0].rows.find(
        (row) => row.id === targetRowId
      );

      if (targetRow) {
        const newColumnLayout: TileInfoColumnLayout = {
          type: "columnLayout",
          level: "row",
          id: newLayoutId,
          order: targetRow.blocks.length + targetRow.layouts.length,
          parentId: targetRowId,
          leftColumn: [],
          rightColumn: [],
        };

        targetRow.layouts.push(newColumnLayout);
      }

      return updatedTiles;
    });
    handleCloseModal();
  }

  // Get active items for overlay
  const activeRow = activeId
    ? getAllRows(tileInfo).find((row) => row.id === activeId)
    : null;
  const activeBlock = activeBlockId
    ? getAllBlocks(tileInfo).find((block) => block.id === activeBlockId)
    : null;
  const activeLayout = activeLayoutId
    ? getAllColumnLayouts(tileInfo).find(
        (layout) => layout.id === activeLayoutId
      )
    : null;

  return (
    <>
      <ElementPickerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelect={handleElementSelect}
        mode={modalMode}
        allowedTypes={modalAllowedTypes}
        initialSelection={initialSelection}
      />
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
          <Button onClick={() => handleOpenModal("add")}>
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
            activeId || isTileLevelBlock ? [restrictToVerticalAxis, restrictToParentElement] : []
          }
        >
          {/* Tile-level sortable context (blocks and rows) */}
          <SortableContext
            items={tileInfo.flatMap((tile) => [
              ...tile.blocks.map((block) => block.id),
              ...tile.rows.map((row) => row.id),
            ])}
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
                  {/* Combine and sort blocks and rows by order */}
                  {[
                    ...tile.blocks.map((block) => ({ ...block, _itemType: 'block' as const })),
                    ...tile.rows.map((row) => ({ ...row, _itemType: 'row' as const })),
                  ]
                    .sort((a, b) => a.order - b.order)
                    .map((item) =>
                      item._itemType === 'row' ? (
                      <TileInfoRow
                        key={item.id}
                        tileInfoRow={item}
                        activeId={activeId}
                        activeBlockId={activeBlockId}
                        onAddElement={() =>
                          handleOpenModal(
                            "add",
                            ["text", "dropdown", "columnLayout"],
                            item.id
                          )
                        }
                        onEditElement={() =>
                          handleOpenModal("edit", ["row"], item.id)
                        }
                        onDeleteElement={() => handleDeleteRow(item.id)}
                      >
                        <SortableContext
                          items={[
                            ...item.blocks.map((block) => block.id),
                            ...item.layouts.map((layout) => layout.id),
                          ]}
                          strategy={verticalListSortingStrategy}
                        >
                          {/* Combine and sort row blocks and layouts by order */}
                          {[
                            ...item.blocks.map((block) => ({ ...block, _itemType: 'block' as const })),
                            ...item.layouts.map((layout) => ({ ...layout, _itemType: 'layout' as const })),
                          ]
                            .sort((a, b) => a.order - b.order)
                            .map((rowItem) =>
                              rowItem._itemType === 'layout' ? (
                                // Render sortable 2-column layout
                                <SortableColumnLayout
                                  key={rowItem.id}
                                  columnLayout={rowItem}
                                  activeLayoutId={activeLayoutId}
                                  activeId={activeId}
                                  hoveredLayoutId={null}
                                  onDeleteElement={() =>
                                    handleDeleteColumnLayout(rowItem.id)
                                  }
                                >
                                  {/* Left column */}
                                  <DroppableColumn
                                    key={`${rowItem.id}-left`}
                                    layoutId={rowItem.id}
                                    rowId={item.id}
                                    side="left"
                                    activeBlockId={activeBlockId}
                                    hoveredColumnId={hoveredColumnId}
                                  >
                                    <SortableContext
                                      items={rowItem.leftColumn.map((b) => b.id)}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      {rowItem.leftColumn.map((block) => (
                                        <TileInfoBlock
                                          key={block.id}
                                          block={block}
                                          variant="template"
                                          activeBlockId={activeBlockId}
                                          activeId={activeId}
                                          hoveredBlockId={hoveredBlockId}
                                          level="column"
                                          onEditElement={() =>
                                            handleOpenModal(
                                              "edit",
                                              ["text", "dropdown"],
                                              null,
                                              block.id
                                            )
                                          }
                                          onDeleteElement={() =>
                                            handleDeleteBlock(block.id)
                                          }
                                        />
                                      ))}
                                    </SortableContext>
                                  </DroppableColumn>
                                  {/* Right column */}
                                  <DroppableColumn
                                    key={`${rowItem.id}-right`}
                                    layoutId={rowItem.id}
                                    rowId={item.id}
                                    side="right"
                                    activeBlockId={activeBlockId}
                                    hoveredColumnId={hoveredColumnId}
                                  >
                                    <SortableContext
                                      items={rowItem.rightColumn.map((b) => b.id)}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      {rowItem.rightColumn.map((block) => (
                                        <TileInfoBlock
                                          key={block.id}
                                          block={block}
                                          variant="template"
                                          activeBlockId={activeBlockId}
                                          activeId={activeId}
                                          hoveredBlockId={hoveredBlockId}
                                          level="column"
                                          onEditElement={() =>
                                            handleOpenModal(
                                              "edit",
                                              ["text", "dropdown"],
                                              null,
                                              block.id
                                            )
                                          }
                                          onDeleteElement={() =>
                                            handleDeleteBlock(block.id)
                                          }
                                        />
                                      ))}
                                    </SortableContext>
                                  </DroppableColumn>
                                </SortableColumnLayout>
                              ) : (
                                // Render direct block in row
                                <TileInfoBlock
                                  key={rowItem.id}
                                  block={rowItem}
                                  variant="template"
                                  activeBlockId={activeBlockId}
                                  activeId={activeId}
                                  hoveredBlockId={hoveredBlockId}
                                  level="row"
                                  onEditElement={() =>
                                    handleOpenModal(
                                      "edit",
                                      ["text", "dropdown"],
                                      null,
                                      rowItem.id
                                    )
                                  }
                                  onDeleteElement={() =>
                                    handleDeleteBlock(rowItem.id)
                                  }
                                />
                              )
                            )}
                        </SortableContext>
                      </TileInfoRow>
                    ) : (
                      <TileInfoBlock
                        key={item.id}
                        block={item}
                        variant="template"
                        activeBlockId={activeBlockId}
                        activeId={activeId}
                        hoveredBlockId={hoveredBlockId}
                        level="tile"
                        onEditElement={() =>
                          handleOpenModal(
                            "edit",
                            ["text", "dropdown"],
                            null,
                            item.id
                          )
                        }
                        onDeleteElement={() => handleDeleteBlock(item.id)}
                      />
                    )
                  )}
                </div>
              </div>
            ))}
          </SortableContext>
          <Button
            style={{ width: "fit-content", margin: "0 auto" }}
            onClick={() => handleOpenModal("add")}
          >
            <span>Element</span>
            <Plus size={14} />
          </Button>
          <DragOverlay>
            <TileInfoOverlay
              activeRow={activeRow}
              activeBlock={activeBlock}
              activeLayout={activeLayout}
              activeId={activeId}
              activeBlockId={activeBlockId}
              activeLayoutId={activeLayoutId}
            />
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}
