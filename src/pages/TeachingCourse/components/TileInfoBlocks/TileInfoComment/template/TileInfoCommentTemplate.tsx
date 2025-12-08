import { useState } from "react";
import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import TipTapEditor from "../../../shared/TipTapEditor";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";
import Select from "react-select";
import "./TileInfoCommentTemplate.module.scss";

export type TileInfoCommentTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockComment;
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column";
  onEditElement?: () => void;
  onDeleteElement?: () => void;
  isPreview?: boolean;
};

type CommentTypeOption = {
  value: "info" | "warning" | "error";
  label: string;
  icon: typeof Info;
  color: string;
};

const commentTypeOptions: CommentTypeOption[] = [
  { value: "info", label: "Info", icon: Info, color: "#60a5fa" },
  { value: "warning", label: "Warning", icon: AlertTriangle, color: "#fb923c" },
  { value: "error", label: "Error", icon: AlertCircle, color: "#f87171" },
];

function SingleValueComponent(props: any) {
  const Icon = props.data.icon;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <Icon size={18} style={{ color: props.data.color }} />
      <span style={{ fontSize: "14px" }}>{props.data.label}</span>
    </div>
  );
}

function OptionComponent(props: any) {
  const Icon = props.data.icon;
  return (
    <div
      {...props.innerProps}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        width: "100%",
        backgroundColor: props.isFocused
          ? "var(--background-secondary, #f5f5f5)"
          : "transparent",
        cursor: "pointer",
      }}
    >
      <Icon size={18} style={{ color: props.data.color }} />
      <span>{props.data.label}</span>
    </div>
  );
}

export default function TileInfoCommentTemplate(
  props: Readonly<TileInfoCommentTemplateProps>
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

  const [selectedType, setSelectedType] = useState<CommentTypeOption>(
    commentTypeOptions.find((opt) => opt.value === tileInfo.data?.commentType) ||
      commentTypeOptions[0]
  );
  const [title, setTitle] = useState(tileInfo.data?.name || "");
  const [content, setContent] = useState(tileInfo.data?.content || "");

  const Icon = selectedType.icon;

  return (
    <TileInfoBaseTemplate
      title={title || "Comment"}
      blockId={tileInfo.id}
      activeBlockId={activeBlockId}
      activeId={activeId}
      hoveredBlockId={hoveredBlockId}
      isDragOverlay={isDragOverlay}
      level={level}
      isPreview={isPreview}
      hasLabel={false}
      actions={{
        update: onEditElement,
        delete: onDeleteElement,
      }}
    >
      <div styleName="comment-container">
        {/* Header section with type selector and title */}
        <div styleName="comment-header">
          <div styleName="type-select-wrapper">
            <Select
              isSearchable={false}
              isClearable={false}
              isDisabled={isPreview}
              className="react-select-container"
              classNamePrefix="react-select"
              value={selectedType}
              options={commentTypeOptions}
              onChange={(newValue) => newValue && setSelectedType(newValue)}
              menuPortalTarget={document.body}
              components={{
                SingleValue: SingleValueComponent,
                Option: OptionComponent,
                IndicatorSeparator: () => null,
              }}
              styles={{
                control: (base) => ({
                  ...base,
                  minWidth: "120px",
                  // minHeight: "42px",
                  // height: "42px",
                  borderColor: selectedType.color,
                  borderWidth: "2px",
                  borderRadius: "6px",
                }),
                valueContainer: (base) => ({
                  ...base,
                  padding: "0 12px",
                  // height: "38px",
                  display: "flex",
                  alignItems: "center",
                }),
                dropdownIndicator: (base) => ({
                  ...base,
                  padding: "0 8px",
                  // height: "38px",
                  display: "flex",
                  alignItems: "center",
                }),
                menu: (base) => ({
                  ...base,
                  minWidth: "180px",
                }),
                menuList: (base) => ({
                  ...base,
                  padding: "4px",
                }),
                menuPortal: (base) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
            />
          </div>
          <input
            type="text"
            styleName="title-input"
            placeholder="Opmerking"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPreview}
          />
        </div>

        {/* TipTap Editor */}
        <div styleName="editor-section">
          <TipTapEditor
            content={content}
            editable={!isPreview}
            placeholder="Enter comment content..."
            onChange={(newContent) => setContent(newContent)}
          />
        </div>

        {/* Preview section */}
        <div
          styleName="preview-section"
          style={{ borderLeftColor: selectedType.color }}
        >
          <div styleName="preview-header" style={{ color: selectedType.color }}>
            <Icon size={20} />
            <span>{title || "Placeholder..."}</span>
          </div>
          <div styleName="preview-content">
            <TipTapEditor
              content={content}
              editable={false}
              minHeight="auto"
            />
          </div>
        </div>
      </div>
    </TileInfoBaseTemplate>
  );
}
