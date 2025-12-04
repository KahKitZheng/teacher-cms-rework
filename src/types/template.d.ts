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
  children: TileInfoBlock[]; // Unified array for recursive nesting (includes accordion blocks)
  // workFormat: CMS_ENUMS<Workformat>[]; // enum stored in backend // maybe unused
};

/**
 * TILE_INFO BLOCKS
 */

// Accordion/Collapse block - A container block that can hold other blocks (including nested accordions)
type TileInfoBlockAccordion = {
  type: "accordion";
  level: number; // Dynamic level: 0 = tile level, 1+ = nested levels
  id: number;
  order: number;
  parentId?: number; // Optional: References parent accordion ID (undefined for tile-level)
};

// Accordion/Collapse block - A container block that can hold other blocks (including nested accordions)
type TileInfoBlockAccordion = TileInfoBlockBase & {
  type: "accordion";
  icon?: string;
  name: string; // Title/header of the accordion
  children: TileInfoBlock[]; // Recursive: can contain any blocks including nested accordions!
};

// Column layout - A container for column blocks
type TileInfoColumnLayout = {
  type: "columnLayout";
  level: number; // Same level as parent accordion
  id: number;
  order: number;
  parentId: number; // References parent accordion.id
  children: TileInfoBlockColumn[]; // Contains column blocks (fully recursive!)
};

// Column block - A single column within a column layout
type TileInfoBlockColumn = {
  type: "column";
  level: number; // Same level as parent layout
  id: number;
  order: number; // Used for column ordering (0 = first column, 1 = second, etc.)
  parentId: number; // References parent columnLayout.id
  width?: string; // Optional: CSS width/flex value (e.g., "1fr", "2fr", "300px")
  children: TileInfoBlock[]; // Recursive: can contain any blocks including accordions!
};


type TileInfoBlock =
  | TileInfoBlockAccordion  // Collapsible container block
  | TileInfoColumnLayout    // Layout container for columns
  | TileInfoBlockColumn     // Individual column block
  | TileInfoBlockHeading    // Heading block
  | TileInfoBlockText       // Text block (might be omitted if tiptap is used)
  | TileInfoBlockParagraph  // Paragraph block (TipTap)
  | TileInfoBlockDropdown;  // Dropdown/select block

type TileInfoSelectOption = {
  label: string;
  subLabel?: string;
  value: CMS_ENUMS<`${name}-${label}`>;
  selected?: boolean; // do they need this?
  disabled?: boolean;
};

type TileInfoBlockText = {
  type: "text";
  level: number; // Dynamic level: 0 = tile, 1+ = row level, column blocks match parent row level
  id: number;
  order: number;
  parentId?: number; // Optional: References parent container ID (undefined for tile-level)
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
  level: number; // Dynamic level: 0 = tile, 1+ = row level, column blocks match parent row level
  id: number;
  order: number;
  parentId?: number; // Optional: References parent row/layout ID (undefined for tile-level)
  name: string;
  data: Record<string, unknown>; // TipTap for sure
  placeholder?: TileInfoPlaceholder;
};

type TileInfoBlockDropdown = {
  type: "dropdown";
  level: number; // Dynamic level: 0 = tile, 1+ = row level, column blocks match parent row level
  id: number;
  order: number;
  parentId?: number; // Optional: References parent row/layout ID (undefined for tile-level)
  name: string;
  placeholder?: TileInfoPlaceholder; // not used in template and editor, maybe only viewing?
  options: TileInfoSelectOption[];
};

// TileInfo - Reusable object types
type TileInfoBlockHeading = {
  type: "heading";
  level: number; // Dynamic level: 0 = tile, 1+ = row level, column blocks match parent row level
  id: number;
  order: number;
  parentId?: number; // Optional: References parent row/layout ID (undefined for tile-level)
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
