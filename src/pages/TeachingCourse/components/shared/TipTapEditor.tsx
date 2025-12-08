import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic } from "lucide-react";
import "./TipTapEditor.module.scss";

export type TipTapEditorProps = {
  content: string | Record<string, unknown>;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  onChange?: (content: Record<string, unknown>) => void;
  minHeight?: string;
};

export default function TipTapEditor({
  content,
  editable = true,
  placeholder = "",
  className = "",
  onChange,
  minHeight = "150px",
}: Readonly<TipTapEditorProps>) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "",
    editable,
    editorProps: {
      attributes: {
        class: `tiptap-editor ${className}`,
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div styleName="tiptap-wrapper">
      {editable && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div styleName="bubble-menu">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              styleName={editor.isActive("bold") ? "active" : ""}
              aria-label="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              styleName={editor.isActive("italic") ? "active" : ""}
              aria-label="Italic"
            >
              <Italic size={16} />
            </button>
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
