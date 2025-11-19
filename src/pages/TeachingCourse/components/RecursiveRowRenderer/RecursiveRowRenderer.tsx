import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TileInfoRow from "../TileInfoRow/TileInfoRow";
import TileInfoBlock from "../TileInfoBlocks/TileInfoBlock/TileInfoBlock";
import SortableColumnLayout from "../SortableColumnLayout/SortableColumnLayout";
import DroppableColumn from "../DroppableColumn/DroppableColumn";

type RecursiveAccordionRendererProps = {
  accordion: TileInfoBlockAccordion;
  activeId: number | null;
  activeBlockId: number | null;
  activeLayoutId: number | null;
  hoveredBlockId: number | null;
  hoveredColumnId: string | null;
  onAddElement: (accordionId: number) => void;
  onEditAccordion: (accordionId: number) => void;
  onDeleteAccordion: (accordionId: number) => void;
  onEditBlock: (blockId: number) => void;
  onDeleteBlock: (blockId: number) => void;
  onDeleteColumnLayout: (layoutId: number) => void;
};

/**
 * Recursive component that renders an accordion block and all its nested children
 * Supports unlimited nesting depth (5-6+ levels)
 */
export default function RecursiveAccordionRenderer(props: Readonly<RecursiveAccordionRendererProps>) {
  const {
    accordion,
    activeId,
    activeBlockId,
    activeLayoutId,
    hoveredBlockId,
    hoveredColumnId,
    onAddElement,
    onEditAccordion,
    onDeleteAccordion,
    onEditBlock,
    onDeleteBlock,
    onDeleteColumnLayout,
  } = props;

  return (
    <TileInfoRow
      key={accordion.id}
      tileInfoRow={accordion}
      activeId={activeId}
      activeBlockId={activeBlockId}
      onAddElement={() => onAddElement(accordion.id)}
      onEditElement={() => onEditAccordion(accordion.id)}
      onDeleteElement={() => onDeleteAccordion(accordion.id)}
    >
      <SortableContext
        items={accordion.children.map((child) => child.id)}
        strategy={verticalListSortingStrategy}
      >
        {accordion.children
          .sort((a, b) => a.order - b.order)
          .map((child) => {
            // Column Layout
            if (child.type === 'columnLayout') {
              return (
                <SortableColumnLayout
                  key={child.id}
                  columnLayout={child}
                  activeLayoutId={activeLayoutId}
                  activeId={activeId}
                  hoveredLayoutId={null}
                  onDeleteElement={() => onDeleteColumnLayout(child.id)}
                >
                  {child.children
                    .sort((a, b) => a.order - b.order)
                    .map((column) => (
                      <DroppableColumn
                        key={column.id}
                        layoutId={child.id}
                        rowId={accordion.id}
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
                              onEditElement={() => onEditBlock(block.id)}
                              onDeleteElement={() => onDeleteBlock(block.id)}
                            />
                          ))}
                        </SortableContext>
                      </DroppableColumn>
                    ))}
                </SortableColumnLayout>
              );
            }

            // Nested Accordion - RECURSIVE CALL
            if (child.type === 'accordion') {
              return (
                <RecursiveAccordionRenderer
                  key={child.id}
                  accordion={child}
                  activeId={activeId}
                  activeBlockId={activeBlockId}
                  activeLayoutId={activeLayoutId}
                  hoveredBlockId={hoveredBlockId}
                  hoveredColumnId={hoveredColumnId}
                  onAddElement={onAddElement}
                  onEditAccordion={onEditAccordion}
                  onDeleteAccordion={onDeleteAccordion}
                  onEditBlock={onEditBlock}
                  onDeleteBlock={onDeleteBlock}
                  onDeleteColumnLayout={onDeleteColumnLayout}
                />
              );
            }

            // Direct Block
            return (
              <TileInfoBlock
                key={child.id}
                block={child}
                variant="template"
                activeBlockId={activeBlockId}
                activeId={activeId}
                hoveredBlockId={hoveredBlockId}
                level="accordion"
                onEditElement={() => onEditBlock(child.id)}
                onDeleteElement={() => onDeleteBlock(child.id)}
              />
            );
          })}
      </SortableContext>
    </TileInfoRow>
  );
}
