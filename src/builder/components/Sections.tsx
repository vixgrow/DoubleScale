import { blocksRegistry } from '../blocks/BlockRegister';
import TemplateCard from './TemplateCard';

const Sections = () => {
	return (
		<div
			className="py-4 grid gap-4"
			style={{
				gridTemplateColumns: 'auto auto',
			}}
		>
			{Object.entries(blocksRegistry).map(([key, block]) => (
				<TemplateCard key={key} item={block} type="element" />
			))}
		</div>
	);
};

export default Sections;
