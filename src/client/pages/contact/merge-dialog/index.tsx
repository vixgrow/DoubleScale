/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@doublescale/components/ui/button';

export type MergeContactSummary = {
	id: number;
	first_name?: string;
	last_name?: string;
	email?: string | null;
	phone?: string | null;
	whatsapp_phone?: string | null;
};

export type MergeConflict = {
	field: string;
	primary: string | number | null;
	source: string | number | null;
};

export type MergePreview = {
	field?: 'email' | 'phone' | 'whatsapp_phone';
	primary: MergeContactSummary;
	source: MergeContactSummary;
	conflicts?: MergeConflict[];
	identifiers_to_copy?: Array<{ field: string; value: string }>;
	relationship_counts?: Record<string, number>;
};

type MergeDialogProps = {
	open: boolean;
	busy?: boolean;
	preview: MergePreview | null;
	onCancel: () => void;
	onConfirm: () => void;
};

function displayName(contact: MergeContactSummary | undefined): string {
	if (!contact) {
		return '';
	}
	const name = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim();
	return name || contact.email || contact.phone || `#${contact.id}`;
}

export default function MergeDialog({
	open,
	busy = false,
	preview,
	onCancel,
	onConfirm,
}: MergeDialogProps) {
	if (!preview) {
		return null;
	}

	const counts = preview.relationship_counts ?? {};
	const preserved = Object.entries(counts).filter(([, count]) => count > 0);
	const primaryName = displayName(preview.primary);

	return (
		<Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
			<DialogContent
				className="max-w-lg gap-4 z-[150300]"
				onPointerDownOutside={(event) => event.preventDefault()}
				onInteractOutside={(event) => event.preventDefault()}
				onFocusOutside={(event) => event.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{__('Merge contacts', 'doublescale')}</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">
					{__(
						'An existing contact already uses this identifier. Confirm to merge the duplicate into the contact you are editing.',
						'doublescale'
					)}
				</p>
				<p className="text-sm font-medium">
					{sprintf(
						/* translators: %s: primary contact name */
						__('%s will remain the primary contact.', 'doublescale'),
						primaryName
					)}
				</p>
				<div className="grid grid-cols-2 gap-3 text-sm">
					<div className="rounded-md border p-3">
						<div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
							{__('Primary contact', 'doublescale')}
						</div>
						<div className="font-medium">{displayName(preview.primary)}</div>
						<div>{preview.primary.email || '—'}</div>
						<div>{preview.primary.phone || '—'}</div>
					</div>
					<div className="rounded-md border p-3">
						<div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
							{__('Will be merged', 'doublescale')}
						</div>
						<div className="font-medium">{displayName(preview.source)}</div>
						<div>{preview.source.email || '—'}</div>
						<div>{preview.source.phone || '—'}</div>
					</div>
				</div>
				{preview.conflicts && preview.conflicts.length > 0 ? (
					<div className="text-sm">
						<div className="mb-1 font-medium">
							{__('Conflicting fields kept on the primary contact', 'doublescale')}
						</div>
						<ul className="list-disc space-y-1 pl-5">
							{preview.conflicts.map((conflict) => (
								<li key={conflict.field}>
									{conflict.field}: {String(conflict.primary)} /{' '}
									{String(conflict.source)}
								</li>
							))}
						</ul>
					</div>
				) : null}
				{preserved.length > 0 ? (
					<div className="text-sm">
						<div className="mb-1 font-medium">
							{__('Records that will be preserved', 'doublescale')}
						</div>
						<ul className="list-disc space-y-1 pl-5">
							{preserved.map(([key, count]) => (
								<li key={key}>
									{key}: {count}
								</li>
							))}
						</ul>
					</div>
				) : null}
				<DialogFooter className="gap-2">
					<Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button type="button" disabled={busy} onClick={onConfirm}>
						{busy
							? __('Please wait…', 'doublescale')
							: __('Confirm merge', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
