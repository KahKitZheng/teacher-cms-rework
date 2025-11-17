import { ChangeEvent, useState } from "react";
import TileInfoBaseTemplate from "../../TileInfoBase/template/TileInfoBaseTemplate";
import "./TileInfoTextTemplate.module.scss";

export type TileInfoTextTemplateProps = {
  variant: "template";
  tileInfo: TileInfoBlockText;
  activeBlockId?: number | null;
  hoveredBlockId?: number | null;
  isDragOverlay?: boolean;
  onAddElement?: () => void;
  onEditElement?: () => void;
  onDeleteElement?: () => void;
};

export default function TileInfoTextTemplate(
  props: Readonly<TileInfoTextTemplateProps>
) {
  const {
    tileInfo,
    activeBlockId,
    hoveredBlockId,
    isDragOverlay,
    onAddElement,
    onEditElement,
    onDeleteElement,
  } = props;
  const textData = tileInfo;

  const [text, setText] = useState(textData.data);

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }

  return (
    <TileInfoBaseTemplate
      title={tileInfo.name}
      blockId={tileInfo.id}
      activeBlockId={activeBlockId}
      hoveredBlockId={hoveredBlockId}
      isDragOverlay={isDragOverlay}
      actions={{
        // add: onAddElement,
        update: onEditElement,
        delete: onDeleteElement,
      }}
    >
      <input
        type="text"
        placeholder="Description"
        value={text}
        onChange={handleTextChange}
      />
    </TileInfoBaseTemplate>
  );
}
