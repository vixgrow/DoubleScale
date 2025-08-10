import TemplateCard from '../../components/TemplateCard';
import { layoutsStyles } from '../../data/layouts';

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
