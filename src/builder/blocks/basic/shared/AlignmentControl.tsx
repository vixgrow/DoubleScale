/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import {
	AlignLeftIcon,
	AlignCenterIcon,
	AlignRightIcon,
} from '@doublescale/components';
import { cn } from '@/lib/utils';

export interface AlignmentControlProps {
	value: 'left' | 'center' | 'right' | 'full';
	onChange: (value: 'left' | 'center' | 'right' | 'full') => void;
	label?: string;
	includeFull?: boolean;
}

const active = 'border border-white';
const iconBtn =
	'size-8 w-full cursor-pointer px-5 py-3 h-10 text-white transition-colors hover:bg-white/10 flex items-center justify-center';

export const AlignmentControl: React.FC<AlignmentControlProps> = ({
	value,
	onChange,
	label = __('Alignment on desktop', 'doublescale'),
	includeFull = false,
}) => {
	return (
		<div className="flex flex-col gap-2 text-white">
			<label className="text-sm text-white">{label}</label>
			<div
				className="flex h-10 items-center justify-between rounded-lg"
				style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
			>
				<div
					className={cn(iconBtn, 'rounded-lg', value === 'left' && active)}
					onClick={() => onChange('left')}
				>
					<AlignLeftIcon width={22} height={22} />
				</div>
				<div
					className={cn(iconBtn, 'rounded-lg', value === 'center' && active)}
					onClick={() => onChange('center')}
				>
					<AlignCenterIcon width={22} height={22} />
				</div>
				<div
					className={cn(iconBtn, 'rounded-lg', value === 'right' && active)}
					onClick={() => onChange('right')}
				>
					<AlignRightIcon width={22} height={22} />
				</div>
				{includeFull && (
					<div
						className={cn(
							iconBtn,
							'rounded-lg text-sm font-medium',
							value === 'full' && active
						)}
						onClick={() => onChange('full')}
					>
						{__('Full', 'doublescale')}
					</div>
				)}
			</div>
		</div>
	);
};
