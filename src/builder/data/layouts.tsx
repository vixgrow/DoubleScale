import { __ } from '@wordpress/i18n';

export const layoutsStyles = [
	{
		id: 'single-column',
		name: __('Single Column', 'quillcrm'),
		width: [100],
		value: 'single-column',
	},
	{
		id: 'two-columns-equal',
		name: __('Two Columns', 'quillcrm'),
		width: [50, 50],
		value: 'two-columns',
	},
	{
		id: 'two-columns-2-1',
		name: __('Two Columns', 'quillcrm'),
		width: [67, 33],
		value: 'two-columns',
	},
	{
		id: 'two-columns-1-2',
		name: __('Two Columns', 'quillcrm'),
		width: [33, 67],
		value: 'two-columns',
	},
	{
		id: 'three-columns',
		name: __('Three Columns', 'quillcrm'),
		width: [33.33, 33.33, 33.34],
		value: 'three-columns',
	},
	{
		id: 'four-columns',
		name: __('Four Columns', 'quillcrm'),
		width: [25, 25, 25, 25],
		value: 'four-columns',
	},
];
