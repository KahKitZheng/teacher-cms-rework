import TileInfoRow from "../../components/TileInfoRow/TileInfoRow";
import TileInfoText from "../../components/TileInfoBlocks/TileInfoText";
import TileInfoDropdown from "../../components/TileInfoBlocks/TileInfoDropdown/TileInfoDropdown";
import { tilesData } from "../../mock-data/tileInfo";
// import {
//   TILE_INFO_DROPDOWN_DATA,
//   TILE_INFO_TEXT_DATA,
// } from "../../mock-data/tileInfo";

// const tileInfoTextData = {
//   id: 1231231,
//   order: 1,
//   data: TILE_INFO_TEXT_DATA,
// };

// const tileInfoDropdownData = {
//   id: 12312,
//   order: 2,
//   data: TILE_INFO_DROPDOWN_DATA,
// };

type TeachingCourseTemplateProps = {};

export default function TeachingCourseTemplate(
  props: Readonly<TeachingCourseTemplateProps>
) {
  return tilesData.map((tile) => (
    <div key={tile.id}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {tile.data.map((tileInfoRow) => (
          <TileInfoRow key={tileInfoRow.id} tileInfoRow={tileInfoRow}>
            {tileInfoRow.columns.map((column) => (
              <div
                key={column.id}
                style={{
                  flex: "1",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {column.blocks.map((block) => {
                  switch (block.type) {
                    case "text":
                      return (
                        <TileInfoText
                          key={block.id}
                          variant="template"
                          tileInfo={block}
                        />
                      );
                    case "dropdown":
                      return (
                        <TileInfoDropdown
                          key={block.id}
                          variant="template"
                          tileInfo={block}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
          </TileInfoRow>
        ))}
      </div>
    </div>
  ));
}
