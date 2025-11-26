import { useState, useEffect } from "react";
import Modal from "../../../../components/Modal/Modal";
import "./ElementPickerModal.module.scss";
import { BLOCK_REGISTRY, BlockType } from "../../utils/blockRegistry";

type ElementType = "accordion" | "text" | "dropdown" | "columnLayout" | "heading";

type ElementPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ElementType, options?: { columns?: number; variant?: string }) => void;
  mode: "add" | "edit";
  allowedTypes?: ("accordion" | "text" | "dropdown" | "columnLayout" | "heading")[];
  initialSelection?: {
    type: ElementType;
    options?: { columns?: number; variant?: string };
  };
};

export default function ElementPickerModal(
  props: Readonly<ElementPickerModalProps>
) {
  const {
    isOpen,
    onClose,
    onSelect,
    mode,
    allowedTypes = ["accordion", "text", "dropdown"],
    initialSelection,
  } = props;

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
          if (firstAllowedType === 'heading') {
            setSelectedElement({ type: firstAllowedType, options: { variant: selectedVariant } });
          } else if (firstAllowedType === 'columnLayout') {
            setSelectedElement({ type: firstAllowedType, options: { columns: numColumns } });
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
    setSelectedElement({ type: "columnLayout", options: { columns: numColumns } });
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
  const getBlocksByCategory = (category: 'container' | 'layout' | 'content') => {
    return Object.entries(BLOCK_REGISTRY)
      .filter(([type, meta]) =>
        meta.category === category &&
        allowedTypes.includes(type as ElementType)
      )
      .map(([type, meta]) => ({
        type: type as ElementType,
        displayName: meta.displayName,
        description: 'description' in meta ? meta.description : undefined,
        meta
      }));
  };

  // Helper to render icon for each block type
  const renderBlockIcon = (type: ElementType) => {
    const iconProps = {
      width: "32",
      height: "32",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
    };

    switch (type) {
      case 'accordion':
        return (
          <div styleName="layout-preview">
            <div styleName="layout-single"></div>
          </div>
        );
      case 'columnLayout':
        return (
          <div styleName="layout-preview">
            <div styleName="layout-double">
              {Array.from({ length: numColumns }).map((_, i) => (
                <div key={i} styleName="layout-column"></div>
              ))}
            </div>
          </div>
        );
      case 'heading':
        return (
          <svg {...iconProps}>
            <path d="M6 4v16M18 4v16M8 12h8" />
          </svg>
        );
      case 'text':
        return (
          <svg {...iconProps}>
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="14" y2="17" />
          </svg>
        );
      case 'dropdown':
        return (
          <svg {...iconProps}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="m9 11 3 3 3-3" />
          </svg>
        );
      default:
        return null;
    }
  };

  const layoutBlocks = getBlocksByCategory('container').concat(getBlocksByCategory('layout'));
  const contentBlocks = getBlocksByCategory('content');

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
                        if (type === 'columnLayout') {
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
                          {type === 'columnLayout' ? `${numColumns}-Column Layout` : displayName}
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
                        if (type === 'heading') {
                          handleElementClick(type, { variant: selectedVariant });
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
            <div styleName="preview-content">
              {selectedElement?.type === "accordion" && (
                <div styleName="preview-row">
                  <div styleName="preview-row-column full"></div>
                </div>
              )}

              {selectedElement?.type === "columnLayout" && (
                <div styleName="preview-row">
                  {Array.from({ length: selectedElement.options?.columns || 2 }).map((_, i) => (
                    <div key={i} styleName="preview-row-column half"></div>
                  ))}
                </div>
              )}

              {selectedElement?.type === "text" && (
                <div styleName="preview-block">
                  <div styleName="preview-block-header">Text Block</div>
                  <div styleName="preview-block-content">
                    <input
                      type="text"
                      placeholder="Enter text..."
                      disabled
                      styleName="preview-input"
                    />
                  </div>
                </div>
              )}

              {selectedElement?.type === "dropdown" && (
                <div styleName="preview-block">
                  <div styleName="preview-block-header">Dropdown Block</div>
                  <div styleName="preview-block-content">
                    <div styleName="preview-select">
                      <span>Select option(s)</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {selectedElement?.type === "heading" && (
                <div styleName="preview-block">
                  <div styleName="preview-block-header">
                    Heading Block - {selectedElement.options?.variant?.toUpperCase() || 'H2'}
                  </div>
                  <div styleName="preview-block-content">
                    <input
                      type="text"
                      placeholder={`Enter ${selectedElement.options?.variant || 'h2'} heading...`}
                      disabled
                      styleName="preview-input heading"
                    />
                  </div>
                </div>
              )}

              {!selectedElement && (
                <div styleName="preview-empty">
                  <p>Select an element to see preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Conditional options sidebar - only show if element has options */}
          {selectedElement && (selectedElement.type === "columnLayout" || selectedElement.type === "heading") && (
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
                          styleName={`option-btn ${numColumns === num ? "active" : ""}`}
                          onClick={() => {
                            setNumColumns(num);
                            setSelectedElement({ type: "columnLayout", options: { columns: num } });
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variant selector for heading */}
                {selectedElement.type === "heading" && BLOCK_REGISTRY.heading.variants && (
                  <div styleName="option-group">
                    <label styleName="option-label">Heading Level</label>
                    <div styleName="option-buttons-vertical">
                      {BLOCK_REGISTRY.heading.variants.map((variant) => (
                        <button
                          key={variant.value}
                          styleName={`option-btn-full ${selectedVariant === variant.value ? "active" : ""}`}
                          onClick={() => {
                            setSelectedVariant(variant.value);
                            setSelectedElement({
                              type: "heading",
                              options: { variant: variant.value }
                            });
                          }}
                          title={variant.description}
                        >
                          <span styleName="option-btn-label">{variant.label}</span>
                          {variant.description && (
                            <span styleName="option-btn-desc">{variant.description}</span>
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
