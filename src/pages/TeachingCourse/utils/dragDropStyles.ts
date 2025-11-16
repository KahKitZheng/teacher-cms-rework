import { OPACITY, COLOR_OPACITY, DRAG_STYLES } from "./dragDropConstants";

/**
 * Generate a semi-transparent color using CSS color-mix
 */
export function getTransparentColor(
  color: string,
  opacity: number
): string {
  return `color-mix(in srgb, ${color} ${opacity}%, transparent)`;
}

/**
 * Get opacity for block content based on drag state
 */
export function getBlockContentOpacity(
  isDragging: boolean,
  activeBlockId: number | null | undefined,
  blockId: number,
  isHovered: boolean
): number {
  if (isDragging) return OPACITY.HIDDEN;
  if (activeBlockId && activeBlockId !== blockId && !isHovered)
    return OPACITY.DIMMED;
  return OPACITY.NORMAL;
}

/**
 * Get opacity for row based on drag state
 */
export function getRowOpacity(
  isDragging: boolean,
  activeId: number | null | undefined,
  rowId: number
): number {
  if (isDragging) return OPACITY.HIDDEN;
  if (activeId && activeId !== rowId) return OPACITY.DIMMED_ROW;
  return OPACITY.NORMAL;
}

/**
 * Get pointer events style based on drag state
 */
export function getPointerEvents(
  isDragging: boolean,
  activeBlockId: number | null | undefined,
  isDragOverlay: boolean
): "none" | "auto" {
  return (isDragging || activeBlockId) && !isDragOverlay ? "none" : "auto";
}

/**
 * Get block drag styles
 */
export function getBlockDragStyles(
  activeBlockId: number | null | undefined,
  blockId: number,
  isHovered: boolean
): React.CSSProperties {
  const styles: React.CSSProperties = {};

  // Show all possible drop targets when dragging
  if (activeBlockId && activeBlockId !== blockId) {
    styles.outline = `1px dashed ${getTransparentColor(
      "var(--primary-color)",
      COLOR_OPACITY.BORDER
    )}`;
  }

  // Stronger visual feedback when hovering
  if (isHovered && activeBlockId && activeBlockId !== blockId) {
    styles.outline = "2px solid var(--primary-color)";
    styles.backgroundColor = getTransparentColor(
      "var(--primary-color)",
      COLOR_OPACITY.STRONG
    );
  }

  return styles;
}

/**
 * Get column drop zone styles
 */
export function getColumnDropZoneStyles(
  activeBlockId: number | null | undefined,
  isHovered: boolean
): React.CSSProperties {
  const styles: React.CSSProperties = {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    minHeight: "100px",
    borderRadius: "8px",
    transition: `background-color ${DRAG_STYLES.TRANSITION}, outline ${DRAG_STYLES.TRANSITION}`,
  };

  // Show all possible dropzones when dragging
  if (activeBlockId) {
    styles.backgroundColor = getTransparentColor(
      "var(--primary-color)",
      COLOR_OPACITY.LIGHT
    );
    styles.outline = `1px dashed ${getTransparentColor(
      "var(--primary-color)",
      COLOR_OPACITY.BORDER
    )}`;
  }

  // Stronger visual feedback when hovering
  if (isHovered && activeBlockId) {
    styles.outline = "2px dashed var(--primary-color)";
    styles.backgroundColor = getTransparentColor(
      "var(--primary-color)",
      COLOR_OPACITY.MEDIUM
    );
  }

  return styles;
}

/**
 * Get drag overlay styles
 */
export function getDragOverlayStyles(
  isDragOverlay: boolean
): React.CSSProperties {
  if (!isDragOverlay) return {};

  return {
    border: "1px solid var(--primary-color)",
    borderRadius: "8px",
  };
}

/**
 * Get icon color based on drag overlay state
 */
export function getIconColor(isDragOverlay: boolean): string {
  return isDragOverlay ? "var(--primary-color)" : "var(--blue-gray)";
}

/**
 * Get effective border style (solid when dragging, otherwise original)
 */
export function getEffectiveBorderStyle(
  isDragOverlay: boolean,
  borderStyle: "default" | "dashed"
): "default" | "dashed" {
  return isDragOverlay ? "default" : borderStyle;
}
