/**
 * Shared react-select styles for field-mapping grids (import + form integration).
 */
import type { GroupBase, StylesConfig } from 'react-select';
import { reactSelectControl } from '../react-select-shared-styles';

export function getMappingSelectStyles(): StylesConfig<
	unknown,
	false,
	GroupBase<unknown>
> {
	return {
		container: (base) => ({
			...base,
			width: '100%',
			maxWidth: '100%',
			minWidth: 0,
		}),
		control: (base, state) => ({
			...reactSelectControl(base as Record<string, unknown>, state),
			backgroundColor: '#ffffff',
		}),
		valueContainer: (base) => ({
			...base,
			height: 40,
			paddingLeft: 12,
			paddingRight: 8,
		}),
		input: (base) => ({
			...base,
			margin: 0,
			padding: 0,
			color: '#29292E',
			outline: 'none',
		}),
		placeholder: (base) => ({
			...base,
			color: '#6B6C76',
			fontSize: 14,
		}),
		singleValue: (base) => ({
			...base,
			color: '#29292E',
			fontSize: 14,
		}),
		indicatorsContainer: (base) => ({
			...base,
			height: 40,
			paddingRight: 4,
		}),
		dropdownIndicator: (base) => ({
			...base,
			padding: '0 10px',
			color: '#6B6C76',
		}),
		indicatorSeparator: () => ({
			display: 'none',
		}),
		menu: (base) => ({
			...base,
			borderRadius: 8,
			border: '1px solid #ECEEF2',
			boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
			overflow: 'visible',
			zIndex: 160010,
		}),
		menuPortal: (base) => ({
			...base,
			zIndex: 160010,
		}),
		menuList: (base) => ({
			...base,
			paddingTop: 4,
			paddingBottom: 4,
		}),
		option: (base, state) => ({
			...base,
			fontSize: 14,
			cursor: 'pointer',
			padding: '10px 12px',
			backgroundColor: state.isFocused
				? 'rgba(58, 58, 153, 0.08)'
				: '#ffffff',
			color: '#29292E',
		}),
	};
}
