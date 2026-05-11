import { Plus as PlusOutlined } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoDataComponentProps {
	setOpen: (open: boolean) => void;
	header: string;
	description: string;
	buttonText: string;
	icon: React.ReactNode;
}

const NoDataComponent: React.FC<NoDataComponentProps> = ({
	setOpen,
	header,
	description,
	buttonText,
	icon,
}) => {
	return (
        <div className="flex flex-col gap-4 justify-center items-center mt-4 h-full border border-solid borderColor-[#DEDEDE] rounded-xl p-4 my-6 py-6 bg-[#FDFDFD]">
            <div className="w-36 h-36 flex justify-center items-center rounded-full bg-[#F4F5FA] border border-solid borderColor-[#E1E2E9]">
				{icon}
			</div>
            <p className="text-xl font-medium my-1 text-color-primary-text">
				{header}
			</p>
            <p>{description}</p>
            <Button
				className="bg-primary text-white"
				onClick={() => {
					setOpen(true);
				}}
				variant='default'
				size='lg'
			>
				<PlusOutlined />
				{buttonText}
			</Button>
        </div>
    );
};

export default NoDataComponent;
