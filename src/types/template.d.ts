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
  old_id: number; // not used
  chapter: string; // not used
  isContentMenu: boolean; // in favor of `type`
  isTest: boolean; // in favor of `type`
  deleted: boolean; // do we need this?
  courseId: number; // shouldn't be necessary if we can infer from chapterId. // sub-project - better to do it at the end

  // New fields
  type: "regular" | "contentMenu" | "test"; // or undefined 🤔?
  subName?: string;
  workFormat: CMS_ENUMS<Workformat>[]; // enum stored in backend
  data: TileInfo[]; // only added on client, but on the API it's a separated table
};

type TileInfo = {
  id: number;
  order: number;
  icon: string;
  name: string; // maybe tiptap - we need to decide if it's always just bold
  data: TileInfoData[][]; // first array is vertically and the second horizontally?
  required: boolean;
};

type TileInfoData = {
  id: number;
  order: number;
  data: TileInfoBlock;
};

type TileInfoBlock =
  | TileInfoBlockHeading
  | TileInfoBlockText // might be omitted if tiptap is used, then it's just `paragraph`
  | TileInfoBlockParagraph
  | TileInfoBlockDropdown; // single value and multi-select (tags)?

type TileInfoBlockHeading = {
  id: number;
  icon?: string; // same for all types
  name: string;
  type: "heading";
};

type TileInfoPlaceholder = {
  template?: string;
  editor?: string;
  viewing?: string;
}; // we need to decide if the data is just for templating or also for the course

type TileInfoBlockText = {
  id: number;
  icon?: {
    template?: string;
    editor?: string;
    viewing?: string;
  }; // we need to decide if the data is just for templating or also for the course
  type: "text";
  name: string;
  data: string;
  placeholder?: TileInfoPlaceholder;
};

type TileInfoBlockParagraph = {
  id: number;
  type: "paragraph";
  name: string;
  data: Record<string, unknown>; // TipTap for sure
  placeholder?: TileInfoPlaceholder;
};

type TileInfoBlockDropdown = {
  id: number;
  type: "dropdown";
  name: string;
  placeholder?: TileInfoPlaceholder;
  options: {
    label: string;
    subLabel?: string;
    value: CMS_ENUMS<`${name}-${label}`>;
    selected?: boolean; // do they need this?
  }[];
};

// for workformat or select menu or any hardcoded option on this page(??)
type CMS_ENUMS = {
  id: number;
  type: string;
  name: string;
  // maybe extra column to avoid collision with existing values from somewhere else
};
