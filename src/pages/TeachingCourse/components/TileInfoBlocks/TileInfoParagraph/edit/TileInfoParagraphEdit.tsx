import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./TileInfoParagraphEdit.module.scss";

export type TileInfoParagraphEditProps = {
  variant: "edit";
  tileInfo: TileInfoBlockParagraph;
  onDeleteElement?: () => void;
};

export default function TileInfoParagraphEdit(
  props: Readonly<TileInfoParagraphEditProps>
) {
  const { tileInfo } = props;

  const editor = useEditor({
    extensions: [StarterKit],
    content: tileInfo.data || "",
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  return (
    <div styleName="tile-info-block-paragraph">
      <div styleName="header">
        <p styleName="title">{tileInfo.name}</p>
      </div>
      <div styleName="editor-wrapper">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
