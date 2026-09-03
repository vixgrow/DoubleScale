/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ColoredDeleteIcon } from '@doublescale/components';

type ContactDeletionImpact = {
	invoices?: number;
	payments?: number;
	proposals?: number;
	deals?: number;
	projects?: number;
	tasks?: number;
	contracts?: number;
	credit_notes?: number;
	tickets?: number;
	bookings?: number;
	memberships?: number;
	subscriptions?: number;
	activities?: number;
};

interface ContactDeleteModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	selectedIds: string[];
}

const IMPACT_LABELS: Record<keyof ContactDeletionImpact, string> = {
	invoices: __('Invoices', 'doublescale'),
	payments: __('Payments', 'doublescale'),
	proposals: __('Proposals', 'doublescale'),
	deals: __('Deals', 'doublescale'),
	projects: __('Projects', 'doublescale'),
	tasks: __('Tasks', 'doublescale'),
	contracts: __('Contracts', 'doublescale'),
	credit_notes: __('Credit notes', 'doublescale'),
	tickets: __('Support tickets', 'doublescale'),
	bookings: __('Bookings', 'doublescale'),
	memberships: __('Memberships', 'doublescale'),
	subscriptions: __('Active subscriptions', 'doublescale'),
	activities: __('Activities', 'doublescale'),
};

const ContactDeleteModal: React.FC<ContactDeleteModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	selectedIds,
}) => {
	const [loading, setLoading] = useState(false);
	const [impact, setImpact] = useState<ContactDeletionImpact | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen || selectedIds.length === 0) {
			return;
		}

		let cancelled = false;

		const loadImpact = async () => {
			setLoading(true);
			setError(null);
			setImpact(null);

			try {
				const response = (await apiFetch({
					path: '/doublescale/v1/contacts/deletion-impact',
					method: 'POST',
					data: {
						ids: selectedIds.map(Number),
					},
				})) as { related?: ContactDeletionImpact };

				if (!cancelled) {
					setImpact(response.related ?? {});
				}
			} catch (fetchError: any) {
				if (!cancelled) {
					setError(
						fetchError?.message ||
							__(
								'Could not load related records for these contacts.',
								'doublescale'
							)
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		loadImpact();

		return () => {
			cancelled = true;
		};
	}, [isOpen, selectedIds]);

	const relatedLines = useMemo(() => {
		if (!impact) {
			return [];
		}

		return (Object.keys(IMPACT_LABELS) as Array<keyof ContactDeletionImpact>)
			.map((key) => ({
				key,
				label: IMPACT_LABELS[key],
				count: impact[key] ?? 0,
			}))
			.filter((item) => item.count > 0);
	}, [impact]);

	const selectedCount = selectedIds.length;
	const itemLabel =
		selectedCount === 1
			? __('contact', 'doublescale')
			: __('contacts', 'doublescale');

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogOverlay className="z-[150200]" />
			<DialogContent className="max-w-[38rem] p-8 z-[150200]">
				<DialogHeader>
					<div className="flex flex-col items-center justify-center gap-6">
						<div className="flex items-center justify-center rounded-3xl p-5 bg-[#FCDADA] text-[#EF4444]">
							<ColoredDeleteIcon />
						</div>
						<DialogTitle className="text-2xl font-bold text-[#09090B] text-center">
							{selectedCount === 1
								? sprintf(
										/* translators: %s: singular item type label */
										__(
											'Delete the selected %s?',
											'doublescale'
										),
										itemLabel
								  )
								: sprintf(
										/* translators: 1: number of items, 2: plural item type label */
										__(
											'Delete %1$d selected %2$s?',
											'doublescale'
										),
										selectedCount,
										itemLabel
								  )}
						</DialogTitle>
					</div>
				</DialogHeader>

				<div className="mt-2 space-y-3 text-sm text-muted-foreground">
					{loading ? (
						<p>{__('Checking related records…', 'doublescale')}</p>
					) : error ? (
						<p className="text-destructive">{error}</p>
					) : relatedLines.length > 0 ? (
						<>
							<p>
								{__(
									'The following related records will also be deleted or unlinked:',
									'doublescale'
								)}
							</p>
							<ul className="list-disc space-y-1 pl-5 text-foreground">
								{relatedLines.map((line) => (
									<li key={line.key}>
										{sprintf(
											/* translators: 1: record count, 2: record type label */
											__('%1$d %2$s', 'doublescale'),
											line.count,
											line.label
										)}
									</li>
								))}
							</ul>
						</>
					) : (
						<p>
							{__(
								'No related CRM records were found for the selected contacts.',
								'doublescale'
							)}
						</p>
					)}
					<p className="font-medium text-destructive">
						{__('This action cannot be undone.', 'doublescale')}
					</p>
				</div>

				<DialogFooter className="flex gap-2 mt-4">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						className="flex-1"
						disabled={loading}
					>
						{__('Back', 'doublescale')}
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={() => {
							onConfirm();
							onClose();
						}}
						className="flex-1"
						disabled={loading}
					>
						{__('Yes, delete everything', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default ContactDeleteModal;
