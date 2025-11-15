import TileInfoDropdownTemplate, {
  type TileInfoDropdownTemplateProps,
} from "./template/TileInfoDropdownTemplate";
// import TileInfoDropdownEdit, {
//   type TileInfoDropdownEditProps,
// } from "./edit/TileInfoDropdownEdit";
// import TileInfoDropdownRead, {
//   type TileInfoDropdownReadProps,
// } from "./read/TileInfoDropdownRead";

type TileInfoDropdownProps = TileInfoDropdownTemplateProps;
//   | TileInfoDropdownEditProps
//   | TileInfoDropdownReadProps;

export default function TileInfoDropdown(
  props: Readonly<TileInfoDropdownProps>
) {
  switch (props.variant) {
    case "template":
      return <TileInfoDropdownTemplate {...props} />;
    // case "edit":
    //   return <TileInfoDropdownEdit {...props} />;
    // case "read":
    //   return <TileInfoDropdownRead {...props} />;

    default:
      return null;
  }
}
