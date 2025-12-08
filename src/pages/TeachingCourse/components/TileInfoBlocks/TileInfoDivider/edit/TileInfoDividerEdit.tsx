import "./TileInfoDividerEdit.module.scss";

export type TileInfoDividerEditProps = {
  variant: "edit";
  tileInfo: TileInfoBlockDivider;
};

export default function TileInfoDividerEdit(
  props: Readonly<TileInfoDividerEditProps>
) {
  return (
    <div styleName="divider-edit">
      <div styleName="divider-line"></div>
    </div>
  );
}
