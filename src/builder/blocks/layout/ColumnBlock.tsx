import { __ } from '@wordpress/i18n';
import TemplateCard from '../../components/TemplateCard';

const layoutsStyles = [
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

const ColumnBlock = () => {
	return (
		<div className="flex flex-col gap-4 items-center justify-center">
			{layoutsStyles.map((layout) => (
				<TemplateCard item={layout} type="layout" />
			))}
		</div>
	);
};

export default ColumnBlock;
