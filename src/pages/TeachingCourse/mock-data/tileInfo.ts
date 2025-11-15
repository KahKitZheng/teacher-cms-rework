const TILE_INFO_TEXT_DATA: TileInfoBlockText = {
  id: 12312353462, // comply with ts first - overwrite later
  type: "text",
  name: "[Optioneel] Materialen",
  data: "",
  placeholder: {
    template: "",
  },
};

const TILE_INFO_DROPDOWN_DATA: TileInfoBlockDropdown = {
  id: 123123, // comply with ts first - overwrite later
  type: "dropdown",
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
    id: 1,
    chapterId: 1,
    order: 1,
    name: "Tile 1",
    coverImage: "",
    state: "open",
    type: "regular",
    data: [
      // rows
      {
        id: 1,
        name: "Kennis",
        icon: "pencil",
        order: 1,
        columns: [
          // columns
          {
            id: 1,
            order: 1,
            blocks: [
              {
                id: 1,
                type: "text",
                icon: { template: "pencil" },
                name: "Beschrijving kennis",
                data: "test",
              },
            ],
          },
        ],
      },
      {
        id: 2,
        name: "Verwerking",
        icon: "pencil",
        order: 2,
        columns: [
          // columns
          {
            id: 2,
            order: 1,
            blocks: [
              {
                ...TILE_INFO_TEXT_DATA,
                id: 1,
              },
            ],
          },
          {
            id: 3,
            order: 2,
            blocks: [
              {
                ...TILE_INFO_TEXT_DATA,
                id: 2,
              },
              {
                ...TILE_INFO_DROPDOWN_DATA,
                id: 3,
              },
            ],
          },
        ],
      },
    ],
  },
];
