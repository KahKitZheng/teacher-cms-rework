import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./TileInfoParagraphRead.module.scss";

export type TileInfoParagraphReadProps = {
  variant: "read";
  tileInfo: TileInfoBlockParagraph;
  onDeleteElement?: () => void;
};

export default function TileInfoParagraphRead(
  props: Readonly<TileInfoParagraphReadProps>
) {
  const { tileInfo } = props;

  const editor = useEditor({
    extensions: [StarterKit],
    content: tileInfo.data || "",
    editable: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor-read",
      },
    },
  });

  return (
    <div styleName="tile-info-block-paragraph">
      <div styleName="header">
        <p styleName="title">{tileInfo.name}</p>
      </div>
      <div styleName="content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
