import { GripHorizontal } from "lucide-react";
import "./DragHandle.module.scss";

type DragHandleProps = {
  options?: {
    theme?: "default" | "channel";
    borderStyle?: "default" | "dashed";
  };
};

export default function DragHandle(props: Readonly<DragHandleProps>) {
  const { theme = "default", borderStyle = "default" } = props?.options || {};

  return (
    <button styleName={`handle theme-${theme} border-${borderStyle}`}>
      <GripHorizontal size={16} color={"var(--blue-gray)"} />
    </button>
  );
}
