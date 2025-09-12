import { useState } from "react";
import { Pencil, PencilRuler, Plus, Trash } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import "./TileInfoRow.module.scss";

type TileInfoRowProps = {
  children: React.ReactNode;
};

export default function TileInfoRow(props: Readonly<TileInfoRowProps>) {
  const { children } = props;

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div styleName="tileSectionBuilder">
      <div styleName="header">
        <div styleName="iconAndName">
          <PencilRuler size={14} />
          <input type="text" placeholder="Enter title" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Pencil size={14} />
          <Trash size={14} />
          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              border: "none",
              padding: "8px 16px",
            }}
          >
            <span>Element</span>
            <Plus size={12} />
          </button>
          <DynamicIcon
            name={isCollapsed ? "chevron-down" : "chevron-up"}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
