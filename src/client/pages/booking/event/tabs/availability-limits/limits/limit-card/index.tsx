/**
 * Internal dependencies
 */
import type { LimitBaseProps } from '@/types/booking';

import { Switch } from '@/components/ui/switch';

interface LimitCardProps extends LimitBaseProps {
	title: string;
	description: string;
	type: 'frequency' | 'duration';
}

const LimitCard: React.FC<LimitCardProps> = ({
	limits,
	handleChange,
	title,
	description,
	type,
}) => {
	return (
        <div className='flex items-center justify-between px-[20px] mb-4'>
            <div className='flex flex-col gap-[1px]'>
				<div className="text-[#09090B] text-[20px] font-semibold">
					{title}
				</div>
				<div className="text-[#71717A] text-[14px]">{description}</div>
			</div>
            <Switch
				checked={limits[type].enable}
				onCheckedChange={(checked) => handleChange(type, 'enable', checked)}
				className={
					limits[type].enable ? 'bg-primary' : 'bg-gray-400'
				}
			/>
        </div>
    );
};

export default LimitCard;
