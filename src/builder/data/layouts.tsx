import { __ } from '@wordpress/i18n';

export const layoutsStyles = [
	{
		id: 'single-column',
		name: __('Single Column', 'quillcrm'),
		number: [1],
		value: 'single-column',
	},
	{
		id: 'two-columns-equal',
		name: __('Two Columns', 'quillcrm'),
		number: [1, 1],
		value: 'two-columns',
	},
	{
		id: 'two-columns-2-1',
		name: __('Two Columns', 'quillcrm'),
		number: [2, 1],
		value: 'two-columns',
	},
	{
		id: 'two-columns-1-2',
		name: __('Two Columns', 'quillcrm'),
		number: [1, 2],
		value: 'two-columns',
	},
	{
		id: 'three-columns',
		name: __('Three Columns', 'quillcrm'),
		number: [1, 1, 1],
		value: 'three-columns',
	},
	{
		id: 'four-columns',
		name: __('Four Columns', 'quillcrm'),
		number: [1, 1, 1, 1],
		value: 'four-columns',
	},
];
