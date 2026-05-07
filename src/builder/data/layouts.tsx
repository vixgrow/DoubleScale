import { __ } from '@wordpress/i18n';

export const layoutsStyles = [
	{
		id: 'single-column',
		name: __('Single Column', 'doublescale'),
		width: [100],
		value: 'single-column',
	},
	{
		id: 'two-columns-equal',
		name: __('Two Columns', 'doublescale'),
		width: [50, 50],
		value: 'two-columns',
	},
	{
		id: 'two-columns-2-1',
		name: __('Two Columns', 'doublescale'),
		width: [67, 33],
		value: 'two-columns',
	},
	{
		id: 'two-columns-1-2',
		name: __('Two Columns', 'doublescale'),
		width: [33, 67],
		value: 'two-columns',
	},
	{
		id: 'three-columns',
		name: __('Three Columns', 'doublescale'),
		width: [33.33, 33.33, 33.34],
		value: 'three-columns',
	},
	{
		id: 'four-columns',
		name: __('Four Columns', 'doublescale'),
		width: [25, 25, 25, 25],
		value: 'four-columns',
	},
];
