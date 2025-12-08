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

// Base type for all TileInfo blocks - contains common fields
type TileInfoBlockBase = {
  type: string;
  level: number; // Dynamic level: 0 = tile level, 1+ = nested levels
  id: number;
  order: number;
  parentId?: number; // Optional: References parent container ID (undefined for tile-level)
};

// Accordion/Collapse block - A container block that can hold other blocks (including nested accordions)
type TileInfoBlockAccordion = TileInfoBlockBase & {
  type: "accordion";
  icon?: string;
  name: string; // Title/header of the accordion
  children: TileInfoBlock[]; // Recursive: can contain any blocks including nested accordions!
};

// Column layout - A container for column blocks
type TileInfoColumnLayout = TileInfoBlockBase & {
  type: "columnLayout";
  parentId: number; // References parent accordion.id (required for layouts)
  children: TileInfoBlockColumn[]; // Contains column blocks (fully recursive!)
};

// Column block - A single column within a column layout
type TileInfoBlockColumn = TileInfoBlockBase & {
  type: "column";
  parentId: number; // References parent columnLayout.id (required for columns)
  width?: string; // Optional: CSS width/flex value (e.g., "1fr", "2fr", "300px")
  children: TileInfoBlock[]; // Recursive: can contain any blocks including accordions!
};

type TileInfoSelectOption = {
  label: string;
  subLabel?: string;
  value: CMS_ENUMS<`${name}-${label}`>;
  selected?: boolean; // do they need this?
  disabled?: boolean;
};

type TileInfoBlockText = TileInfoBlockBase & {
  type: "text";
  name: string;
  data: string;
};

type TileInfoBlockParagraph = TileInfoBlockBase & {
  type: "paragraph";
  name: string;
  data: Record<string, unknown>; // TipTap for sure
};

// TileInfo - Reusable object types
type TileInfoBlockHeading = TileInfoBlockBase & {
  type: "heading";
  icon?: string; // Optional icon for all heading levels (typically used for h2-h6)
  name: string; // Heading text content
  headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; // HTML heading level (defaults to h2)
  // Heading level guidelines (within a SINGLE tile):
  // - h1: Main tile title (ONE per tile maximum, usually no icon)
  //       Multiple tiles on the same page can each have their own h1
  //       Each tile is treated as an independent content unit
  // - h2: Major section heading (default, can have icon)
  //       Used for accordion headers and main sections within the tile
  // - h3: Subsection heading (can have icon, smaller than h2)
  //       Nested content within h2 sections
  // - h4: Minor heading (nested subsections)
  // - h5-h6: Deep nested headings (rarely used in practice)
};

type TileInfoBlockDropdown = TileInfoBlockBase & {
  type: "dropdown";
  name: string;
  options: TileInfoSelectOption[];
};

type TileInfoBlockTag = TileInfoBlockBase & {
  type: "tag";
  name: string;
  tagType: string; // Category dropdown (e.g., "kerndoel", "begrippen")
  tags: string[]; // List of tag values
};

type TileInfoBlockDivider = TileInfoBlockBase & {
  type: "divider";
};

type TileInfoBlockComment = TileInfoBlockBase & {
  type: "comment";
  name: string;
  commentType: "info" | "warning" | "error"; // Type determines icon and color
  data: Record<string, unknown>; // TipTap content
};

type TileInfoBlock =
  | TileInfoBlockAccordion // Collapsible container block
  | TileInfoColumnLayout // Layout container for columns
  | TileInfoBlockColumn // Individual column block
  | TileInfoBlockHeading // Heading block
  | TileInfoBlockText // Text block (might be omitted if tiptap is used)
  | TileInfoBlockParagraph // Paragraph block (TipTap)
  | TileInfoBlockDropdown // Dropdown/select block
  | TileInfoBlockTag // Tag block
  | TileInfoBlockDivider // Divider block (decorative separator)
  | TileInfoBlockComment; // Comment block (info/warning/error with TipTap editor)

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
