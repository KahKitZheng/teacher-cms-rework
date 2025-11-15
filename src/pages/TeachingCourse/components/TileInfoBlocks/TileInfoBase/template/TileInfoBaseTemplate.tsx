import { GripHorizontal, GripVertical, Pencil, Trash } from "lucide-react";
import "./TileInfoBaseTemplate.module.scss";
import { useState } from "react";
import DragHandle from "../../../DragHandle/DragHandle";
import InfoBlockActions from "../../../InfoBlockActions/InfoBlockActions";

type TileInfoBaseTemplateProps = {
  children: React.ReactNode;
  title: string;
  actions?: {
    update: {
      enabled: boolean;
      callback: () => void;
    };
    delete: {
      enabled: boolean;
      callback: () => void;
    };
  };
};

export default function TileInfoBaseTemplate(
  props: Readonly<TileInfoBaseTemplateProps>
) {
  const { children, actions } = props;

  const [title, setTitle] = useState(props.title);

  return (
    <div styleName="tile-info-base">
      {/* Actions */}
      <div
        style={{
          position: "absolute",
          transform: "translateY(calc(-24px - 50%))",
        }}
      >
        <DragHandle />
      </div>
      <div
        styleName="actions"
        style={{
          position: "absolute",
          transform: "translateY(calc(-24px - 50%))",
          right: "16px",
        }}
      >
        <InfoBlockActions />
      </div>

      {/* Content */}
      <div styleName="header">
        <input
          type="text"
          value={title}
          placeholder="Title"
          styleName="title-input"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      {children}
    </div>
  );
}
