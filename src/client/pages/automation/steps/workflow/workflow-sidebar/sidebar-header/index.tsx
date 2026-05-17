/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { X } from 'lucide-react';
/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { XIcon } from '@doublescale/components';
import CloseIcon from '@doublescale/shared/icons/close';

interface SidebarHeaderProps {
	title: string;
	onClose: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, onClose }) => {
	return (
		<div className="flex shrink-0 flex-col gap-1 border-b border-border bg-[#F7F8FA] py-3 px-6">
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0 flex-1">
					{/* <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						{__('Step', 'doublescale')}
					</p> */}
					<h3 className=" text-base font-bold leading-7 tracking-tight text-foreground">
						{title}
					</h3>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0 h-10 w-10 rounded-full text-foreground hover:bg-muted/40 hover:text-muted-foreground"
					onClick={onClose}
					aria-label="Close"
				>
					<CloseIcon width={32} height={32} color='#29292E' />
				</Button>
			</div>
		</div>
	);
};

export default SidebarHeader;
