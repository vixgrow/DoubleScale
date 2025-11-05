/**
 * external dependencies
 */
import { v4 as uuidv4 } from 'uuid';
/**
 * internal dependencies
 */
import { blocksRegistry } from '../blocks/BlockRegister';
import TemplateCard from './TemplateCard';
import { EmailBlock } from '../../stores/email-builder/types';

const Sections = () => {
	const handleBlockDrop = (blockType: string) => {
		const newBlock: EmailBlock = {
			id: uuidv4(),
			type: blockType as any,
			props: blocksRegistry[blockType]?.defaultProps || {},
		};
		return newBlock;
	};

	return (
		<div
			className="py-4 grid gap-4"
			style={{
				gridTemplateColumns: '1fr 1fr',
				gridAutoRows: '120px', // Fixed height for all rows
			}}
		>
			{Object.entries(blocksRegistry)
				.filter(([key]) => key !== 'preheader')
				.map(([key, block]) => (
					<TemplateCard
						key={key}
						item={block}
						type="element"
						blockType={key}
						onCreateBlock={() => handleBlockDrop(key)}
					/>
				))}
		</div>
	);
};

export default Sections;
