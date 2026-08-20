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
import { ArrowLeft, Search } from 'lucide-react';

import { LinkTriggersIcon } from '@doublescale/shared/icons';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PickedLinkTrigger {
	id: number;
	name: string;
	url: string;
	linkText: string;
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
	/** When true, skip the link-text step (e.g. the editor already has selected text). */
	skipLinkTextStep?: boolean;
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

const toPickedTrigger = (
	trigger: LinkTriggerRow,
	url: string,
	linkText: string
): PickedLinkTrigger => ({
	id: trigger.id,
	name: trigger.name,
	url,
	linkText,
});

export const LinkTriggerPickerDialog: React.FC<LinkTriggerPickerDialogProps> = ({
	open,
	onOpenChange,
	onPick,
	skipLinkTextStep = false,
}) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [triggers, setTriggers] = useState<LinkTriggerRow[]>([]);
	const [query, setQuery] = useState('');
	const [step, setStep] = useState<'pick' | 'link-text'>('pick');
	const [selectedTrigger, setSelectedTrigger] = useState<LinkTriggerRow | null>(
		null
	);
	const [linkText, setLinkText] = useState('');

	const resetState = () => {
		setStep('pick');
		setSelectedTrigger(null);
		setLinkText('');
		setQuery('');
	};

	useEffect(() => {
		if (!open) {
			resetState();
			return;
		}

		let cancelled = false;
		setLoading(true);
		setError(null);

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

	const handleTriggerSelect = (trigger: LinkTriggerRow) => {
		const url = triggerUrl(trigger);
		if (!url) {
			return;
		}

		if (skipLinkTextStep) {
			onPick(toPickedTrigger(trigger, url, trigger.name));
			onOpenChange(false);
			return;
		}

		setSelectedTrigger(trigger);
		setLinkText(trigger.name || '');
		setStep('link-text');
	};

	const handleInsert = () => {
		if (!selectedTrigger) {
			return;
		}

		const url = triggerUrl(selectedTrigger);
		if (!url) {
			return;
		}

		const trimmed = linkText.trim();
		if (!trimmed) {
			return;
		}

		onPick(toPickedTrigger(selectedTrigger, url, trimmed));
		onOpenChange(false);
	};

	const handleDialogOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			resetState();
		}
		onOpenChange(nextOpen);
	};

	const selectedUrl = selectedTrigger ? triggerUrl(selectedTrigger) : '';

	return (
		<Dialog open={open} onOpenChange={handleDialogOpenChange}>
			<DialogContent
				overlayClassName="z-[150200]"
				className="z-[150500] w-[min(calc(100vw-2rem),440px)] max-w-[min(calc(100vw-2rem),440px)] min-w-0 overflow-hidden"
			>
				{step === 'pick' ? (
					<>
						<DialogHeader className="pr-8">
								<DialogTitle className="flex items-center gap-2">
									<LinkTriggersIcon width={20} height={20} />
									{__('Insert Link Trigger', 'doublescale')}
								</DialogTitle>
								<DialogDescription>
									{__(
										'Choose a link trigger, then set the link text that appears in your message.',
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
											: __(
													'No link triggers match your search.',
													'doublescale'
												)}
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
														onClick={() =>
															handleTriggerSelect(trigger)
														}
														disabled={!url}
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
						</>
					) : (
						<>
							<DialogHeader className="pr-8">
								<DialogTitle className="flex items-center gap-2">
									<LinkTriggersIcon width={20} height={20} />
									{__('Link text', 'doublescale')}
								</DialogTitle>
								<DialogDescription>
									{__(
										'This is the visible text in your message. It does not change the link trigger name in settings.',
										'doublescale'
									)}
								</DialogDescription>
							</DialogHeader>

							<div className="min-w-0 space-y-4">
								<div className="min-w-0 overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-2">
									<p className="text-xs font-medium text-muted-foreground">
										{__('Link trigger', 'doublescale')}
									</p>
									<p className="truncate text-sm font-medium text-foreground">
										{selectedTrigger?.name}
									</p>
									<p className="mt-1 break-all text-xs text-muted-foreground">
										{selectedUrl}
									</p>
								</div>

								<div className="min-w-0 space-y-2">
									<Label htmlFor="link-trigger-link-text">
										{__('Link text', 'doublescale')}
									</Label>
									<Input
										id="link-trigger-link-text"
										value={linkText}
										onChange={(event) =>
											setLinkText(event.target.value)
										}
										placeholder={selectedTrigger?.name || ''}
										maxLength={500}
										className="min-w-0"
										autoFocus
										onKeyDown={(event) => {
											if (event.key === 'Enter') {
												event.preventDefault();
												handleInsert();
											}
										}}
									/>
								</div>
							</div>

							<DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
								<Button
									type="button"
									variant="ghost"
									className="w-full justify-center sm:w-auto sm:justify-start"
									onClick={() => setStep('pick')}
								>
									<ArrowLeft className="mr-2 h-4 w-4" />
									{__('Back', 'doublescale')}
								</Button>
								<div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => handleDialogOpenChange(false)}
									>
										{__('Cancel', 'doublescale')}
									</Button>
									<Button
										type="button"
										onClick={handleInsert}
										disabled={!linkText.trim()}
									>
										{__('Insert', 'doublescale')}
									</Button>
								</div>
							</DialogFooter>
						</>
					)}
			</DialogContent>
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
