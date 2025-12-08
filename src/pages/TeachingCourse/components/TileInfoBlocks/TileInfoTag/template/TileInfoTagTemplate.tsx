import { ChangeEvent, useState, KeyboardEvent } from "react";
import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import CreatableSelect from "react-select/creatable";
import { SingleValue } from "react-select";
import Modal from "../../../../../../components/Modal/Modal";
import "./TileInfoTagTemplate.module.scss";

export type TileInfoTagTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockTag;
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column"; // Hierarchy level for collision detection
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
  isPreview?: boolean;
};

type TagTypeOption = {
  label: string;
  value: string;
};

const defaultTagTypes: TagTypeOption[] = [
  { label: "Begrippen", value: "begrippen" },
  { label: "Kerndoelen", value: "kerndoelen" },
];

export default function TileInfoTagTemplate(
  props: Readonly<TileInfoTagTemplateProps>
) {
  const {
    tileInfo,
    activeBlockId,
    activeId,
    hoveredBlockId,
    isDragOverlay,
    level,
    onEditElement,
    onDeleteElement,
    isPreview,
  } = props;
  const tagData = tileInfo;

  const [tagType, setTagType] = useState<TagTypeOption | null>(
    tagData.tagType ? { label: tagData.tagType, value: tagData.tagType } : null
  );
  const [tags, setTags] = useState<string[]>(tagData.tags || []);
  const [currentInput, setCurrentInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  function handleTagTypeChange(newValue: SingleValue<TagTypeOption>) {
    setTagType(newValue);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setCurrentInput(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && currentInput.trim()) {
      event.preventDefault();
      addTag(currentInput.trim());
    }
  }

  function addTag(value: string) {
    const formatted = value.trim().toLowerCase().replace(/\s+/g, "-");
    if (formatted && !tags.includes(formatted)) {
      setTags([...tags, formatted]);
      setCurrentInput("");
    }
  }

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  }

  function handleOpenModal() {
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setBulkInput("");
  }

  function handleBulkAdd() {
    // Split by commas, trim whitespace, format each tag
    const newTags = bulkInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, "-"))
      .filter((tag) => tag && !tags.includes(tag));

    setTags([...tags, ...newTags]);
    handleCloseModal();
  }

  function handleBulkInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setBulkInput(event.target.value);
  }

  return (
    <>
      <TileInfoBaseTemplate
        title={tagData.name}
        blockId={tileInfo.id}
        activeBlockId={activeBlockId}
        activeId={activeId}
        hoveredBlockId={hoveredBlockId}
        isDragOverlay={isDragOverlay}
        hasLabel={false}
        level={level}
        isPreview={isPreview}
        actions={{
          update: onEditElement,
          delete: onDeleteElement,
        }}
      >
        <div styleName="tag-container">
          {/* Dropdown for tag type */}
          <CreatableSelect
            isClearable
            className="react-select-container"
            classNamePrefix="react-select"
            placeholder="Select or create tag type..."
            value={tagType}
            options={defaultTagTypes}
            onChange={handleTagTypeChange}
            formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
          />

          {/* Input row with text input and format button */}
          <div styleName="input-row">
            <input
              type="text"
              styleName="tag-input"
              placeholder="Enter tag value (press Enter to add)"
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              styleName="format-btn"
              onClick={handleOpenModal}
            >
              Format
            </button>
          </div>

          {/* Tag list */}
          <div styleName="tag-list">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <div key={tag} styleName="tag-item">
                  <span styleName="tag-value">{tag}</span>
                  <button
                    type="button"
                    styleName="remove-btn"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p styleName="empty-state">
                No tags added yet. Enter a value above and press Enter.
              </p>
            )}
          </div>
        </div>
      </TileInfoBaseTemplate>

      {/* Bulk format modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Bulk Add Tags"
        size="medium"
      >
        <div styleName="modal-content">
          <p styleName="modal-description">
            Paste comma-separated values below. Each value will be automatically
            formatted (lowercase, spaces replaced with hyphens) and added as a
            tag.
          </p>
          <textarea
            styleName="bulk-textarea"
            placeholder="e.g., tag one, tag two, tag three"
            value={bulkInput}
            onChange={handleBulkInputChange}
            rows={6}
          />
          <div styleName="modal-actions">
            <button
              type="button"
              styleName="button secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </button>
            <button
              type="button"
              styleName="button primary"
              onClick={handleBulkAdd}
              disabled={!bulkInput.trim()}
            >
              Add Tags
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
