import { ChangeEvent, useState } from "react";
import { Pencil, Trash } from "lucide-react";
import "./TileInfoTextEdit.module.scss";

export type TileInfoTextEditProps = {
  variant: "edit";
  tileInfo: TileInfoData;
};

export default function TileInfoTextEdit(
  props: Readonly<TileInfoTextEditProps>
) {
  const { tileInfo } = props;
  const textData = tileInfo.data as TileInfoBlockText;

  const [text, setText] = useState(textData.data);

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
  }

  return (
    <div styleName="tile-info-block-text">
      <div styleName="header">
        <p styleName="title">{tileInfo.data.name}</p>
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
