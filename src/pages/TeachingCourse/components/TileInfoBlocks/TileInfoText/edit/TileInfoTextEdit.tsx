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
  const textData = tileInfo;

  const [text, setText] = useState(textData.data);

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }

  return (
    <div styleName="tile-info-block-text">
      <div styleName="header">
        <p styleName="title">{tileInfo.name}</p>
      </div>
      <input
        type="text"
        value={text}
        placeholder={textData.placeholder?.template || ""}
        styleName="text-input"
        onChange={handleTextChange}
      />
    </div>
  );
}
