import { useState, useEffect, Suspense } from "react";
import Modal from "../../../../components/Modal/Modal";
import "./ElementPickerModal.module.scss";
import {
  BLOCK_REGISTRY,
  BlockType,
  getTileLevelBlockTypes,
  getBlockComponent,
  getBlockIcon,
  getBlockPreviewFallback,
} from "../../utils/blockRegistry";
import { createMockBlock } from "../../utils/blockFactory";

// Use BlockType from registry instead of hardcoded union
type ElementType = BlockType;

type ElementPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (
    type: ElementType,
    options?: { columns?: number; variant?: string }
  ) => void;
  mode: "add" | "edit";
  allowedTypes?: BlockType[];
  initialSelection?: {
    type: ElementType;
    options?: { columns?: number; variant?: string };
  };
};

export default function ElementPickerModal(
  props: Readonly<ElementPickerModalProps>
) {
  const { isOpen, onClose, onSelect, mode, initialSelection } = props;

  // Dynamic: use all blocks that can be at tile level if not specified
  const allowedTypes = props.allowedTypes ?? getTileLevelBlockTypes();

  const [selectedElement, setSelectedElement] = useState<{
    type: ElementType;
    options?: { columns?: number; variant?: string };
  } | null>(null);
  const [numColumns, setNumColumns] = useState<number>(2);
  const [selectedVariant, setSelectedVariant] = useState<string>("h2"); // Default variant

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      if (initialSelection) {
        // Set initial selection from props (edit mode)
        setSelectedElement(initialSelection);
        // Set initial variant if provided
        if (initialSelection.options?.variant) {
          setSelectedVariant(initialSelection.options.variant);
        }
        // Set initial columns if provided
        if (initialSelection.options?.columns) {
          setNumColumns(initialSelection.options.columns);
        }
      } else if (mode === "add") {
        // Auto-select the first available element when adding
        const firstAllowedType = allowedTypes[0];
        if (firstAllowedType) {
          if (firstAllowedType === "heading") {
            setSelectedElement({
              type: firstAllowedType,
              options: { variant: selectedVariant },
            });
          } else if (firstAllowedType === "columnLayout") {
            setSelectedElement({
              type: firstAllowedType,
              options: { columns: numColumns },
            });
          } else {
            setSelectedElement({ type: firstAllowedType });
          }
        }
      }
    } else {
      // Reset when closing to ensure clean state for next open
      setSelectedElement(null);
      setSelectedVariant("h2");
      setNumColumns(2);
    }
  }, [isOpen, initialSelection, mode, allowedTypes]);

  const handleElementClick = (
    type: ElementType,
    options?: { columns?: number; variant?: string }
  ) => {
    setSelectedElement({ type, options });
  };

  const handleColumnLayoutClick = () => {
    setSelectedElement({
      type: "columnLayout",
      options: { columns: numColumns },
    });
  };

  const handleConfirm = () => {
    if (selectedElement) {
      onSelect(selectedElement.type, selectedElement.options);
      onClose();
      setSelectedElement(null);
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Helper to get blocks by category from registry
  const getBlocksByCategory = (
    category: "container" | "layout" | "content"
  ) => {
    return Object.entries(BLOCK_REGISTRY)
      .filter(
        ([type, meta]) =>
          meta.category === category &&
          allowedTypes.includes(type as ElementType)
      )
      .map(([type, meta]) => ({
        type: type as ElementType,
        displayName: meta.displayName,
        description: "description" in meta ? meta.description : undefined,
        meta,
      }));
  };

  // Helper to render icon for each block type
  const renderBlockIcon = (type: ElementType) => {
    // Use registry-based icon rendering
    return getBlockIcon(type, numColumns);
  };

  // Render actual block component for preview
  const renderBlockPreview = () => {
    if (!selectedElement) {
      return (
        <div styleName="preview-empty">
          <p>Select an element to see preview</p>
        </div>
      );
    }

    const BlockComponent = getBlockComponent(selectedElement.type);
    if (!BlockComponent) return null;

    const mockBlock = createMockBlock(
      selectedElement.type,
      selectedElement.options
    );

    // For layout blocks (accordion, columnLayout), show simplified preview
    if (selectedElement.type === "accordion") {
      return (
        <div styleName="preview-row">
          <div styleName="preview-row-column full"></div>
        </div>
      );
    }

    if (selectedElement.type === "columnLayout") {
      return (
        <div styleName="preview-row">
          {Array.from({ length: selectedElement.options?.columns || 2 }).map(
            (_, i) => (
              <div key={i} styleName="preview-row-column half"></div>
            )
          )}
        </div>
      );
    }

    // For content blocks, render the actual component
    return (
      <div styleName="preview-block-wrapper">
        <Suspense fallback={getBlockPreviewFallback(selectedElement.type)}>
          <BlockComponent
            variant="template"
            tileInfo={mockBlock}
            activeBlockId={null}
            activeId={null}
            hoveredBlockId={null}
            isDragOverlay={false}
            level="tile"
            isPreview={true}
          />
        </Suspense>
      </div>
    );
  };

  const layoutBlocks = getBlocksByCategory("container").concat(
    getBlocksByCategory("layout")
  );
  const contentBlocks = getBlocksByCategory("content");

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "add" ? "Add elements" : "Edit element"}
      size="xlarge"
    >
      <div styleName="modal-body">
        <div styleName="container">
          {/* Fixed left sidebar - Element list */}
          <div styleName="elements-sidebar">
            <div styleName="elements-list">
              {/* Layout category */}
              {layoutBlocks.length > 0 && (
                <div styleName="category-section">
                  <div styleName="category-header">Layout</div>
                  {layoutBlocks.map(({ type, displayName, description }) => (
                    <button
                      key={type}
                      styleName={`element-item ${
                        selectedElement?.type === type ? "selected" : ""
                      }`}
                      onClick={() => {
                        if (type === "columnLayout") {
                          handleColumnLayoutClick();
                        } else {
                          handleElementClick(type);
                        }
                      }}
                    >
                      <div styleName="element-icon">
                        {renderBlockIcon(type)}
                      </div>
                      <div styleName="element-info">
                        <div styleName="element-name">
                          {type === "columnLayout"
                            ? `${numColumns}-Column Layout`
                            : displayName}
                        </div>
                        {description && (
                          <div styleName="element-description">
                            {description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Content blocks category */}
              {contentBlocks.length > 0 && (
                <div styleName="category-section">
                  <div styleName="category-header">Blocks</div>
                  {contentBlocks.map(({ type, displayName, description }) => (
                    <button
                      key={type}
                      styleName={`element-item ${
                        selectedElement?.type === type ? "selected" : ""
                      }`}
                      onClick={() => {
                        if (type === "heading") {
                          handleElementClick(type, {
                            variant: selectedVariant,
                          });
                        } else {
                          handleElementClick(type);
                        }
                      }}
                    >
                      <div styleName="element-icon">
                        {renderBlockIcon(type)}
                      </div>
                      <div styleName="element-info">
                        <div styleName="element-name">{displayName}</div>
                        {description && (
                          <div styleName="element-description">
                            {description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview area */}
          <div styleName="preview-area">
            <div styleName="preview-content">{renderBlockPreview()}</div>
          </div>

          {/* Conditional options sidebar - only show if element has options */}
          {selectedElement &&
            (selectedElement.type === "columnLayout" ||
              selectedElement.type === "heading") && (
              <div styleName="options-sidebar">
                <div styleName="options-header">Options</div>
                <div styleName="options-content">
                  {/* Column count selector for columnLayout */}
                  {selectedElement.type === "columnLayout" && (
                    <div styleName="option-group">
                      <label styleName="option-label">Number of columns</label>
                      <div styleName="option-buttons">
                        {[2, 3, 4].map((num) => (
                          <button
                            key={num}
                            styleName={`option-btn ${
                              numColumns === num ? "active" : ""
                            }`}
                            onClick={() => {
                              setNumColumns(num);
                              setSelectedElement({
                                type: "columnLayout",
                                options: { columns: num },
                              });
                            }}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variant selector for heading */}
                  {selectedElement.type === "heading" &&
                    BLOCK_REGISTRY.heading.variants && (
                      <div styleName="option-group">
                        <label styleName="option-label">Heading Level</label>
                        <div styleName="option-buttons-vertical">
                          {BLOCK_REGISTRY.heading.variants.map((variant) => (
                            <button
                              key={variant.value}
                              styleName={`option-btn-full ${
                                selectedVariant === variant.value
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() => {
                                setSelectedVariant(variant.value);
                                setSelectedElement({
                                  type: "heading",
                                  options: { variant: variant.value },
                                });
                              }}
                              title={variant.description}
                            >
                              <span styleName="option-btn-label">
                                {variant.label}
                              </span>
                              {variant.description && (
                                <span styleName="option-btn-desc">
                                  {variant.description}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
        </div>

        {/* Footer - Full width */}
        <div styleName="modal-footer">
          <button styleName="button secondary" onClick={handleClose}>
            Cancel
          </button>
          <button styleName="button primary" onClick={handleConfirm}>
            {mode === "add" ? "Add Element" : "Update Element"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
