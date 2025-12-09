import TileInfoBlock from "../../components/TileInfoBlocks/TileInfoBlock/TileInfoBlock";
import TileInfoOverlay from "../../components/TileInfoBlocks/TileInfoOverlay/TileInfoOverlay";
import RecursiveAccordionRenderer from "../../components/RecursiveRowRenderer/RecursiveRowRenderer";
import Button from "src/components/Button/Button";
import { tilesData } from "../../mock-data/tileInfo";
import { CircleQuestionMark, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import ElementPickerModal from "../../components/ElementPickerModal/ElementPickerModal";
import { computeBlockLevels, type BlockLevel } from "../../utils/levelHelpers";
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
import { createBlock } from "../../utils/blockFactory";
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
import {
  isContentBlock,
  isContainer,
  BlockType,
  ContentBlockType,
  getTileLevelBlockTypes,
  getNestableBlockTypes,
  getColumnBlockTypes,
  getContentBlockTypes,
  getContainerBlockTypes,
} from "../../utils/blockRegistry";

export default function TeachingCourseTemplate() {
  const [tileInfo, setTileInfo] = useState(tilesData);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalAllowedTypes, setModalAllowedTypes] = useState<BlockType[]>(
    getTileLevelBlockTypes() // Dynamic: defaults to all tile-level blocks
  );
  const [targetRowId, setTargetRowId] = useState<number | null>(null);
  const [targetLayoutId, setTargetLayoutId] = useState<number | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [initialSelection, setInitialSelection] = useState<
    | {
        type: BlockType;
        options?: { columns?: number };
      }
    | undefined
  >(undefined);

  // Compute block levels from tree structure (local state for template mode)
  const [blockLevels, setBlockLevels] = useState<Map<number, BlockLevel>>(() =>
    computeBlockLevels(tilesData)
  );

  // Recompute levels whenever tileInfo changes
  useEffect(() => {
    setBlockLevels(computeBlockLevels(tileInfo));
  }, [tileInfo]);

  // Use custom hook for hover detection
  const { hoveredColumnId, hoveredBlockId } = useHoverDetection(
    activeBlockId,
    tileInfo,
    blockLevels
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
  const customCollisionDetection = createCustomCollisionDetection(
    tileInfo,
    blockLevels
  );

  function handleDragStart(event: any) {
    const result = handleDragStartUtil(event, tileInfo);
    setActiveId(result.activeId);
    setActiveBlockId(result.activeBlockId);
    setActiveLayoutId(result.activeLayoutId);
  }

  // Check if the active block is a tile-level block (not inside an accordion)
  const isTileLevelBlock = activeBlockId
    ? tileInfo[0].children.some(
        (child) => !isContainer(child) && child.id === activeBlockId
      )
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
    allowedTypes: BlockType[] = getTileLevelBlockTypes(), // Dynamic default
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
        if (block && isContentBlock(block)) {
          // All content blocks can be edited
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
    setTargetLayoutId(null);
    setEditingBlockId(null);
    setInitialSelection(undefined);
  }

  function handleDeleteRow(rowId: number) {
    setTileInfo((prev) => {
      const updatedTiles = [...prev];

      // Recursively remove row from children
      function removeRow(children: TileInfoBlock[]): any[] {
        return children
          .filter((child) => {
            if (child.type === "accordion" && child.id === rowId) {
              return false; // Remove this row
            }
            if (child.type === "accordion") {
              // Recursively search nested rows
              return true;
            }
            return true;
          })
          .map((child) => {
            if (child.type === "accordion") {
              return {
                ...child,
                children: removeRow(child.children),
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
      function removeBlock(children: TileInfoBlock[]): any[] {
        return children
          .filter((child) => {
            // Remove if this is a content block with matching ID
            if (isContentBlock(child) && child.id === blockId) {
              return false;
            }
            return true;
          })
          .map((child) => {
            if (child.type === "accordion") {
              return {
                ...child,
                children: removeBlock(child.children),
              };
            }
            if (child.type === "columnLayout") {
              return {
                ...child,
                children: child.children.map((column) => ({
                  ...column,
                  children: column.children.filter(
                    (block) => block.id !== blockId
                  ),
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
      function removeLayout(children: TileInfoBlock[]): any[] {
        return children
          .filter((child) => {
            if (child.type === "columnLayout" && child.id === layoutId) {
              return false; // Remove this layout
            }
            return true;
          })
          .map((child) => {
            if (child.type === "accordion") {
              return {
                ...child,
                children: removeLayout(child.children),
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

  // Handle row selection (add or edit)
  function handleRowSelect() {
    // Add new accordion
    const newAccordionId = +randomId();

    setTileInfo((prev) => {
      const updatedTiles = [...prev];
      const tile = updatedTiles[0];

      if (targetRowId !== null) {
        // Adding nested accordion inside an existing accordion
        function findAndAddNestedAccordion(
          children: TileInfoBlock[],
          targetId: number
        ): boolean {
          for (const child of children) {
            if (child.type === "accordion" && child.id === targetId) {
              const newAccordion = createBlock(
                newAccordionId,
                "accordion",
                child.children.length, // Order within parent
                { parentId: targetId }
              );
              child.children.push(newAccordion);
              return true;
            }
            if (child.type === "accordion") {
              if (findAndAddNestedAccordion(child.children, targetId)) {
                return true;
              }
            }
          }
          return false;
        }

        findAndAddNestedAccordion(tile.children, targetRowId);
      } else {
        // Adding top-level accordion
        const newAccordion = createBlock(
          newAccordionId,
          "accordion",
          tile.children.length // Total count of tile-level items
        );
        tile.children.push(newAccordion);
      }

      return updatedTiles;
    });
    handleCloseModal();
  }

  // Handle block selection (add or edit)
  function handleBlockSelect(type: ContentBlockType) {
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

        // Type guard: ensure oldBlock has a data property with name
        if (
          !("data" in oldBlock) ||
          !oldBlock.data ||
          typeof oldBlock.data !== "object" ||
          !("name" in oldBlock.data)
        ) {
          return updatedTiles;
        }

        // Create updated block with same properties but different type
        const updatedBlock = createBlock(oldBlock.id, type, oldBlock.order, {
          name: oldBlock.data.name as string,
          parentId: oldBlock.parentId,
        });

        // Update block in the correct location
        if (location.rowIdx === -1) {
          // Tile-level block
          tile.children[location.blockIdx] = updatedBlock;
        } else {
          const row = tile.children[location.rowIdx] as TileInfoBlockAccordion;
          if (location.layoutIdx === -1) {
            // Row-level block
            row.children[location.blockIdx] = updatedBlock;
          } else {
            // Column-level block
            const layout = row.children[
              location.layoutIdx
            ] as TileInfoColumnLayout;
            const column = layout.children.find(
              (col) => col.order === location.colIdx
            );
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
        function findAndAddToRow(
          children: TileInfoBlock[],
          targetId: number
        ): boolean {
          for (const child of children) {
            if (child.type === "accordion" && child.id === targetId) {
              const newBlock = createBlock(
                newBlockId,
                type,
                child.children.length, // Order within row
                {
                  name: "",
                  parentId: targetId,
                }
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

        if (targetLayoutId !== null) {
          // Add to column layout - find column with fewest blocks
          function findAndAddToLayout(children: TileInfoBlock[]): boolean {
            for (const child of children) {
              if (
                child.type === "columnLayout" &&
                child.id === targetLayoutId
              ) {
                // Find column with fewest blocks
                const columnWithFewestBlocks = child.children.reduce(
                  (min, col) => {
                    return col.children.length < min.children.length
                      ? col
                      : min;
                  },
                  child.children[0]
                );

                const newBlock = createBlock(
                  newBlockId,
                  type,
                  columnWithFewestBlocks.children.length, // Order within column
                  {
                    name: "",
                    parentId: columnWithFewestBlocks.id, // Parent is the column
                  }
                );
                columnWithFewestBlocks.children.push(newBlock);
                return true;
              }
              if (child.type === "accordion") {
                if (findAndAddToLayout(child.children)) {
                  return true;
                }
              }
            }
            return false;
          }

          findAndAddToLayout(tile.children);
        } else if (targetRowId !== null) {
          // Add to specific row's children array
          findAndAddToRow(tile.children, targetRowId);
        } else {
          // Add as direct block to tile children
          const newBlock = createBlock(
            newBlockId,
            type,
            tile.children.length, // Order within tile
            { name: "" }
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
    type: BlockType,
    options?: { columns?: number; variant?: string }
  ) {
    if (type === "accordion") {
      handleRowSelect();
    } else if (type === "columnLayout") {
      handleColumnLayoutSelect(options?.columns || 2);
    } else if (isContentBlock({ type } as TileInfoBlock)) {
      // Dynamically handle all content blocks
      handleBlockSelect(type as ContentBlockType);
    }
  }

  // Handle column layout selection (N-column layout inside a row)
  function handleColumnLayoutSelect(numColumns: number = 2) {
    if (targetRowId === null) return;

    const newLayoutId = +randomId();

    setTileInfo((prev) => {
      const updatedTiles = [...prev];

      // Recursively find target row
      function findAndAddLayout(children: TileInfoBlock[]): boolean {
        for (const child of children) {
          if (child.type === "accordion" && child.id === targetRowId) {
            const newColumnLayout = createBlock(
              newLayoutId,
              "columnLayout",
              child.children.length,
              {
                parentId: targetRowId,
                numColumns,
                generateColumnId: () => +randomId(),
              }
            );

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

  // Handle adding blocks to column layout
  function handleAddBlockToColumnLayout(layoutId: number) {
    setTargetLayoutId(layoutId);
    setTargetRowId(null); // Clear row ID since we're targeting a layout
    handleOpenModal("add", getColumnBlockTypes(), null, null); // Dynamic: all blocks that can be in columns
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
            activeId || isTileLevelBlock
              ? [restrictToVerticalAxis, restrictToParentElement]
              : []
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
                      isContainer(item) && item.type === "accordion" ? (
                        <RecursiveAccordionRenderer
                          key={item.id}
                          accordion={item}
                          activeId={activeId}
                          activeBlockId={activeBlockId}
                          activeLayoutId={activeLayoutId}
                          hoveredBlockId={hoveredBlockId}
                          hoveredColumnId={hoveredColumnId}
                          onAddElement={(accordionId) =>
                            handleOpenModal(
                              "add",
                              [...getNestableBlockTypes(), "columnLayout"], // Dynamic: all nestable blocks + columnLayout
                              accordionId
                            )
                          }
                          onAddBlockToLayout={handleAddBlockToColumnLayout}
                          onEditAccordion={
                            (accordionId) =>
                              handleOpenModal(
                                "edit",
                                getContainerBlockTypes(),
                                accordionId
                              ) // Dynamic: all container blocks
                          }
                          onDeleteAccordion={handleDeleteRow}
                          onEditBlock={(blockId) =>
                            handleOpenModal(
                              "edit",
                              getContentBlockTypes(), // Dynamic: all content blocks
                              null,
                              blockId
                            )
                          }
                          onDeleteBlock={handleDeleteBlock}
                          onDeleteColumnLayout={handleDeleteColumnLayout}
                        />
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
                              getContentBlockTypes(), // Dynamic: all content blocks
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
