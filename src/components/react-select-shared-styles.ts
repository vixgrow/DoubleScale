/**
 * Shared react-select control chrome — matches shadcn Input focus (brandPrimary / --border).
 * Without this, react-select falls back to its default blue (#2684FF) on hover/focus.
 */

export function reactSelectControl(
	base: Record<string, unknown>,
	state: { isFocused: boolean }
): Record<string, unknown> {
	const borderIdle = 'hsl(var(--border))';
	const borderFocus = '#3A3A99';

	return {
		...base,
		minHeight: 40,
		height: 40,
		borderRadius: 8,
		borderWidth: 1,
		borderStyle: 'solid',
		borderColor: state.isFocused ? borderFocus : borderIdle,
		boxShadow: state.isFocused
			? '0 0 0 2px rgba(58, 58, 153, 0.2)'
			: 'none',
		cursor: 'pointer',
		'&:hover': {
			borderColor: state.isFocused ? borderFocus : borderIdle,
		},
	};
}
