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
  const textData = tileInfo;

  return (
    <div styleName="tile-info-block-text">
      <div styleName="header">
        <p styleName="title">{tileInfo.name}</p>
      </div>
      <p>{textData.data}</p>
    </div>
  );
}
