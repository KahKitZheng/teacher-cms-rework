import "./TileInfoTextRead.module.scss";

export type TileInfoTextReadProps = {
  variant: "read";
  tileInfo: TileInfoBlockText;
  onDeleteElement?: () => void;
};

export default function TileInfoTextRead(
  props: Readonly<TileInfoTextReadProps>
) {
  const { tileInfo } = props;

  return (
    <div styleName="tile-info-block-text">
      <div styleName="header">
        <p styleName="title">{tileInfo.data?.name || "Text"}</p>
      </div>
      <p>{tileInfo.data?.content || ""}</p>
    </div>
  );
}
