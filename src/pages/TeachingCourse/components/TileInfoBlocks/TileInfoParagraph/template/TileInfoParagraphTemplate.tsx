import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./TileInfoParagraphTemplate.module.scss";

export type TileInfoParagraphTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockParagraph;
  activeBlockId?: number | null;
  activeId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  level?: "tile" | "accordion" | "column";
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
  isPreview?: boolean;
};

export default function TileInfoParagraphTemplate(
  props: Readonly<TileInfoParagraphTemplateProps>
) {
  const {
    tileInfo,
    activeBlockId,
    activeId,
    hoveredBlockId,
    isDragOverlay,
    level,
    onAddElement,
    onEditElement,
    onDeleteElement,
    isPreview,
  } = props;

  const editor = useEditor({
    extensions: [StarterKit],
    content: tileInfo.data || "",
    editable: !isPreview,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  return (
    <TileInfoBaseTemplate
      title={tileInfo.name}
      blockId={tileInfo.id}
      activeBlockId={activeBlockId}
      activeId={activeId}
      hoveredBlockId={hoveredBlockId}
      isDragOverlay={isDragOverlay}
      level={level}
      isPreview={isPreview}
      actions={{
        update: onEditElement,
        delete: onDeleteElement,
      }}
    >
      <div styleName="editor-section">
        <EditorContent editor={editor} />
      </div>
    </TileInfoBaseTemplate>
  );
}
