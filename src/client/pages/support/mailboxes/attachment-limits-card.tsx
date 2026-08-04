/**
 * Support → Mailboxes → "Attachment limits" card.
 *
 * Lets an admin set the per-message attachment caps (max file size + max number
 * of files) that the ticket composers enforce and display. Reads the current
 * values from the mailbox-list meta via {@see useAttachmentLimits} and saves
 * through {@see saveAttachmentLimits}; the server clamps and echoes the stored
 * values back so the inputs reflect any clamping immediately.
 */

import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { Loader2 } from 'lucide-react';

import { AttachmentsIcon } from '@doublescale/shared/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAttachmentLimits, saveAttachmentLimits } from '@/hooks/support';

interface Props {
	/** Surface a success/error message through the page's existing notice UI. */
	onNotice: (notice: { type: 'success' | 'error'; message: string }) => void;
}

const AttachmentLimitsCard: React.FC<Props> = ({ onNotice }) => {
	const { limits, loading, refresh } = useAttachmentLimits();
	const [sizeMb, setSizeMb] = useState('');
	const [count, setCount] = useState('');
	const [saving, setSaving] = useState(false);

	// Seed the inputs once the limits load (and after a save-driven refresh).
	useEffect(() => {
		if (limits) {
			setSizeMb(String(limits.max_file_size_mb));
			setCount(String(limits.max_file_count));
		}
	}, [limits]);

	const handleSave = async () => {
		setSaving(true);
		try {
			await saveAttachmentLimits({
				max_file_size_mb: Math.max(1, Number(sizeMb) || 0),
				max_file_count: Math.max(1, Number(count) || 0),
			});
			refresh();
			onNotice({
				type: 'success',
				message: __('Attachment limits saved.', 'doublescale'),
			});
		} catch (err) {
			onNotice({
				type: 'error',
				message:
					err instanceof Error
						? err.message
						: __('Failed to save attachment limits.', 'doublescale'),
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card>
			<CardContent className="p-6">
				<div className="mb-4 flex items-center gap-2">
					<span className="shrink-0 text-gray-500">
						<AttachmentsIcon
							width={32}
							height={32}
							color="currentColor"
						/>
					</span>
					<div>
						<div className="font-semibold text-gray-900">
							{__('Attachment limits', 'doublescale')}
						</div>
						<div className="text-sm text-gray-500">
							{__(
								'Applies to ticket replies and new tickets across the admin, portal, and customer views.',
								'doublescale'
							)}
						</div>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<Loader2 className="h-4 w-4 animate-spin" />
						{__('Loading…', 'doublescale')}
					</div>
				) : (
					<>
						<div className="flex flex-wrap gap-4">
							<div className="flex-1 min-w-[180px] space-y-1">
								<Label htmlFor="ds-attach-size">
									{__(
										'Max file size (MB)',
										'doublescale'
									)}
								</Label>
								<Input
									id="ds-attach-size"
									type="number"
									min={1}
									value={sizeMb}
									onChange={(e) => setSizeMb(e.target.value)}
									className='!rounded-lg border !border-border'
								/>
							</div>
							<div className="flex-1 min-w-[180px] space-y-1">
								<Label htmlFor="ds-attach-count">
									{__(
										'Max number of files',
										'doublescale'
									)}
								</Label>
								<Input
									id="ds-attach-count"
									type="number"
									min={1}
									value={count}
									onChange={(e) => setCount(e.target.value)}
									className='!rounded-lg border !border-border'
								/>
							</div>
						</div>
						<p className="mt-2 text-xs text-gray-400">
							{__(
								'File size is also capped by your server upload limit, whichever is smaller.',
								'doublescale'
							)}
						</p>
						<div className="mt-4 flex justify-end">
							<Button
								variant="gradient"
								className="rounded-lg"
								disabled={saving}
								onClick={handleSave}
							>
								{saving && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{__('Save', 'doublescale')}
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default AttachmentLimitsCard;
