/**
 * Constants for drag and drop styling and behavior
 */

// Transition durations (in ms)
export const TRANSITION_DURATION = 150;

// Opacity values during drag operations
export const OPACITY = {
  HIDDEN: 0, // Dragged item (hidden because shown in overlay)
  DIMMED: 0.5, // Other blocks during drag
  DIMMED_ROW: 0.25, // Other rows during drag
  NORMAL: 1, // Normal state
} as const;

// Color opacity values (percentage)
export const COLOR_OPACITY = {
  LIGHT: 6, // Light background for all drop zones
  MEDIUM: 12, // Medium background for hovered drop zone
  STRONG: 25, // Strong background for hovered block
  BORDER: 31, // Border opacity for drop zones
} as const;

// Styling values
export const DRAG_STYLES = {
  TRANSITION: `${TRANSITION_DURATION}ms ease-in-out`,
  MIN_OVERLAY_WIDTH: 200, // Minimum width for drag overlay (in px)
  ACTIVATION_DISTANCE: 8, // Distance before drag starts (in px)
} as const;

// Element selector patterns
export const SELECTORS = {
  COLUMN_PREFIX: "column-",
  BLOCK_PREFIX: "block-",
  ALL_COLUMNS: '[id^="column-"]',
  ALL_IDS: "[id]",
  EXCLUDE_COLUMNS: ':not([id^="column-"])',
  EXCLUDE_BLOCKS: ':not([id^="block-"])',
} as const;

// Regular expressions
export const REGEX = {
  NUMERIC_ID: /^\d+$/,
} as const;

// Drag type identifiers
export const DRAG_TYPE = {
  ROW: "row",
  BLOCK: "block",
  COLUMN: "column",
} as const;
