import TileInfoRow from "../../components/TileInfoRow/TileInfoRow";
import TileInfoBlock from "../../components/TileInfoBlocks/TileInfoBlock/TileInfoBlock";
import TileInfoOverlay from "../../components/TileInfoBlocks/TileInfoOverlay/TileInfoOverlay";
import DroppableColumn from "../../components/DroppableColumn/DroppableColumn";
import SortableColumnLayout from "../../components/SortableColumnLayout/SortableColumnLayout";
import RecursiveAccordionRenderer from "../../components/RecursiveRowRenderer/RecursiveRowRenderer";
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
    ("accordion" | "text" | "dropdown" | "columnLayout")[]
  >(["accordion", "text", "dropdown"]);
  const [targetRowId, setTargetRowId] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [initialSelection, setInitialSelection] = useState<
    | {
        type: "accordion" | "text" | "dropdown" | "columnLayout";
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
    ? tileInfo[0].children.some(child => child.type !== "accordion" && child.id === activeBlockId)
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
    allowedTypes: ("accordion" | "text" | "dropdown" | "columnLayout")[] = [
      "accordion",
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
        // Editing an accordion - accordions are now just containers
        setInitialSelection({
          type: "accordion",
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

      // Recursively remove row from children
      function removeRow(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]): any[] {
        return children.filter(child => {
          if (child.type === "accordion" && child.id === rowId) {
            return false; // Remove this row
          }
          if (child.type === "accordion") {
            // Recursively search nested rows
            return true;
          }
          return true;
        }).map(child => {
          if (child.type === "accordion") {
            return {
              ...child,
              children: removeRow(child.children)
            };
          }
          return child;
        });
      }

      updatedTiles[0] = {
        ...updatedTiles[0],
        children: removeRow(updatedTiles[0].children),
      };
      return updatedTiles;
    });
  }

  function handleDeleteBlock(blockId: number) {
    setTileInfo((prev) => {
      const updatedTiles = [...prev];

      // Recursively remove block from all children and column layouts
      function removeBlock(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]): any[] {
        return children.filter(child => {
          // Remove if this is the block
          if (child.type !== "accordion" && child.type !== "columnLayout" && child.id === blockId) {
            return false;
          }
          return true;
        }).map(child => {
          if (child.type === "accordion") {
            return {
              ...child,
              children: removeBlock(child.children)
            };
          }
          if (child.type === "columnLayout") {
            return {
              ...child,
              children: child.children.map(column => ({
                ...column,
                children: column.children.filter(block => block.id !== blockId),
              })),
            };
          }
          return child;
        });
      }

      updatedTiles[0] = {
        ...updatedTiles[0],
        children: removeBlock(updatedTiles[0].children),
      };

      return updatedTiles;
    });
  }

  function handleDeleteColumnLayout(layoutId: number) {
    setTileInfo((prev) => {
      const updatedTiles = [...prev];

      // Recursively remove layout from row children
      function removeLayout(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]): any[] {
        return children.filter(child => {
          if (child.type === "columnLayout" && child.id === layoutId) {
            return false; // Remove this layout
          }
          return true;
        }).map(child => {
          if (child.type === "accordion") {
            return {
              ...child,
              children: removeLayout(child.children)
            };
          }
          return child;
        });
      }

      updatedTiles[0] = {
        ...updatedTiles[0],
        children: removeLayout(updatedTiles[0].children),
      };

      return updatedTiles;
    });
  }

  // Helper function to create a new block based on type
  function createBlock(
    blockId: number,
    type: "text" | "dropdown",
    level: number,
    order: number,
    name: string = "",
    parentId?: number
  ): TileInfoBlock {
    const baseFields = {
      id: blockId,
      level,
      order,
      parentId,
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
    // Add new accordion (edit mode not supported for accordions anymore)
    const newAccordionId = +randomId();
    const newAccordion: TileInfoBlockAccordion = {
      type: "accordion",
      level: 0, // Tile level = 0
      id: newAccordionId,
      order: tileInfo[0].children.length, // Total count of tile-level items
      icon: "eye",
      name: "",
      children: [], // Start with empty children
    };

    setTileInfo((prev) => [{
      ...prev[0],
      children: [...prev[0].children, newAccordion]
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

        // Type guard: ensure oldBlock has a name property
        if (!('name' in oldBlock)) {
          return updatedTiles;
        }

        // Create updated block with same properties but different type
        const updatedBlock = createBlock(
          oldBlock.id,
          type,
          oldBlock.level,
          oldBlock.order,
          oldBlock.name,
          oldBlock.parentId
        );

        // Update block in the correct location
        if (location.rowIdx === -1) {
          // Tile-level block
          tile.children[location.blockIdx] = updatedBlock;
        } else {
          const row = tile.children[location.rowIdx] as TileInfoRow;
          if (location.layoutIdx === -1) {
            // Row-level block
            row.children[location.blockIdx] = updatedBlock;
          } else {
            // Column-level block
            const layout = row.children[location.layoutIdx] as TileInfoColumnLayout;
            const column = layout.children.find(col => col.order === location.colIdx);
            if (column && column.type === "column") {
              column.children[location.blockIdx] = updatedBlock;
            }
          }
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

        // Recursively find and add to target row
        function findAndAddToRow(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[], targetId: number): boolean {
          for (const child of children) {
            if (child.type === "accordion" && child.id === targetId) {
              const newBlock = createBlock(
                newBlockId,
                type,
                child.level, // Same level as parent row
                child.children.length, // Order within row
                "",
                targetId
              );
              child.children.push(newBlock);
              return true;
            }
            if (child.type === "accordion") {
              if (findAndAddToRow(child.children, targetId)) {
                return true;
              }
            }
          }
          return false;
        }

        if (targetRowId !== null) {
          // Add to specific row's children array
          findAndAddToRow(tile.children, targetRowId);
        } else {
          // Add as direct block to tile children
          const newBlock = createBlock(
            newBlockId,
            type,
            0, // Tile level = 0
            tile.children.length, // Order within tile
            ""
          );
          tile.children.push(newBlock);
        }

        return updatedTiles;
      });
      handleCloseModal();
    }
  }

  // Main handler for element selection
  function handleElementSelect(
    type: "accordion" | "text" | "dropdown" | "columnLayout"
  ) {
    if (type === "accordion") {
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

      // Recursively find target row
      function findAndAddLayout(children: (TileInfoBlock | TileInfoRow | TileInfoColumnLayout)[]): boolean {
        for (const child of children) {
          if (child.type === "accordion" && child.id === targetRowId) {
            const leftColumnId = +randomId();
            const rightColumnId = +randomId();

            const newColumnLayout: TileInfoColumnLayout = {
              type: "columnLayout",
              level: child.level,
              id: newLayoutId,
              order: child.children.length,
              parentId: targetRowId,
              children: [
                {
                  type: "column",
                  level: child.level,
                  id: leftColumnId,
                  order: 0,
                  parentId: newLayoutId,
                  width: "1fr",
                  children: [],
                },
                {
                  type: "column",
                  level: child.level,
                  id: rightColumnId,
                  order: 1,
                  parentId: newLayoutId,
                  width: "1fr",
                  children: [],
                },
              ],
            };

            child.children.push(newColumnLayout);
            return true;
          }
          if (child.type === "accordion") {
            if (findAndAddLayout(child.children)) {
              return true;
            }
          }
        }
        return false;
      }

      findAndAddLayout(updatedTiles[0].children);

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
            items={tileInfo.flatMap((tile) =>
              tile.children.map((child) => child.id)
            )}
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
                  {/* Sort children by order */}
                  {tile.children
                    .sort((a, b) => a.order - b.order)
                    .map((item) =>
                      item.type === 'accordion' ? (
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
                          handleOpenModal("edit", ["accordion"], item.id)
                        }
                        onDeleteElement={() => handleDeleteRow(item.id)}
                      >
                        <SortableContext
                          items={item.children.map((child) => child.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {/* Sort row children by order */}
                          {item.children
                            .sort((a, b) => a.order - b.order)
                            .map((rowItem) =>
                              rowItem.type === 'columnLayout' ? (
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
                                  {rowItem.children
                                    .sort((a, b) => a.order - b.order)
                                    .map((column) => (
                                      <DroppableColumn
                                        key={column.id}
                                        layoutId={rowItem.id}
                                        rowId={item.id}
                                        side={column.order === 0 ? "left" : "right"}
                                        activeBlockId={activeBlockId}
                                        hoveredColumnId={hoveredColumnId}
                                      >
                                        <SortableContext
                                          items={column.children.map((b) => b.id)}
                                          strategy={verticalListSortingStrategy}
                                        >
                                          {column.children.map((block) => (
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
                                    ))}
                                </SortableColumnLayout>
                              ) : rowItem.type === 'accordion' ? (
                                // Render nested row (recursive)
                                <TileInfoRow
                                  key={rowItem.id}
                                  tileInfoRow={rowItem}
                                  activeId={activeId}
                                  activeBlockId={activeBlockId}
                                  onAddElement={() =>
                                    handleOpenModal(
                                      "add",
                                      ["text", "dropdown", "columnLayout"],
                                      rowItem.id
                                    )
                                  }
                                  onEditElement={() =>
                                    handleOpenModal("edit", ["accordion"], rowItem.id)
                                  }
                                  onDeleteElement={() => handleDeleteRow(rowItem.id)}
                                >
                                  <SortableContext
                                    items={rowItem.children.map((child) => child.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {/* Recursively render nested row children */}
                                    {rowItem.children
                                      .sort((a, b) => a.order - b.order)
                                      .map((nestedItem) =>
                                        nestedItem.type === 'columnLayout' ? (
                                          // Render column layout in nested row
                                          <SortableColumnLayout
                                            key={nestedItem.id}
                                            columnLayout={nestedItem}
                                            activeLayoutId={activeLayoutId}
                                            activeId={activeId}
                                            hoveredLayoutId={null}
                                            onDeleteElement={() =>
                                              handleDeleteColumnLayout(nestedItem.id)
                                            }
                                          >
                                            {nestedItem.children
                                              .sort((a, b) => a.order - b.order)
                                              .map((column) => (
                                                <DroppableColumn
                                                  key={column.id}
                                                  layoutId={nestedItem.id}
                                                  rowId={rowItem.id}
                                                  side={column.order === 0 ? "left" : "right"}
                                                  activeBlockId={activeBlockId}
                                                  hoveredColumnId={hoveredColumnId}
                                                >
                                                  <SortableContext
                                                    items={column.children.map((b) => b.id)}
                                                    strategy={verticalListSortingStrategy}
                                                  >
                                                    {column.children.map((block) => (
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
                                              ))}
                                          </SortableColumnLayout>
                                        ) : nestedItem.type !== 'accordion' ? (
                                          // Render block in nested row
                                          <TileInfoBlock
                                            key={nestedItem.id}
                                            block={nestedItem}
                                            variant="template"
                                            activeBlockId={activeBlockId}
                                            activeId={activeId}
                                            hoveredBlockId={hoveredBlockId}
                                            level="accordion"
                                            onEditElement={() =>
                                              handleOpenModal(
                                                "edit",
                                                ["text", "dropdown"],
                                                null,
                                                nestedItem.id
                                              )
                                            }
                                            onDeleteElement={() =>
                                              handleDeleteBlock(nestedItem.id)
                                            }
                                          />
                                        ) : null
                                      )}
                                  </SortableContext>
                                </TileInfoRow>
                              ) : (
                                // Render direct block in row
                                <TileInfoBlock
                                  key={rowItem.id}
                                  block={rowItem}
                                  variant="template"
                                  activeBlockId={activeBlockId}
                                  activeId={activeId}
                                  hoveredBlockId={hoveredBlockId}
                                  level="accordion"
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
