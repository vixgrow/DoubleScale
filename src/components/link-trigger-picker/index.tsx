/**
 * Shared picker for inserting a Link Trigger URL into a rich-text editor.
 *
 * Pro-only: the REST route lives in DoubleScale Pro. The button that opens
 * this dialog is hidden when Pro is not active.
 */

import React, { useEffect, useMemo, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { Search } from 'lucide-react';

import { LinkTriggersIcon } from '@doublescale/shared/icons';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface PickedLinkTrigger {
	id: number;
	name: string;
	url: string;
}

interface LinkTriggerRow {
	id: number;
	name: string;
	hash?: string;
	status?: string;
	full_url?: string;
}

interface LinkTriggersListResponse {
	data?: LinkTriggerRow[];
}

interface LinkTriggerPickerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onPick: (trigger: PickedLinkTrigger) => void;
}

const triggerUrl = (trigger: LinkTriggerRow): string => {
	if (trigger.full_url) {
		return trigger.full_url;
	}
	const hash = trigger.hash || '';
	if (!hash) {
		return '';
	}
	const home = window.location.pathname.includes('/wp-admin')
		? `${window.location.origin}${window.location.pathname.split('/wp-admin')[0]}`
		: window.location.origin;
	return `${home}/?doublescale-link-trigger=${encodeURIComponent(hash)}`;
};

export const LinkTriggerPickerDialog: React.FC<LinkTriggerPickerDialogProps> = ({
	open,
	onOpenChange,
	onPick,
}) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [triggers, setTriggers] = useState<LinkTriggerRow[]>([]);
	const [query, setQuery] = useState('');

	useEffect(() => {
		if (!open) {
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);
		setQuery('');

		void apiFetch<LinkTriggersListResponse>({
			path: addQueryArgs('/doublescale/v1/link-triggers', {
				page: 1,
				per_page: 100,
			}),
		})
			.then((response) => {
				if (cancelled) {
					return;
				}
				const rows = Array.isArray(response?.data) ? response.data : [];
				setTriggers(rows.filter((row) => row.status !== 'inactive'));
			})
			.catch((err: unknown) => {
				if (cancelled) {
					return;
				}
				const message =
					err instanceof Error
						? err.message
						: __('Could not load link triggers.', 'doublescale');
				setError(message);
				setTriggers([]);
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [open]);

	const filtered = useMemo(() => {
		const needle = query.trim().toLowerCase();
		if (!needle) {
			return triggers;
		}
		return triggers.filter((trigger) =>
			(trigger.name || '').toLowerCase().includes(needle)
		);
	}, [triggers, query]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPortal>
				<DialogOverlay className="z-[150200]" />
				<DialogContent className="sm:max-w-[440px] z-[150500]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<LinkTriggersIcon width={20} height={20} />
							{__('Insert Link Trigger', 'doublescale')}
						</DialogTitle>
						<DialogDescription>
							{__(
								'Choose a link trigger. Selected text becomes the link; otherwise the trigger name is used.',
								'doublescale'
							)}
						</DialogDescription>
					</DialogHeader>

					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder={__('Search link triggers…', 'doublescale')}
							className="h-10 pl-9"
							autoFocus
						/>
					</div>

					<div className="max-h-72 overflow-y-auto rounded-lg border border-border">
						{loading ? (
							<p className="px-3 py-8 text-center text-sm text-muted-foreground">
								{__('Loading…', 'doublescale')}
							</p>
						) : error ? (
							<p className="px-3 py-8 text-center text-sm text-destructive">
								{error}
							</p>
						) : filtered.length === 0 ? (
							<p className="px-3 py-8 text-center text-sm text-muted-foreground">
								{triggers.length === 0
									? __(
											'No active link triggers yet. Create one under Settings → Link Triggers.',
											'doublescale'
										)
									: __('No link triggers match your search.', 'doublescale')}
							</p>
						) : (
							<ul className="divide-y divide-border">
								{filtered.map((trigger) => {
									const url = triggerUrl(trigger);
									return (
										<li key={trigger.id}>
											<button
												type="button"
												className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left hover:bg-accent"
												onClick={() => {
													if (!url) {
														return;
													}
													onPick({
														id: trigger.id,
														name: trigger.name,
														url,
													});
													onOpenChange(false);
												}}
											>
												<span className="text-sm font-medium text-foreground">
													{trigger.name}
												</span>
												<span className="max-w-full truncate text-xs text-muted-foreground">
													{url}
												</span>
											</button>
										</li>
									);
								})}
							</ul>
						)}
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

interface LinkTriggerToolbarButtonProps {
	onMouseDown?: (event: React.MouseEvent) => void;
	onClick?: () => void;
	className?: string;
}

export const LinkTriggerToolbarButton: React.FC<LinkTriggerToolbarButtonProps> = ({
	onMouseDown,
	onClick,
	className,
}) => (
	<Button
		type="button"
		variant="ghost"
		size="icon"
		className={className ?? 'h-8 w-8 p-0'}
		title={__('Insert Link Trigger', 'doublescale')}
		aria-label={__('Insert Link Trigger', 'doublescale')}
		onMouseDown={onMouseDown}
		onClick={onClick}
	>
		<LinkTriggersIcon width={20} height={20} />
	</Button>
);
