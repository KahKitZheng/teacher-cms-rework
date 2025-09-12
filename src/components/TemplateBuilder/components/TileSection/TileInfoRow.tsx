import { useState } from "react";
import { Pencil, PencilRuler, Trash } from "lucide-react";
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
          <PencilRuler />
          <input type="text" placeholder="Enter title" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Pencil />
          <Trash />
          <button style={{ border: "1px solid black" }}>Element +</button>
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
