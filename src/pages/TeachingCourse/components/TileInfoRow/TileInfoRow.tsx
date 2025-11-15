import { useState } from "react";
import { Diamond } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import DragHandle from "../DragHandle/DragHandle";
import InfoBlockActions from "../InfoBlockActions/InfoBlockActions";
import "./TileInfoRow.module.scss";
import IconPicker from "src/components/IconPicker/IconPicker";
import { ICONS } from "src/constants/icons";

type TileInfoRowProps = {
  tileInfoRow: TileInfoRow;
  children: React.ReactNode;
};

export default function TileInfoRow(props: Readonly<TileInfoRowProps>) {
  const { tileInfoRow, children } = props;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [title, setTitle] = useState(tileInfoRow.name);

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
          <IconPicker icon={{ label: "Eye", value: "eye" }} icons={ICONS} />
          <input
            type="text"
            styleName="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
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
