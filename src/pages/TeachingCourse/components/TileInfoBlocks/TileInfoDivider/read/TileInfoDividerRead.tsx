import "./TileInfoDividerRead.module.scss";

export type TileInfoDividerReadProps = {
  variant: "read";
  tileInfo: TileInfoBlockDivider;
};

export default function TileInfoDividerRead(
  props: Readonly<TileInfoDividerReadProps>
) {
  return (
    <div styleName="divider-read">
      <div styleName="divider-line"></div>
    </div>
  );
}
