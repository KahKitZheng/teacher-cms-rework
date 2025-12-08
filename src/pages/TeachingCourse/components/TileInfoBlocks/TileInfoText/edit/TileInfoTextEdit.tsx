import { ChangeEvent, useState } from "react";
import "./TileInfoTextEdit.module.scss";

export type TileInfoTextEditProps = {
  variant: "edit";
  tileInfo: TileInfoBlockText;
  onDeleteElement?: () => void;
};

export default function TileInfoTextEdit(
  props: Readonly<TileInfoTextEditProps>
) {
  const { tileInfo } = props;

  const [text, setText] = useState(tileInfo.data?.content || "");

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }

  return (
    <div styleName="tile-info-block-text">
      <div styleName="header">
        <p styleName="title">{tileInfo.data?.name || "Text"}</p>
      </div>
      <input
        type="text"
        value={text}
        placeholder="Enter text..."
        styleName="text-input"
        onChange={handleTextChange}
      />
    </div>
  );
}
