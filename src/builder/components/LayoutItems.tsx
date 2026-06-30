/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
/**
 * internal dependencies
 */
import { cn } from '@/lib/utils';
import PreheaderLibrary from '../blocks/libraries/Preheader';
import HeaderLibrary from '../blocks/libraries/Header';
import HeroImageLibrary from '../blocks/libraries/HeroImage';
import EmailBodyLibrary from '../blocks/libraries/EmailBody';
import ImageGalleryLibrary from '../blocks/libraries/ImageGallery';
import FooterLibrary from '../blocks/libraries/Footer';
import SavedBlocksLibrary from '../blocks/libraries/SavedBlocks';

export interface LayoutItemsProps {
	/**
	 * Dark sidebar (email builder) vs light panel (e.g. Pro elements column).
	 */
	inline?: boolean;
	/** Incremented after a drop etc. to collapse all library panels. */
	collapseSignal?: number;
}

const LayoutItems = ({
	inline = true,
	collapseSignal = 0,
}: LayoutItemsProps) => {
	const [openLibraryId, setOpenLibraryId] = useState<string | null>(null);

	const layoutItems = [
		{
			id: 'preheader',
			title: __('Preheader', 'doublescale'),
			component: PreheaderLibrary,
		},
		{
			id: 'header',
			title: __('Header', 'doublescale'),
			component: HeaderLibrary,
		},
		{
			id: 'hero-image',
			title: __('Hero Image', 'doublescale'),
			component: HeroImageLibrary,
		},
		{
			id: 'email-body',
			title: __('Email Body', 'doublescale'),
			component: EmailBodyLibrary,
		},
		{
			id: 'image-gallery',
			title: __('Image Gallery', 'doublescale'),
			component: ImageGalleryLibrary,
		},
		{
			id: 'footer',
			title: __('Footer', 'doublescale'),
			component: FooterLibrary,
		},
		{
			id: 'my-blocks',
			title: __('My Blocks', 'doublescale'),
			component: SavedBlocksLibrary,
		},
	];

	useEffect(() => {
		if (collapseSignal && collapseSignal > 0) {
			setOpenLibraryId(null);
		}
	}, [collapseSignal]);

	const shellClass = inline
		? cn('overflow-hidden rounded-xl', 'bg-[rgba(255,255,255,0.05)]')
		: cn(
				'overflow-hidden rounded-xl border border-border/60',
				'bg-muted/20'
			);

	const triggerClass = inline
		? cn(
				'flex w-full items-center justify-between bg-white/[0.05] px-4 py-4 text-left text-sm text-white transition-colors hover:bg-white/[0.08]'
			)
		: cn(
				'flex w-full items-center justify-between px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted/50'
			);

	const bodyClass = inline
		? 'border-t border-white px-4 py-4'
		: 'border-t border-border/60 bg-white px-4 py-4';

	const toggle = (id: string) => {
		setOpenLibraryId((cur) => (cur === id ? null : id));
	};

	return (
		<div className={cn('flex flex-col', inline ? 'gap-4' : 'gap-2')}>
			{layoutItems.map((item) => {
				const isOpen = openLibraryId === item.id;
				const LibraryComponent = item.component as ComponentType<{
					onSidebarClose?: () => void;
				}>;
				return (
					<div key={item.id} className={shellClass}>
						<button
							type="button"
							className={cn(
								triggerClass,
								isOpen &&
									(inline
										? 'border-b border-white px-4'
										: 'border-b border-border/60')
							)}
							onClick={() => toggle(item.id)}
						>
							<span>{item.title}</span>
							{isOpen ? (
								inline ? (
									<ChevronDown className="h-6 w-6 shrink-0 text-white" />
								) : (
									<ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
								)
							) : inline ? (
								<ChevronRight className="h-6 w-6 shrink-0 text-white" />
							) : (
								<ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
							)}
						</button>
						{isOpen && (
							<div className={bodyClass}>
								<LibraryComponent
									onSidebarClose={() => setOpenLibraryId(null)}
								/>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default LayoutItems;
