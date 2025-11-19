import { useState, useEffect } from "react";
import Modal from "../../../../components/Modal/Modal";
import "./ElementPickerModal.module.scss";

type ElementType = "accordion" | "text" | "dropdown" | "columnLayout";

type ElementPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ElementType, options?: { columns?: 1 | 2 }) => void;
  mode: "add" | "edit";
  allowedTypes?: ("accordion" | "text" | "dropdown" | "columnLayout")[];
  initialSelection?: {
    type: ElementType;
    options?: { columns?: 1 | 2 };
  };
};

type Tab = "layout" | "blocks";

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

  const showLayoutTab = allowedTypes.includes("accordion") || allowedTypes.includes("columnLayout");
  const showBlocksTab =
    allowedTypes.includes("text") || allowedTypes.includes("dropdown");

  const initialTab: Tab = showLayoutTab ? "layout" : "blocks";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [selectedElement, setSelectedElement] = useState<{
    type: ElementType;
    options?: { columns?: 1 | 2 };
  } | null>(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      // Set the correct tab based on initialSelection (if in edit mode)
      if (initialSelection) {
        if (initialSelection.type === "accordion" || initialSelection.type === "columnLayout") {
          setActiveTab("layout");
        } else if (
          initialSelection.type === "text" ||
          initialSelection.type === "dropdown"
        ) {
          setActiveTab("blocks");
        }
      } else {
        setActiveTab(initialTab);
      }
    } else {
      // Reset when closing to ensure clean state for next open
      setSelectedElement(null);
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, initialSelection]);

  // Set selected element when modal opens or tab changes
  useEffect(() => {
    if (!isOpen) return;

    // If there's an initial selection (edit mode), use that
    if (initialSelection) {
      setSelectedElement(initialSelection);
    } else if (mode === "add") {
      // Only auto-select the first available element when adding (not updating)
      if (activeTab === "layout" && showLayoutTab) {
        // Select first layout option
        if (allowedTypes.includes("accordion")) {
          setSelectedElement({ type: "accordion" });
        } else if (allowedTypes.includes("columnLayout")) {
          setSelectedElement({ type: "columnLayout" });
        }
      } else if (activeTab === "blocks" && showBlocksTab) {
        // Select first available block type
        if (allowedTypes.includes("text")) {
          setSelectedElement({ type: "text" });
        } else if (allowedTypes.includes("dropdown")) {
          setSelectedElement({ type: "dropdown" });
        }
      }
    }
  }, [
    isOpen,
    activeTab,
    showLayoutTab,
    showBlocksTab,
    allowedTypes,
    initialSelection,
    mode,
  ]);

  const handleElementClick = (
    type: ElementType,
    options?: { columns?: 1 | 2 }
  ) => {
    setSelectedElement({ type, options });
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "add" ? "Add elements" : "Edit element"}
      size="xlarge"
    >
      <div styleName="container">
        <div styleName="sidebar">
          <div styleName="tabs">
            <button
              styleName={`tab ${activeTab === "layout" ? "active" : ""} ${
                !showLayoutTab ? "disabled" : ""
              }`}
              onClick={() => showLayoutTab && setActiveTab("layout")}
              disabled={!showLayoutTab}
            >
              Layout
            </button>
            <button
              styleName={`tab ${activeTab === "blocks" ? "active" : ""} ${
                !showBlocksTab ? "disabled" : ""
              }`}
              onClick={() => showBlocksTab && setActiveTab("blocks")}
              disabled={!showBlocksTab}
            >
              Blocks
            </button>
          </div>

          <div styleName="elements-list">
            {activeTab === "layout" && showLayoutTab && (
              <>
                {allowedTypes.includes("accordion") && (
                  <button
                    styleName={`element-item ${
                      selectedElement?.type === "accordion" ? "selected" : ""
                    }`}
                    onClick={() => handleElementClick("accordion")}
                  >
                    <div styleName="element-icon">
                      <div styleName="layout-preview">
                        <div styleName="layout-single"></div>
                      </div>
                    </div>
                    <div styleName="element-info">
                      <div styleName="element-name">Row</div>
                      <div styleName="element-description">
                        Add a row container for blocks and layouts
                      </div>
                    </div>
                  </button>
                )}

                {allowedTypes.includes("columnLayout") && (
                  <button
                    styleName={`element-item ${
                      selectedElement?.type === "columnLayout" ? "selected" : ""
                    }`}
                    onClick={() => handleElementClick("columnLayout")}
                  >
                    <div styleName="element-icon">
                      <div styleName="layout-preview">
                        <div styleName="layout-double">
                          <div styleName="layout-column"></div>
                          <div styleName="layout-column"></div>
                        </div>
                      </div>
                    </div>
                    <div styleName="element-info">
                      <div styleName="element-name">2-Column Layout</div>
                      <div styleName="element-description">
                        Add a two-column layout inside a row
                      </div>
                    </div>
                  </button>
                )}
              </>
            )}

            {activeTab === "blocks" && showBlocksTab && (
              <>
                {allowedTypes.includes("text") && (
                  <button
                    styleName={`element-item ${
                      selectedElement?.type === "text" ? "selected" : ""
                    }`}
                    onClick={() => handleElementClick("text")}
                  >
                    <div styleName="element-icon">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="4" y1="7" x2="20" y2="7" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="17" x2="14" y2="17" />
                      </svg>
                    </div>
                    <div styleName="element-info">
                      <div styleName="element-name">Text Block</div>
                      <div styleName="element-description">
                        Add a text input field
                      </div>
                    </div>
                  </button>
                )}

                {allowedTypes.includes("dropdown") && (
                  <button
                    styleName={`element-item ${
                      selectedElement?.type === "dropdown" ? "selected" : ""
                    }`}
                    onClick={() => handleElementClick("dropdown")}
                  >
                    <div styleName="element-icon">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="m9 11 3 3 3-3" />
                      </svg>
                    </div>
                    <div styleName="element-info">
                      <div styleName="element-name">Dropdown Block</div>
                      <div styleName="element-description">
                        Add a dropdown select field
                      </div>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div styleName="preview">
          <div styleName="preview-content">
            {selectedElement?.type === "accordion" && (
              <div styleName="preview-row">
                <div styleName="preview-row-column full"></div>
              </div>
            )}

            {selectedElement?.type === "columnLayout" && (
              <div styleName="preview-row">
                <div styleName="preview-row-column half"></div>
                <div styleName="preview-row-column half"></div>
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
          </div>

          <div styleName="preview-actions">
            <button styleName="button secondary" onClick={handleClose}>
              Cancel
            </button>
            <button styleName="button primary" onClick={handleConfirm}>
              {mode === "add" ? "Add Element" : "Update Element"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
