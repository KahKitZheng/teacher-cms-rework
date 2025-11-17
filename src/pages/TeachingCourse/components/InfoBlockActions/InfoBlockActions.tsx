import { Pencil, Plus, Trash } from "lucide-react";
import "./InfoBlockActions.module.scss";
import {
  getEffectiveBorderStyle,
  getIconColor,
} from "../../utils/dragDropStyles";

type InfoBlockActionsProps = {
  options?: {
    theme?: "default" | "channel";
    borderStyle?: "default" | "dashed";
  };
  handleAdd?: () => void;
  handleEdit?: () => void;
  handleDelete?: () => void;
  isDragOverlay?: boolean;
};

export default function InfoBlockActions(
  props: Readonly<InfoBlockActionsProps>
) {
  const { handleAdd, handleEdit, handleDelete, isDragOverlay = false } = props;
  const { theme = "default", borderStyle = "default" } = props.options || {};

  const iconColor = getIconColor(isDragOverlay);
  const effectiveBorderStyle = getEffectiveBorderStyle(
    isDragOverlay,
    borderStyle
  );

  return (
    <div
      styleName={`info-block-actions theme-${theme} border-${effectiveBorderStyle}`}
      style={
        isDragOverlay ? { borderColor: "var(--primary-color)" } : undefined
      }
    >
      {handleAdd && (
        <button styleName="icon-btn" onClick={handleAdd}>
          <Plus size={12} cursor="pointer" color={iconColor} />
        </button>
      )}
      <button styleName="icon-btn" onClick={handleEdit}>
        <Pencil size={12} cursor="pointer" color={iconColor} />
      </button>
      <button styleName="icon-btn" onClick={handleDelete}>
        <Trash size={12} cursor="pointer" color={iconColor} />
      </button>
    </div>
  );
}
