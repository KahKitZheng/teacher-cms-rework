import "./TileInfoHeadingRead.module.scss";

export type TileInfoHeadingReadProps = {
  variant: "read";
  tileInfo: TileInfoBlockHeading;
};

export default function TileInfoHeadingRead(
  props: Readonly<TileInfoHeadingReadProps>
) {
  const { tileInfo } = props;

  return (
    <div styleName="heading-read">
      <h2 styleName="heading">{tileInfo.name}</h2>
    </div>
  );
}
