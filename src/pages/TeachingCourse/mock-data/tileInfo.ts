const _TILE_INFO_TEXT_DATA: TileInfoBlockText = {
  type: "text",
  level: 0, // Default level, should be overridden when used
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
  level: 0, // Default level, should be overridden when used
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
    // Unified children array with all blocks (including accordion blocks)
    children: [
      // Tile-level text block (level 0)
      {
        type: "text",
        level: 0,
        id: 9876,
        order: 0,
        icon: { template: "pencil" },
        name: "Direct text block",
        data: "This is a block directly at tile level",
      },
      // First accordion block (level 0 = tile level)
      {
        type: "accordion",
        level: 0,
        id: 1234231234,
        name: "Title 2762",
        icon: "eye",
        order: 1,
        children: [
          // Column layout inside accordion
          {
            type: "columnLayout",
            level: 0,
            id: 99913523459,
            order: 0,
            parentId: 1234231234,
            children: [
              // Left column block
              {
                type: "column",
                level: 0,
                id: 999135234590,
                order: 0,
                parentId: 99913523459,
                width: "1fr",
                children: [
                  {
                    type: "text",
                    level: 0,
                    id: 123345742,
                    order: 0,
                    parentId: 999135234590,
                    icon: { template: "pencil" },
                    name: "Title 3456",
                    data: "Description",
                  },
                ],
              },
              // Right column block
              {
                type: "column",
                level: 0,
                id: 999135234591,
                order: 1,
                parentId: 99913523459,
                width: "1fr",
                children: [
                  {
                    ...TILE_INFO_DROPDOWN_DATA,
                    level: 0,
                    id: 45678,
                    order: 0,
                    parentId: 999135234591,
                    name: "Title 5687",
                  },
                ],
              },
            ],
          },
        ],
      },
      // Second accordion block with blocks and column layout
      {
        type: "accordion",
        level: 0,
        id: 1234234,
        name: "Title 3465",
        icon: "eye",
        order: 2,
        children: [
          // Accordion-level text block
          {
            type: "text",
            level: 0,
            id: 1586,
            order: 0,
            parentId: 1234234,
            icon: { template: "pencil" },
            name: "Title 1234",
            data: "Description",
          },
          // Column layout
          {
            type: "columnLayout",
            level: 0,
            id: 9999,
            order: 1,
            parentId: 1234234,
            children: [
              // Left column block
              {
                type: "column",
                level: 0,
                id: 99990,
                order: 0,
                parentId: 9999,
                width: "1fr",
                children: [
                  {
                    type: "text",
                    level: 0,
                    id: 12342,
                    order: 0,
                    parentId: 99990,
                    icon: { template: "pencil" },
                    name: "Title 234",
                    data: "Description",
                  },
                  {
                    ...TILE_INFO_DROPDOWN_DATA,
                    level: 0,
                    id: 334573452345,
                    order: 1,
                    parentId: 99990,
                    name: "Title 3465098",
                  },
                ],
              },
              // Right column block
              {
                type: "column",
                level: 0,
                id: 99991,
                order: 1,
                parentId: 9999,
                width: "1fr",
                children: [
                  {
                    ...TILE_INFO_DROPDOWN_DATA,
                    level: 0,
                    id: 33457345,
                    order: 0,
                    parentId: 99991,
                    name: "Title 3465",
                  },
                ],
              },
            ],
          },
          // Example nested accordion (level 1) - demonstrates recursive nesting
          {
            type: "accordion",
            level: 1,
            id: 5555555,
            name: "Nested Accordion Example",
            icon: "folder",
            order: 2,
            parentId: 1234234,
            children: [
              {
                type: "text",
                level: 1,
                id: 7777777,
                order: 0,
                parentId: 5555555,
                icon: { template: "pencil" },
                name: "Nested Block",
                data: "This is nested inside another accordion",
              },
            ],
          },
        ],
      },
    ],
  },
];
