import { useDispatch } from '@wordpress/data';
import { blocksRegistry } from '../blocks/BlockRegister';
import TemplateCard from './TemplateCard';
import { STORE_KEY } from '../../stores/email-builder/constants';
import { EmailBlock } from '../../stores/email-builder/types';
import { v4 as uuidv4 } from 'uuid';

const Sections = () => {
	const dispatch = useDispatch();

	const handleBlockDrop = (blockType: string) => {
		// This would be called when a block is dropped on the canvas
		// For now, we'll create a default block
		const newBlock: EmailBlock = {
			id: uuidv4(),
			type: blockType as any,
			props: blocksRegistry[blockType]?.defaultProps || {},
		};

		// Note: In a full implementation, you'd need to handle the drop target coordinates
		// For now, we'll just add to the first available column
		console.log('Block ready to be dropped:', newBlock);
		return newBlock;
	};

	return (
		<div
			className="py-4 grid gap-4"
			style={{
				gridTemplateColumns: '50% 50%',
			}}
		>
			{Object.entries(blocksRegistry).map(([key, block]) => (
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
