import TileInfoCommentTemplate, {
  type TileInfoCommentTemplateProps,
} from "./template/TileInfoCommentTemplate";
import TileInfoCommentEdit, {
  type TileInfoCommentEditProps,
} from "./edit/TileInfoCommentEdit";
import TileInfoCommentRead, {
  type TileInfoCommentReadProps,
} from "./read/TileInfoCommentRead";

type TileInfoCommentProps =
  | TileInfoCommentTemplateProps
  | TileInfoCommentEditProps
  | TileInfoCommentReadProps;

export default function TileInfoComment(props: Readonly<TileInfoCommentProps>) {
  switch (props.variant) {
    case "template":
      return <TileInfoCommentTemplate {...props} />;
    case "edit":
      return <TileInfoCommentEdit {...props} />;
    case "read":
      return <TileInfoCommentRead {...props} />;

    default:
      return null;
  }
}
