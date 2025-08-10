import { __ } from '@wordpress/i18n';

export const layoutsStyles = [
	{
		name: __('Single Column', 'quillcrm'),
		number: [1],
		value: 'single-column',
	},
	{
		name: __('Two Columns', 'quillcrm'),
		number: [1, 1],
		value: 'two-columns',
	},
	{
		name: __('Two Columns', 'quillcrm'),
		number: [2, 1],
		value: 'two-columns',
	},
	{
		name: __('Two Columns', 'quillcrm'),
		number: [1, 2],
		value: 'two-columns',
	},
	{
		name: __('Three Columns', 'quillcrm'),
		number: [1, 1, 1],
		value: 'three-columns',
	},
	{
		name: __('Four Columns', 'quillcrm'),
		number: [1, 1, 1, 1],
		value: 'four-columns',
	},
];
