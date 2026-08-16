/**
 * react-select pieces for field-mapping menus inside dialogs.
 *
 * Portaled menus lose trackpad scroll to the dialog page scroll, and Radix
 * dismisses the menu on option mousedown (treats the portal as "outside").
 */
import {
	components,
	type GroupBase,
	type MenuListProps,
	type MenuProps,
	type OptionProps,
} from 'react-select';
import { ScrollableMenuList } from '../react-select-scrollable-menu-list';

export function MappingSelectMenuList<
	Option,
	IsMulti extends boolean = false,
>(props: MenuListProps<Option, IsMulti, GroupBase<Option>>) {
	return <ScrollableMenuList {...props} preventFocusSteal />;
}

export function MappingSelectMenu<
	Option,
	IsMulti extends boolean = false,
>(props: MenuProps<Option, IsMulti, GroupBase<Option>>) {
	const { innerProps, ...rest } = props;
	return (
		<components.Menu
			{...rest}
			innerProps={{
				...innerProps,
				onMouseDown: (event) => {
					// Keep focus in react-select so Radix Dialog does not steal
					// the click before the option is chosen.
					event.preventDefault();
					innerProps?.onMouseDown?.(event);
				},
				onWheel: (event) => {
					event.stopPropagation();
					innerProps?.onWheel?.(event);
				},
			}}
		/>
	);
}

export function MappingSelectOption<
	Option,
	IsMulti extends boolean = false,
>(props: OptionProps<Option, IsMulti, GroupBase<Option>>) {
	const { innerProps, ...rest } = props;
	return (
		<components.Option
			{...rest}
			innerProps={{
				...innerProps,
				onMouseDown: (event) => {
					event.preventDefault();
					event.stopPropagation();
					innerProps.onMouseDown?.(event);
				},
			}}
		/>
	);
}

export const mappingSelectComponents = {
	Menu: MappingSelectMenu,
	MenuList: MappingSelectMenuList,
	Option: MappingSelectOption,
};
