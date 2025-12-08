import TipTapEditor from "../../../shared/TipTapEditor";
import "./TileInfoParagraphRead.module.scss";

export type TileInfoParagraphReadProps = {
  variant: "read";
  tileInfo: TileInfoBlockParagraph;
  onDeleteElement?: () => void;
};

export default function TileInfoParagraphRead(
  props: Readonly<TileInfoParagraphReadProps>
) {
  const { tileInfo } = props;

  return (
    <div styleName="tile-info-block-paragraph">
      <div styleName="header">
        <p styleName="title">{tileInfo.name}</p>
      </div>
      <div styleName="content">
        <TipTapEditor
          content={tileInfo.data || ""}
          editable={false}
          minHeight="auto"
        />
      </div>
    </div>
  );
}
