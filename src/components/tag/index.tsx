import { X } from 'lucide-react';

interface TagProps {
	label: string;
	onClose: () => void;
}

const Tag: React.FC<TagProps> = ({ label, onClose }) => {
	return (
		<div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-full bg-[#F4F4F4] text-[#333333]">
			<span>{label}</span>
			<button
				onClick={onClose}
				className="hover:text-black focus:outline-none text-red-600"
			>
				<X className="w-3 h-3" />
			</button>
		</div>
	);
};

export default Tag;
