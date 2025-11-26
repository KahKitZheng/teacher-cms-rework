import { Suspense } from 'react';
import { getBlockComponent } from '../../../utils/blockRegistry';
import BlockSkeleton from './BlockSkeleton';

type TileInfoBlockProps = {
  block: TileInfoBlock;
  variant: "template" | "edit" | "read";
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column"; // Hierarchy level for collision detection
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
};

export default function TileInfoBlock(props: Readonly<TileInfoBlockProps>) {
  const {
    block,
    variant,
    activeBlockId,
    activeId,
    hoveredBlockId,
    isDragOverlay,
    level,
    onAddElement,
    onEditElement,
    onDeleteElement,
  } = props;

  const Component = getBlockComponent(block.type);

  if (!Component) {
    return (
      <div style={{ color: 'red', padding: '1rem' }}>
        Unknown block type: {block.type}
      </div>
    );
  }

  return (
    <Suspense fallback={<BlockSkeleton />}>
      <Component
        key={block.id}
        variant={variant}
        tileInfo={block}
        activeBlockId={activeBlockId}
        activeId={activeId}
        hoveredBlockId={hoveredBlockId}
        isDragOverlay={isDragOverlay}
        level={level}
        onAddElement={onAddElement}
        onEditElement={onEditElement}
        onDeleteElement={onDeleteElement}
      />
    </Suspense>
  );
}
