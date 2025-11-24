import TileInfoHeadingTemplate, {
  type TileInfoHeadingTemplateProps,
} from "./template/TileInfoHeadingTemplate";
import TileInfoHeadingEdit, {
  type TileInfoHeadingEditProps,
} from "./edit/TileInfoHeadingEdit";
import TileInfoHeadingRead, {
  type TileInfoHeadingReadProps,
} from "./read/TileInfoHeadingRead";

type TileInfoHeadingProps =
  | TileInfoHeadingTemplateProps
  | TileInfoHeadingEditProps
  | TileInfoHeadingReadProps;

export default function TileInfoHeading(props: Readonly<TileInfoHeadingProps>) {
  switch (props.variant) {
    case "template":
      return <TileInfoHeadingTemplate {...props} />;
    case "edit":
      return <TileInfoHeadingEdit {...props} />;
    case "read":
      return <TileInfoHeadingRead {...props} />;

    default:
      return null;
  }
}
