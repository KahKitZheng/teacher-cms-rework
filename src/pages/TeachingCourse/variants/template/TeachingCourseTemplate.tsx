import TileInfoRow from "../../components/TileInfoRow/TileInfoRow";
import TileInfoBlock from "../../components/TileInfoBlocks/TileInfoBlock/TileInfoBlock";
import TileInfoOverlay from "../../components/TileInfoBlocks/TileInfoOverlay/TileInfoOverlay";
import DroppableColumn from "../../components/DroppableColumn/DroppableColumn";
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
} from "../../utils/dragHandlers";
import { getAllRows, getAllBlocks } from "../../utils/dragDropHelpers";
import { DRAG_STYLES } from "../../utils/dragDropConstants";

export default function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalAllowedTypes, setModalAllowedTypes] = useState<
    ("row" | "text" | "dropdown")[]
  >(["row", "text", "dropdown"]);
  const [targetRowId, setTargetRowId] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [initialSelection, setInitialSelection] = useState<{
    type: "row" | "text" | "dropdown";
    options?: { columns?: 1 | 2 };
  } | undefined>(undefined);

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
  }

  function resetDragState() {
    setActiveId(null);
    setActiveBlockId(null);
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

  function handleOpenModal(
    mode: "add" | "edit",
    allowedTypes: ("row" | "text" | "dropdown")[] = ["row", "text", "dropdown"],
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
        // Editing a row - find its column count
        const row = getAllRows(tileInfo).find((r) => r.id === rowId);
        if (row) {
          setInitialSelection({
            type: "row",
            options: { columns: row.columns.length as 1 | 2 },
          });
        }
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
      updatedTiles[0].data = updatedTiles[0].data.filter((row) => row.id !== rowId);
      return updatedTiles;
    });
  }

  function handleDeleteBlock(blockId: number) {
    setTileInfo((prev) => {
      const updatedTiles = [...prev];
      for (const row of updatedTiles[0].data) {
        for (const column of row.columns) {
          column.blocks = column.blocks.filter((block) => block.id !== blockId);
        }
      }
      return updatedTiles;
    });
  }

  // Helper function to create a new block based on type
  function createBlock(
    blockId: number,
    type: "text" | "dropdown",
    name: string = ""
  ): TileInfoBlock {
    if (type === "text") {
      return {
        id: blockId,
        type: "text",
        name,
        data: "",
        placeholder: { template: "Enter text..." },
      };
    }
    return {
      id: blockId,
      type: "dropdown",
      name,
      placeholder: { template: "Select option(s)" },
      options: [],
    };
  }

  // Helper function to update row columns
  function updateRowColumns(
    row: TileInfoRow,
    targetColumns: number
  ): void {
    const currentColumns = row.columns.length;

    if (currentColumns === targetColumns) return;

    if (targetColumns > currentColumns) {
      // Add new columns
      for (let i = currentColumns; i < targetColumns; i++) {
        row.columns.push({
          id: row.id * 100 + i + 1,
          order: i,
          blocks: [],
        });
      }
    } else {
      // Remove columns and preserve blocks by moving them to first column
      const blocksToPreserve = row.columns
        .slice(targetColumns)
        .flatMap((col) => col.blocks);
      row.columns[0].blocks.push(...blocksToPreserve);
      row.columns = row.columns.slice(0, targetColumns);
    }
  }

  // Handle row selection (add or edit)
  function handleRowSelect(numColumns: number) {
    if (modalMode === "edit" && targetRowId !== null) {
      // Edit existing row
      setTileInfo((prev) => {
        const updatedTiles = [...prev];
        const row = updatedTiles[0].data.find((r) => r.id === targetRowId);
        if (row) {
          updateRowColumns(row, numColumns);
        }
        return updatedTiles;
      });
    } else {
      // Add new row
      const newRowId = Math.max(...getAllRows(tileInfo).map((r) => r.id)) + 1;
      const newRow: TileInfoRow = {
        id: newRowId,
        order: tileInfo[0].data.length,
        icon: "eye",
        name: "",
        columns: Array.from({ length: numColumns }, (_, i) => ({
          id: newRowId * 100 + i + 1,
          order: i,
          blocks: [],
        })),
      };

      setTileInfo((prev) => [
        { ...prev[0], data: [...prev[0].data, newRow] },
      ]);
    }
  }

  // Handle block selection (add or edit)
  function handleBlockSelect(type: "text" | "dropdown") {
    if (modalMode === "edit" && editingBlockId !== null) {
      // Edit existing block - change its type
      setTileInfo((prev) => {
        const updatedTiles = [...prev];
        for (const row of updatedTiles[0].data) {
          for (const column of row.columns) {
            const blockIndex = column.blocks.findIndex(
              (b) => b.id === editingBlockId
            );
            if (blockIndex !== -1) {
              const oldBlock = column.blocks[blockIndex];
              column.blocks[blockIndex] = createBlock(
                oldBlock.id,
                type,
                oldBlock.name
              );
              return updatedTiles;
            }
          }
        }
        return updatedTiles;
      });
    } else {
      // Add new block
      const newBlockId =
        Math.max(...getAllBlocks(tileInfo).map((b) => b.id), 0) + 1;
      const newBlock = createBlock(newBlockId, type);

      setTileInfo((prev) => {
        const updatedTiles = [...prev];

        if (updatedTiles[0].data.length === 0) {
          // No rows exist - create first row with the new block
          const newRowId = 1;
          updatedTiles[0].data.push({
            id: newRowId,
            order: 0,
            icon: "eye",
            name: "",
            columns: [
              { id: newRowId * 100 + 1, order: 0, blocks: [newBlock] },
            ],
          });
        } else {
          // Add to target row or last row
          const targetRow =
            targetRowId !== null
              ? updatedTiles[0].data.find((row) => row.id === targetRowId)
              : updatedTiles[0].data[updatedTiles[0].data.length - 1];

          if (targetRow) {
            targetRow.columns[0].blocks.push(newBlock);
          }
        }

        return updatedTiles;
      });
    }
  }

  // Main handler for element selection
  function handleElementSelect(
    type: "row" | "text" | "dropdown",
    options?: { columns?: 1 | 2 }
  ) {
    if (type === "row") {
      handleRowSelect(options?.columns || 1);
    } else {
      handleBlockSelect(type);
    }
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
                      onAddElement={() =>
                        handleOpenModal("add", ["text", "dropdown"], tileInfoRow.id)
                      }
                      onEditElement={() =>
                        handleOpenModal("edit", ["row"], tileInfoRow.id)
                      }
                      onDeleteElement={() => handleDeleteRow(tileInfoRow.id)}
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
                              // onAddElement={() => handleOpenModal("add", ["text", "dropdown"])}
                              onEditElement={() =>
                                handleOpenModal("edit", ["text", "dropdown"], null, block.id)
                              }
                              onDeleteElement={() => handleDeleteBlock(block.id)}
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
              activeId={activeId}
              activeBlockId={activeBlockId}
            />
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}
