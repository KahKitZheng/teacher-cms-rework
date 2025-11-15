import { Pencil, Plus, Trash } from "lucide-react";
import "./InfoBlockActions.module.scss";

type InfoBlockActionsProps = {
  options?: {
    theme?: "default" | "channel";
    borderStyle?: "default" | "dashed";
  };
  handleAdd?: () => void;
  handleEdit?: () => void;
  handleDelete?: () => void;
};

export default function InfoBlockActions(
  props: Readonly<InfoBlockActionsProps>
) {
  const { handleAdd, handleEdit, handleDelete } = props;
  const { theme = "default", borderStyle = "default" } = props.options || {};

  return (
    <div styleName={`info-block-actions theme-${theme} border-${borderStyle}`}>
      <button styleName="icon-btn" onClick={handleAdd}>
        <Plus size={12} cursor="pointer" color="var(--blue-gray)" />
      </button>
      <button styleName="icon-btn" onClick={handleEdit}>
        <Pencil size={12} cursor="pointer" color="var(--blue-gray)" />
      </button>
      <button styleName="icon-btn" onClick={handleDelete}>
        <Trash size={12} cursor="pointer" color="var(--blue-gray)" />
      </button>
    </div>
  );
}
