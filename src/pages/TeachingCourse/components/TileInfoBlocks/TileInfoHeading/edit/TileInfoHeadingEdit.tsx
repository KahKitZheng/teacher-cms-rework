import "./TileInfoHeadingEdit.module.scss";

export type TileInfoHeadingEditProps = {
  variant: "edit";
  tileInfo: TileInfoBlockHeading;
};

export default function TileInfoHeadingEdit(
  props: Readonly<TileInfoHeadingEditProps>
) {
  const { tileInfo } = props;

  return (
    <div styleName="heading-edit">
      <h2 styleName="heading">{tileInfo.data?.name || "Heading"}</h2>
    </div>
  );
}
