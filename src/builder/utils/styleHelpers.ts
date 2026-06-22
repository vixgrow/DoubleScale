/**
 * Style Helpers
 * 
 * Shared utilities for common styling patterns across block renderers
 */

import { CSSProperties } from 'react';

/**
 * Alignment styles configuration
 */
export const ALIGNMENT_STYLES: Record<string, CSSProperties> = {
  left: { marginLeft: 0, marginRight: 'auto' },
  center: { marginLeft: 'auto', marginRight: 'auto' },
  right: { marginLeft: 'auto', marginRight: 0 },
  full: { width: '100%' },
};

/**
 * Text alignment mapping
 */
export const TEXT_ALIGNMENT_MAP: Record<string, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
  full: 'center',
};

/**
 * Heading configuration for text elements
 */
interface HeadingConfig {
  element: string;
}

export const HEADING_CONFIG: Record<string, HeadingConfig> = {
  h1: { element: 'h1' },
  h2: { element: 'h2' },
  h3: { element: 'h3' },
  small: { element: 'small' },
  p: { element: 'p' },
};

/**
 * Default font size (px) when the user picks a text style in the email builder.
 * Matches Pro block editors that reset Font Size on style change.
 */
export const TEXT_STYLE_DEFAULT_FONT_SIZES: Record<string, number> = {
  h1: 36,
  h2: 30,
  h3: 24,
  p: 16,
  small: 14,
};

export const getDefaultFontSizeForStyle = (style: string): number => {
  return TEXT_STYLE_DEFAULT_FONT_SIZES[style] ?? TEXT_STYLE_DEFAULT_FONT_SIZES.p;
};

/**
 * Get alignment styles for a given alignment value
 */
export const getAlignmentStyle = (align: string): CSSProperties => {
  return ALIGNMENT_STYLES[align] || ALIGNMENT_STYLES.center;
};

/**
 * Get text alignment value
 */
export const getTextAlignment = (align: string): string => {
  return TEXT_ALIGNMENT_MAP[align] || 'center';
};

/**
 * Get heading configuration for a given style
 */
export const getHeadingConfig = (style: string): HeadingConfig => {
  return HEADING_CONFIG[style] || HEADING_CONFIG.p;
};

/**
 * Get border style string
 */
export const getBorderStyle = (
  width: number | string,
  style: string,
  color: string
): string => {
  // Ensure width always has 'px' unit
  let borderWidth: string;
  if (typeof width === 'number') {
    borderWidth = `${width}px`;
  } else if (width.includes('px') || width.includes('em') || width.includes('rem') || width.includes('%')) {
    // Already has a unit
    borderWidth = width;
  } else {
    // String number without unit, add 'px'
    borderWidth = `${width}px`;
  }
  return `${borderWidth} ${style} ${color}`;
};

/**
 * Flex justify content mapping for alignment
 */
const FLEX_JUSTIFY_MAP: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
};

/**
 * Get flex justify class for alignment
 */
export const getFlexJustify = (align: string): string => {
  return FLEX_JUSTIFY_MAP[align] || 'justify-center';
};

