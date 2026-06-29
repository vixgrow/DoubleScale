/**
 * Menu list that keeps mouse-wheel scroll inside a react-select dropdown.
 *
 * Portaled menus (e.g. tags/lists in the automation workflow sidebar over
 * React Flow) otherwise bubble wheel events to scrollable parents or the
 * canvas zoom handler — only the scrollbar thumb still works.
 */
import { components, type GroupBase, type MenuListProps } from 'react-select';

export function ScrollableMenuList<
	Option,
	IsMulti extends boolean = false,
>(
	props: MenuListProps<Option, IsMulti, GroupBase<Option>> & {
		preventFocusSteal?: boolean;
	}
) {
	const { innerProps, preventFocusSteal, ...rest } = props;
	return (
		<components.MenuList
			{...rest}
			innerProps={{
				...innerProps,
				onMouseDown: (event) => {
					if (preventFocusSteal) {
						// Keep focus inside react-select so Radix dialog does not
						// swallow the click before the option is selected.
						event.preventDefault();
						event.stopPropagation();
					}
					innerProps.onMouseDown?.(event);
				},
				onWheel: (event) => {
					event.stopPropagation();
					innerProps.onWheel?.(event);
				},
			}}
		/>
	);
}
