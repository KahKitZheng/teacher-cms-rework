import TileInfoRow from "../../components/TileInfoRow/TileInfoRow";
import TileInfoText from "../../components/TileInfoBlocks/TileInfoText";
import TileInfoDropdown from "../../components/TileInfoBlocks/TileInfoDropdown/TileInfoDropdown";
import { tilesData } from "../../mock-data/tileInfo";
import { CircleQuestionMark, Plus } from "lucide-react";
import Button from "src/components/Button/Button";
import { useState } from "react";

type TeachingCourseTemplateProps = {};

export default function TeachingCourseTemplate(
  props: Readonly<TeachingCourseTemplateProps>
) {
  const [tileInfo, setTileInfo] = useState(tilesData);

  return (
    <>
      {tileInfo.length <= 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            flex: 1,
            gap: "16px",
          }}
        >
          <CircleQuestionMark size={48} />
          <p>No info blocks found!</p>
          <Button>
            <span>Element</span>
            <Plus size={14} />
          </Button>
        </div>
      ) : (
        <>
          {tileInfo.map((tile) => (
            <div key={tile.id} style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {tile.data.map((tileInfoRow) => (
                  <TileInfoRow key={tileInfoRow.id} tileInfoRow={tileInfoRow}>
                    {tileInfoRow.columns.map((column) => (
                      <div
                        key={column.id}
                        style={{
                          flex: "1",
                          display: "flex",
                          flexDirection: "column",
                          gap: "24px",
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
          ))}
          <Button style={{ width: "fit-content", margin: "0 auto" }}>
            <span>Element</span>
            <Plus size={14} />
          </Button>
        </>
      )}
    </>
  );
}
