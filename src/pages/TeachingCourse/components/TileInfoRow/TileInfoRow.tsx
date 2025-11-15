import { useState } from "react";
import { Diamond, Pencil, PencilRuler, Plus, Trash } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import "./TileInfoRow.module.scss";
import Button from "src/components/Button/Button";
import DragHandle from "../DragHandle/DragHandle";
import InfoBlockActions from "../InfoBlockActions/InfoBlockActions";

type TileInfoRowProps = {
  tileInfoRow: TileInfoRow;
  children: React.ReactNode;
};

export default function TileInfoRow(props: Readonly<TileInfoRowProps>) {
  const { tileInfoRow, children } = props;

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div styleName="tileSectionBuilder">
      {/* Actions */}
      <div
        style={{
          position: "absolute",
          transform: "translateY(calc(-16px - 50%))",
        }}
      >
        <DragHandle options={{ theme: "channel", borderStyle: "dashed" }} />
      </div>
      <div
        styleName="actions"
        style={{
          position: "absolute",
          transform: "translateY(calc(-16px - 50%))",
          right: "16px",
        }}
      >
        <InfoBlockActions
          options={{ theme: "channel", borderStyle: "dashed" }}
        />
      </div>

      {/* Content */}
      <div styleName="header">
        <div styleName="iconAndName">
          <Diamond
            fill="var(--primary-color)"
            size={16}
            stroke={"var(--primary-color)"}
          />
          <p styleName="title">{tileInfoRow.name}</p>
        </div>
        <DynamicIcon
          size={16}
          name={isCollapsed ? "chevron-down" : "chevron-up"}
          onClick={() => setIsCollapsed(!isCollapsed)}
          cursor="pointer"
        />
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        {isCollapsed ? null : children}
      </div>
    </div>
  );
}
