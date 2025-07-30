/**
 * external dependencies
 */
import { X } from 'lucide-react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
interface TagProps {
	label: string;
	onClose: () => void;
}

const Tag: React.FC<TagProps> = ({ label, onClose }) => {
	return (
		<div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-full bg-[#F4F4F4] text-[#333333]">
			<span>{label}</span>
			<Button
				onClick={onClose}
				className="hover:text-black focus:outline-none text-red-600 p-0 bg-transparent hover:bg-transparent shadow-none h-fit"
			>
				<X className="w-3 h-3" />
			</Button>
		</div>
	);
};

export default Tag;
