import { GripHorizontal } from "lucide-react";
import "./DragHandle.module.scss";
import {
  getEffectiveBorderStyle,
  getIconColor,
} from "../../utils/dragDropStyles";
import { OPACITY } from "../../utils/dragDropConstants";

type DragHandleProps = {
  options?: {
    theme?: "default" | "channel";
    borderStyle?: "default" | "dashed";
  };
  listeners?: any;
  isDragOverlay?: boolean;
  isHovered?: boolean;
};

export default function DragHandle(props: Readonly<DragHandleProps>) {
  const { theme = "default", borderStyle = "default" } = props?.options || {};
  const { listeners, isDragOverlay = false, isHovered = false } = props;

  const effectiveBorderStyle = getEffectiveBorderStyle(
    isDragOverlay,
    borderStyle
  );
  const iconColor = getIconColor(isDragOverlay);

  return (
    <button
      styleName={`handle theme-${theme} border-${effectiveBorderStyle}`}
      {...listeners}
      style={{
        ...(isDragOverlay && { borderColor: "var(--primary-color)" }),
        ...(isHovered && { opacity: OPACITY.NORMAL }),
      }}
    >
      <GripHorizontal size={16} color={iconColor} />
    </button>
  );
}
