import TileInfoRow from "./components/TileSection/TileInfoRow";
import "./TemplateBuilder.module.scss";

export default function TemplateBuilder() {
  return (
    <div
      style={{
        maxWidth: "1440px",
        width: "100%",
        minWidth: "600px",
        backgroundColor: "white",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div>
        <p style={{ fontSize: "18px" }}>
          <b>Tile name</b>
        </p>
        <p>Klassikaal, in groepen of individueel</p>
      </div>

      <div style={{ display: "flex", gap: "16px", flexDirection: "column" }}>
        <TileInfoRow>test #1</TileInfoRow>
        <TileInfoRow>test #2</TileInfoRow>
        <TileInfoRow>test #3</TileInfoRow>
      </div>
    </div>
  );
}
