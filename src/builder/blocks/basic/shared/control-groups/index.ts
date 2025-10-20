/**
 * Control Groups Index
 * 
 * Provides organized access to all shared controls grouped by functionality.
 * This improves code organization and makes imports more semantic.
 * 
 * @example
 * // Old way (many individual imports)
 * import { AlignmentControl, PaddingControl, ColorPickerControl, FontControl } from '../../shared';
 * 
 * // New way (grouped imports)
 * import * as LayoutControls from '../../shared/control-groups/layout';
 * import * as StyleControls from '../../shared/control-groups/style';
 * 
 * // Usage
 * <LayoutControls.AlignmentControl ... />
 * <StyleControls.ColorPickerControl ... />
 */

export * as LayoutControls from './layout';
export * as MediaControls from './media';
export * as StyleControls from './style';
export * as TypographyControls from './typography';

// Also re-export everything individually for backward compatibility
export * from './layout';
export * from './media';
export * from './style';
export * from './typography';

