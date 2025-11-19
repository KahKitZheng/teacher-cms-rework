const TILE_INFO_TEXT_DATA: TileInfoBlockText = {
  type: "text",
  level: "tile", // Default level, should be overridden when used
  id: 12312353462, // comply with ts first - overwrite later
  order: 0, // Should be overridden when used
  name: "[Optioneel] Materialen",
  data: "",
  placeholder: {
    template: "",
  },
};

const TILE_INFO_DROPDOWN_DATA: TileInfoBlockDropdown = {
  type: "dropdown",
  level: "tile", // Default level, should be overridden when used
  id: 123123, // comply with ts first - overwrite later
  order: 0, // Should be overridden when used
  name: "Type",
  options: [
    {
      label: "Tekenopdracht",
      value: "Tekenopdracht",
    },
    {
      label: "Ontwerpopdracht",
      value: "Ontwerpopdracht",
    },
    {
      label: "Vrije schrijfopdracht",
      value: "Vrije schrijfopdracht",
    },
    {
      label: "Laagdrempelige schrijfopdracht",
      value: "Laagdrempelige schrijfopdracht",
    },
    {
      label: "Stelopdracht",
      value: "Stelopdracht",
    },
    {
      label: "Digitale schrijfopdracht",
      value: "Digitale schrijfopdracht",
    },
    {
      label: "Poëzie opdracht",
      value: "Poëzie opdracht",
    },
    {
      label: "Presentatieopdracht",
      value: "Presentatieopdracht",
    },
    {
      label: "Onderzoeksopdracht",
      value: "Onderzoeksopdracht",
    },
    {
      label: "Klassengesprek",
      value: "Klassengesprek",
    },
    {
      label: "Duo-opdracht",
      value: "Duo-opdracht",
    },
    {
      label: "Feedbackronde",
      value: "Feedbackronde",
    },
    {
      label: "Proefje",
      value: "Proefje",
    },
    {
      label: "Spelletje",
      value: "Spelletje",
    },
    {
      label: "Muzikale opdracht",
      value: "Muzikale opdracht",
    },
    {
      label: "Knutselopdracht",
      value: "Knutselopdracht",
    },
    {
      label: "Opzoekopdracht",
      value: "Opzoekopdracht",
    },
    {
      label: "Meningopdracht",
      value: "Meningopdracht",
    },
    {
      label: "Invulopdracht",
      value: "Invulopdracht",
    },
  ],
};

export const tilesData: Tile[] = [
  {
    id: 143573456,
    chapterId: 1,
    order: 1,
    name: "Tile 1",
    coverImage: "",
    state: "open",
    type: "regular",
    // Tile-level blocks (separated from rows)
    blocks: [
      {
        type: "text",
        level: "tile",
        id: 9876,
        order: 0,
        icon: { template: "pencil" },
        name: "Direct text block",
        data: "This is a block directly in the data array",
      },
    ],
    // Rows (separated from blocks)
    rows: [
      // Row with column layout only
      {
        type: "row",
        level: "tile",
        id: 1234231234,
        name: "Title 2762",
        icon: "eye",
        order: 1,
        blocks: [], // No row-level blocks
        layouts: [
          {
            type: "columnLayout",
            level: "row",
            id: 99913523459,
            order: 0,
            parentId: 1234231234,
            leftColumn: [
              {
                type: "text",
                level: "column",
                id: 123345742,
                order: 0,
                parentId: 99913523459,
                columnSide: "left",
                icon: { template: "pencil" },
                name: "Title 3456",
                data: "Description",
              },
            ],
            rightColumn: [
              {
                ...TILE_INFO_DROPDOWN_DATA,
                level: "column",
                id: 45678,
                order: 0,
                parentId: 99913523459,
                columnSide: "right",
                name: "Title 5687",
              },
            ],
          },
        ],
      },
      // Row with both blocks and column layout
      {
        type: "row",
        level: "tile",
        id: 1234234,
        name: "Title 3465",
        icon: "eye",
        order: 2,
        blocks: [
          {
            type: "text",
            level: "row",
            id: 1586,
            order: 0,
            parentId: 1234234,
            icon: { template: "pencil" },
            name: "Title 1234",
            data: "Description",
          },
        ],
        layouts: [
          {
            type: "columnLayout",
            level: "row",
            id: 9999,
            order: 1,
            parentId: 1234234,
            leftColumn: [
              {
                type: "text",
                level: "column",
                id: 12342,
                order: 0,
                parentId: 9999,
                columnSide: "left",
                icon: { template: "pencil" },
                name: "Title 234",
                data: "Description",
              },
              {
                ...TILE_INFO_DROPDOWN_DATA,
                level: "column",
                id: 334573452345,
                order: 1,
                parentId: 9999,
                columnSide: "right",
                name: "Title 3465098",
              },
            ],
            rightColumn: [
              {
                ...TILE_INFO_DROPDOWN_DATA,
                level: "column",
                id: 33457345,
                order: 0,
                parentId: 9999,
                columnSide: "right",
                name: "Title 3465",
              },
            ],
          },
        ],
      },
    ],
  },
];
