import TipTapEditor from "../../../shared/TipTapEditor";
import "./TileInfoParagraphEdit.module.scss";

export type TileInfoParagraphEditProps = {
  variant: "edit";
  tileInfo: TileInfoBlockParagraph;
  onDeleteElement?: () => void;
};

export default function TileInfoParagraphEdit(
  props: Readonly<TileInfoParagraphEditProps>
) {
  const { tileInfo } = props;

  return (
    <div styleName="tile-info-block-paragraph">
      <div styleName="header">
        <p styleName="title">{tileInfo.data?.name || "Paragraph"}</p>
      </div>
      <div styleName="editor-wrapper">
        <TipTapEditor
          content={tileInfo.data?.content || ""}
          editable={true}
          placeholder="Enter paragraph content..."
          minHeight="100px"
        />
      </div>
    </div>
  );
}
