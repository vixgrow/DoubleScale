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

interface SidebarHeaderProps {
	title: string;
	onClose: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, onClose }) => {
	return (
		<div className="flex shrink-0 flex-col gap-1 border-b border-border/60 bg-gradient-to-br from-muted/60 via-muted/25 to-transparent px-4 pb-4 pt-5 sm:px-5">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						{__('Step', 'doublescale')}
					</p>
					<h3 className="mt-0.5 text-base font-semibold leading-snug tracking-tight text-foreground">
						{title}
					</h3>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
					onClick={onClose}
					aria-label="Close"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};

export default SidebarHeader;
