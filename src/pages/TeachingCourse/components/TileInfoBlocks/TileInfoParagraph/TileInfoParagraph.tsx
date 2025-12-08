import TileInfoParagraphTemplate, {
  type TileInfoParagraphTemplateProps,
} from "./template/TileInfoParagraphTemplate";
import TileInfoParagraphEdit, {
  type TileInfoParagraphEditProps,
} from "./edit/TileInfoParagraphEdit";
import TileInfoParagraphRead, {
  type TileInfoParagraphReadProps,
} from "./read/TileInfoParagraphRead";

type TileInfoParagraphProps =
  | TileInfoParagraphTemplateProps
  | TileInfoParagraphEditProps
  | TileInfoParagraphReadProps;

export default function TileInfoParagraph(props: Readonly<TileInfoParagraphProps>) {
  switch (props.variant) {
    case "template":
      return <TileInfoParagraphTemplate {...props} />;
    case "edit":
      return <TileInfoParagraphEdit {...props} />;
    case "read":
      return <TileInfoParagraphRead {...props} />;

    default:
      return null;
  }
}
