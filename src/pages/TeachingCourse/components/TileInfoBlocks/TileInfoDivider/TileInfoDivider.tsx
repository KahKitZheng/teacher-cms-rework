import TileInfoDividerTemplate, {
  type TileInfoDividerTemplateProps,
} from "./template/TileInfoDividerTemplate";
import TileInfoDividerEdit, {
  type TileInfoDividerEditProps,
} from "./edit/TileInfoDividerEdit";
import TileInfoDividerRead, {
  type TileInfoDividerReadProps,
} from "./read/TileInfoDividerRead";

type TileInfoDividerProps =
  | TileInfoDividerTemplateProps
  | TileInfoDividerEditProps
  | TileInfoDividerReadProps;

export default function TileInfoDivider(props: Readonly<TileInfoDividerProps>) {
  switch (props.variant) {
    case "template":
      return <TileInfoDividerTemplate {...props} />;
    case "edit":
      return <TileInfoDividerEdit {...props} />;
    case "read":
      return <TileInfoDividerRead {...props} />;

    default:
      return null;
  }
}
