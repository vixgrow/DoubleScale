/**
 * external dependencies
 */
import { v4 as uuidv4 } from 'uuid';
/**
 * internal dependencies
 */
import { useRegisteredBlocks } from '@/stores/blocks-registry';
import { getDraggableBlocks } from '../blocks/blockRegistryUtils';
import TemplateCard from './TemplateCard';
import { EmailBlock } from '../../stores/email-builder/types';

const Sections = () => {
	const blocksRegistry = useRegisteredBlocks();
	const draggableBlocks = getDraggableBlocks(blocksRegistry);

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
				gridAutoRows: '115px', // Fixed height for all rows
			}}
		>
			{Object.entries(draggableBlocks).map(([key, block]) => (
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
