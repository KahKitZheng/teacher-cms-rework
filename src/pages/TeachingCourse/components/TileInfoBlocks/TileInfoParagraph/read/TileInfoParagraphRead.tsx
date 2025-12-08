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
        <p styleName="title">{tileInfo.data?.name || "Paragraph"}</p>
      </div>
      <div styleName="content">
        <TipTapEditor
          content={tileInfo.data?.content || ""}
          editable={false}
          minHeight="auto"
        />
      </div>
    </div>
  );
}
