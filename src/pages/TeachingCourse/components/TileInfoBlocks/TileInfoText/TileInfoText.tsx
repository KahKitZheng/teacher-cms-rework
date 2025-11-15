import TileInfoTextTemplate, {
  type TileInfoTextTemplateProps,
} from "./template/TileInfoTextTemplate";
import TileInfoTextEdit, {
  type TileInfoTextEditProps,
} from "./edit/TileInfoTextEdit";
import TileInfoTextRead, {
  type TileInfoTextReadProps,
} from "./read/TileInfoTextRead";

type TileInfoTextProps =
  | TileInfoTextTemplateProps
  | TileInfoTextEditProps
  | TileInfoTextReadProps;

export default function TileInfoText(props: Readonly<TileInfoTextProps>) {
  switch (props.variant) {
    case "template":
      return <TileInfoTextTemplate {...props} />;
    case "edit":
      return <TileInfoTextEdit {...props} />;
    case "read":
      return <TileInfoTextRead {...props} />;

    default:
      return null;
  }
}
