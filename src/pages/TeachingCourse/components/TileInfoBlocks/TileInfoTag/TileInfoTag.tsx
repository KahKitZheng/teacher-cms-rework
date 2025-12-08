import TileInfoTagTemplate, {
  type TileInfoTagTemplateProps,
} from "./template/TileInfoTagTemplate";
// import TileInfoTagEdit, {
//   type TileInfoTagEditProps,
// } from "./edit/TileInfoTagEdit";
// import TileInfoTagRead, {
//   type TileInfoTagReadProps,
// } from "./read/TileInfoTagRead";

type TileInfoTagProps = TileInfoTagTemplateProps;
//   | TileInfoTagEditProps
//   | TileInfoTagReadProps;

export default function TileInfoTag(props: Readonly<TileInfoTagProps>) {
  switch (props.variant) {
    case "template":
      return <TileInfoTagTemplate {...props} />;
    // case "edit":
    //   return <TileInfoTagEdit {...props} />;
    // case "read":
    //   return <TileInfoTagRead {...props} />;

    default:
      return null;
  }
}
