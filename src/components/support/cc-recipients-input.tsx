/**
 * Agent-only CC recipient chip input for the support reply composer.
 *
 * A removable list of email chips plus a free-text field that commits a chip on
 * Enter / comma / blur. Client-side email validation is a UX nicety only — the
 * server re-validates, de-dupes, and caps the list (TicketService caps at 10),
 * so this mirrors that limit to keep the UI honest.
 */

import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CcRecipientsInputProps {
	value: string[];
	onChange: (next: string[]) => void;
	/** Cap mirroring the server's MAX_CC. */
	max?: number;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
}

export default function CcRecipientsInput({
	value,
	onChange,
	max = 10,
	disabled = false,
	placeholder = __('Add CC email and press Enter…', 'doublescale'),
	className = '',
}: CcRecipientsInputProps) {
	const [draft, setDraft] = useState('');
	const [error, setError] = useState<string | null>(null);

	const commit = () => {
		const raw = draft.trim().replace(/,+$/, '').trim();
		if (!raw) {
			setDraft('');
			return;
		}
		if (!EMAIL_RE.test(raw)) {
			setError(__('Enter a valid email address.', 'doublescale'));
			return;
		}
		const lower = raw.toLowerCase();
		if (value.some((v) => v.toLowerCase() === lower)) {
			setDraft('');
			setError(null);
			return;
		}
		if (value.length >= max) {
			setError(
				__('Maximum of 10 CC recipients reached.', 'doublescale')
			);
			return;
		}
		onChange([...value, raw]);
		setDraft('');
		setError(null);
	};

	const removeAt = (idx: number) => {
		onChange(value.filter((_, i) => i !== idx));
	};

	return (
		<div className={className}>
			{value.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mb-2">
					{value.map((addr, idx) => (
						<Badge
							key={addr}
							variant="secondary"
							className="gap-1 pr-1.5"
						>
							{addr}
							<button
								type="button"
								aria-label={__('Remove', 'doublescale')}
								className="rounded-full hover:bg-black/10 p-0.5"
								onClick={() => removeAt(idx)}
								disabled={disabled}
							>
								<X width={12} height={12} />
							</button>
						</Badge>
					))}
				</div>
			)}
			<Input
				type="email"
				className='!rounded-lg !border-border'
				value={draft}
				disabled={disabled}
				placeholder={placeholder}
				onChange={(e) => {
					setDraft(e.target.value);
					if (error) {
						setError(null);
					}
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ',') {
						e.preventDefault();
						commit();
					} else if (
						e.key === 'Backspace' &&
						draft === '' &&
						value.length > 0
					) {
						removeAt(value.length - 1);
					}
				}}
				onBlur={commit}
			/>
			{error && <div className="mt-1 text-xs text-red-600">{error}</div>}
		</div>
	);
}
