// we need to decide if the data is just for templating or also for the course

type Chapter = {
  id: number;
  courseId: number;
  order: number;
  name: string;
  tiles: Tile[];

  // New fields
  options: {
    label_visible: boolean;
  };
  description: string;
  subName?: string;
};

type Tile = {
  id: number;
  chapterId: number;
  order: number;
  name: string;
  coverImage: string;
  state: "open" | "locked" | "invisible";

  // Deprecated fields
  // old_id: number; // not used
  // chapter: string; // not used
  // isContentMenu: boolean; // in favor of `type`
  // isTest: boolean; // in favor of `type`
  // deleted: boolean; // do we need this?
  // courseId: number; // shouldn't be necessary if we can infer from chapterId. // sub-project - better to do it at the end

  // New fields
  type: "regular" | "contentMenu" | "test"; // or undefined 🤔?
  subName?: string;
  blocks: TileInfoBlock[]; // Tile-level blocks (separated from rows)
  rows: TileInfoRow[]; // Rows (separated from blocks)
  // workFormat: CMS_ENUMS<Workformat>[]; // enum stored in backend // maybe unused
};

/**
 * TILE_INFO
 */
type TileInfoRow = {
  type: "row";
  level: "tile";
  id: number;
  order: number;
  icon: string;
  name: string; // maybe tiptap - we need to decide if it's always just bold
  blocks: TileInfoBlock[]; // Row-level blocks (separated from layouts)
  layouts: TileInfoColumnLayout[]; // Column layouts (separated from blocks)
};

type TileInfoColumnLayout = {
  type: "columnLayout";
  level: "row";
  id: number;
  order: number;
  parentId: number; // References row.id
  leftColumn: TileInfoBlock[]; // Left column blocks
  rightColumn: TileInfoBlock[]; // Right column blocks
};

// DEPRECATED: TileInfoColumn is no longer used.
// Column layouts now directly have leftColumn and rightColumn arrays.
// Kept for backwards compatibility during migration.
type TileInfoColumn = {
  id: number;
  order: number;
  blocks: TileInfoBlock[];
  // width: string  // i.e. 2fr - need to build a dedicated UI for this though
};

type TileInfoBlock =
  | TileInfoBlockHeading
  | TileInfoBlockText // might be omitted if tiptap is used, then it's just `paragraph`
  | TileInfoBlockParagraph
  | TileInfoBlockDropdown; // single value and multi-select (tags)?

type TileInfoSelectOption = {
  label: string;
  subLabel?: string;
  value: CMS_ENUMS<`${name}-${label}`>;
  selected?: boolean; // do they need this?
  disabled?: boolean;
};

type TileInfoBlockText = {
  type: "text";
  level: "tile" | "row" | "column";
  id: number;
  order: number;
  parentId?: number; // Optional: References parent row/layout ID (undefined for tile-level)
  columnSide?: "left" | "right"; // Optional: Only for column-level blocks
  icon?: {
    template?: string;
    editor?: string;
    viewing?: string;
  }; // we need to decide if the data is just for templating or also for the course
  name: string;
  data: string;
  placeholder?: TileInfoPlaceholder;
};

type TileInfoBlockParagraph = {
  type: "paragraph";
  level: "tile" | "row" | "column";
  id: number;
  order: number;
  parentId?: number; // Optional: References parent row/layout ID (undefined for tile-level)
  columnSide?: "left" | "right"; // Optional: Only for column-level blocks
  name: string;
  data: Record<string, unknown>; // TipTap for sure
  placeholder?: TileInfoPlaceholder;
};

type TileInfoBlockDropdown = {
  type: "dropdown";
  level: "tile" | "row" | "column";
  id: number;
  order: number;
  parentId?: number; // Optional: References parent row/layout ID (undefined for tile-level)
  columnSide?: "left" | "right"; // Optional: Only for column-level blocks
  name: string;
  placeholder?: TileInfoPlaceholder; // not used in template and editor, maybe only viewing?
  options: TileInfoSelectOption[];
};

// TileInfo - Reusable object types
type TileInfoBlockHeading = {
  type: "heading";
  level: "tile" | "row" | "column";
  id: number;
  order: number;
  parentId?: number; // Optional: References parent row/layout ID (undefined for tile-level)
  columnSide?: "left" | "right"; // Optional: Only for column-level blocks
  icon?: string; // same for all types
  name: string;
};

type TileInfoPlaceholder = {
  template?: string;
  editor?: string;
  viewing?: string;
}; // we need to decide if the data is just for templating or also for the course

/**
 *  ENUMS
 */
// for workformat or select menu or any hardcoded option on this page(??)
type CMS_ENUMS = {
  id: number;
  type: string;
  name: string;
  // maybe extra column to avoid collision with existing values from somewhere else
};
