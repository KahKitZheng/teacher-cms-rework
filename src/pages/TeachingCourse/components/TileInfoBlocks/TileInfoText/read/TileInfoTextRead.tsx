import "./TileInfoTextRead.module.scss";

export type TileInfoTextReadProps = {
  variant: "read";
  tileInfo: TileInfoData;
  onDeleteElement?: () => void;
};

export default function TileInfoTextRead(
  props: Readonly<TileInfoTextReadProps>
) {
  const { tileInfo } = props;
  const textData = tileInfo.data as TileInfoBlockText;

  return (
    <div styleName="tile-info-block-text">
      <div styleName="header">
        <p styleName="title">{tileInfo.data.name}</p>
      </div>
      <p>{textData.data}</p>
    </div>
  );
}
