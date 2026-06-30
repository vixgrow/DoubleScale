/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { useEffect, useState } from '@wordpress/element';

/**
 * external dependencies
 */
import { Trash2 } from 'lucide-react';

/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { MyTemplatesIcon } from '@/components/icons';
import { DraggableTemplate } from '@/builder/components/shared/DraggableTemplate';
import { getSavedBlocks, deleteSavedBlock } from '@/builder/api/savedBlocks';
import type { SavedBlock, SavedBlockCategory } from '@/builder/types/common';

const CATEGORY_LABELS: Record<SavedBlockCategory, string> = {
	header: __('Header', 'doublescale'),
	footer: __('Footer', 'doublescale'),
	hero: __('Hero', 'doublescale'),
	cta: __('CTA', 'doublescale'),
	gallery: __('Gallery', 'doublescale'),
	custom: __('Custom', 'doublescale'),
};

const CATEGORY_ORDER: SavedBlockCategory[] = [
	'header',
	'hero',
	'cta',
	'gallery',
	'footer',
	'custom',
];

interface SavedBlocksLibraryProps {
	onSidebarClose?: () => void;
}

const SavedBlocksLibrary = ({ onSidebarClose }: SavedBlocksLibraryProps) => {
	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	const [blocks, setBlocks] = useState<SavedBlock[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<number | null>(null);

	const fetchBlocks = async () => {
		try {
			setLoading(true);
			setError(null);
			const fetched = await getSavedBlocks();
			setBlocks(Array.isArray(fetched) ? fetched : []);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: __('Failed to load saved blocks', 'doublescale')
			);
			setBlocks([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBlocks();
	}, []);

	const handleDelete = async (id: number, e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();

		if (!isProActive || deletingId !== null) {
			return;
		}

		try {
			setDeletingId(id);
			await deleteSavedBlock(id);
			setBlocks((prev) => prev.filter((block) => block.id !== id));
		} catch (err) {
			console.error('Failed to delete saved block:', err);
		} finally {
			setDeletingId(null);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
				<p className="text-white/70 text-sm text-center mt-3">
					{__('Loading blocks...', 'doublescale')}
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<p className="text-red-300 text-sm text-center">{error}</p>
				<Button
					variant="outline"
					size="sm"
					className="mt-3"
					onClick={fetchBlocks}
				>
					{__('Retry', 'doublescale')}
				</Button>
			</div>
		);
	}

	if (blocks.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8">
				<div className="text-white/40 mb-3">
					<MyTemplatesIcon width={40} height={40} />
				</div>
				<p className="text-white/70 text-sm text-center">
					{__(
						'No saved blocks yet. Select a section and use Save as Block.',
						'doublescale'
					)}
				</p>
			</div>
		);
	}

	const grouped = CATEGORY_ORDER.reduce<
		Record<SavedBlockCategory, SavedBlock[]>
	>(
		(acc, category) => {
			acc[category] = blocks.filter((b) => b.category === category);
			return acc;
		},
		{
			header: [],
			footer: [],
			hero: [],
			cta: [],
			gallery: [],
			custom: [],
		}
	);

	return (
		<div className="flex flex-col gap-6">
			{CATEGORY_ORDER.map((category) => {
				const categoryBlocks = grouped[category];
				if (categoryBlocks.length === 0) {
					return null;
				}

				return (
					<div key={category} className="flex flex-col gap-3">
						<h4 className="text-xs font-medium uppercase tracking-wide text-white/60">
							{CATEGORY_LABELS[category]}
						</h4>
						<div className="flex flex-col gap-3">
							{categoryBlocks.map((block) => (
								<DraggableTemplate
									key={block.id}
									id={`saved-block-${block.id}`}
									template={block}
									templateType="saved-block"
									disabled={!isProActive}
								>
									<div className="relative rounded-lg border border-white/10 bg-white/5 overflow-hidden">
										{block.thumbnail ? (
											<img
												src={block.thumbnail}
												alt={block.name}
												className="w-full h-24 object-cover"
											/>
										) : (
											<div className="w-full h-24 flex items-center justify-center bg-white/5">
												<MyTemplatesIcon
													width={32}
													height={32}
												/>
											</div>
										)}
										<div className="px-3 py-2 flex items-center justify-between gap-2">
											<span className="text-sm text-white truncate">
												{block.name}
											</span>
											{isProActive && (
												<button
													type="button"
													className="shrink-0 p-1 text-white/50 hover:text-red-400 transition-colors"
													title={__(
														'Delete block',
														'doublescale'
													)}
													onClick={(e) =>
														handleDelete(
															block.id,
															e
														)
													}
													disabled={
														deletingId === block.id
													}
												>
													<Trash2 className="h-4 w-4" />
												</button>
											)}
										</div>
									</div>
								</DraggableTemplate>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default SavedBlocksLibrary;
