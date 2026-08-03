/**
 * Manual run: enroll a chosen contact into the automation without the trigger.
 */

import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import type React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { History, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	moduleFetch,
	getModuleFetchBlockedNotice,
} from '@doublescale/services/module-fetch';
import type { Automation } from '@doublescale/client';

interface ContactHit {
	id: number;
	email: string;
	first_name: string | null;
	last_name: string | null;
}

interface EnrollmentHistory {
	contact_id: number;
	runs: number;
	last_run_at: string | null;
	last_status: string;
	has_test_run: boolean;
}

interface Props {
	automation: Automation;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

const contactLabel = (c: ContactHit): string => {
	const name = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
	return name ? `${name} <${c.email}>` : c.email;
};

/**
 * Human readable "ran before" hint for a contact, or null when never enrolled.
 */
const enrollmentHint = (history?: EnrollmentHistory): string | null => {
	if (!history || history.runs < 1) {
		return null;
	}

	const parsed = history.last_run_at
		? new Date(history.last_run_at.replace(' ', 'T'))
		: null;
	const when =
		parsed && !Number.isNaN(parsed.getTime())
			? parsed.toLocaleDateString()
			: '';

	if (history.runs > 1) {
		return when
			? sprintf(
					/* translators: 1: number of previous runs, 2: date of the last run. */
					__(
						'Ran this automation %1$d times — last on %2$s',
						'doublescale'
					),
					history.runs,
					when
				)
			: sprintf(
					/* translators: %d: number of previous runs. */
					__('Ran this automation %d times', 'doublescale'),
					history.runs
				);
	}

	return when
		? sprintf(
				/* translators: %s: date of the previous run. */
				__('Ran this automation on %s', 'doublescale'),
				when
			)
		: __('Ran this automation before', 'doublescale');
};

const TestRunDialog: React.FC<Props> = ({
	automation,
	open,
	onOpenChange,
	onSuccess,
}) => {
	const { createNotice } = useDispatch('doublescale/core');
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<ContactHit[]>([]);
	const [searching, setSearching] = useState(false);
	const [picked, setPicked] = useState<ContactHit | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [history, setHistory] = useState<Record<number, EnrollmentHistory>>(
		{}
	);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const resetState = () => {
		setQuery('');
		setResults([]);
		setPicked(null);
		setSearching(false);
		setHistory({});
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			resetState();
		}
		onOpenChange(nextOpen);
	};

	const clearPickedContact = () => {
		setPicked(null);
		setQuery('');
		setResults([]);
	};

	/**
	 * Ask the backend which of these contacts already went through this
	 * automation, so each result can carry a "ran before" hint.
	 */
	const loadHistory = useCallback(
		(contacts: ContactHit[]) => {
			if (contacts.length === 0) {
				return;
			}
			apiFetch<{ data: EnrollmentHistory[] }>({
				path: `/doublescale/v1/automations/${automation.id}/enrollment-history?contact_ids=${contacts
					.map((c) => c.id)
					.join(',')}`,
			})
				.then((res) => {
					const rows = Array.isArray(res?.data) ? res.data : [];
					setHistory((prev) => {
						const next = { ...prev };
						rows.forEach((row) => {
							next[row.contact_id] = row;
						});
						return next;
					});
				})
				.catch(() => {
					// A missing hint should never break contact selection.
				});
		},
		[automation.id]
	);

	const runSearch = useCallback(
		(term: string) => {
			if (!term.trim()) {
				setResults([]);
				return;
			}
			setSearching(true);
			apiFetch<{ data: ContactHit[] }>({
				path: `/doublescale/v1/contacts?keywords=${encodeURIComponent(
					term.trim()
				)}&per_page=8`,
			})
				.then((res) => {
					const hits = Array.isArray(res?.data) ? res.data : [];
					setResults(hits);
					loadHistory(hits);
				})
				.catch(() => {
					setResults([]);
				})
				.finally(() => {
					setSearching(false);
				});
		},
		[loadHistory]
	);

	useEffect(() => {
		if (!open || picked) {
			return;
		}
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => runSearch(query), 250);
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [query, picked, runSearch, open]);

	const handleRun = async () => {
		if (!picked || submitting) {
			return;
		}

		setSubmitting(true);
		try {
			const response = (await moduleFetch<{
				enrolled: boolean;
				automation_contact_id: number;
			}>('automations', {
				path: `/doublescale/v1/automations/${automation.id}/test-run`,
				method: 'POST',
				data: { contact_id: picked.id },
			})) as { enrolled: boolean; automation_contact_id: number } | null;

			if (!response?.enrolled) {
				createNotice({
					type: 'error',
					message: getModuleFetchBlockedNotice('automations'),
				});
				return;
			}

			createNotice({
				type: 'success',
				message: __(
					'Manual run started. Check the Contacts tab to follow progress.',
					'doublescale'
				),
			});
			handleOpenChange(false);
			onSuccess?.();
		} catch (error) {
			const err = error as { message?: string };
			createNotice({
				type: 'error',
				message:
					err?.message ||
					__('Failed to start the manual run.', 'doublescale'),
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{__('Run manually', 'doublescale')}
					</DialogTitle>
					<DialogDescription>
						{__(
							'Choose a contact to run this automation for. Steps execute for real; wait steps are skipped.',
							'doublescale'
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2 py-2">
					<Label className="text-sm font-medium text-foreground">
						{__('Contact', 'doublescale')}{' '}
						<span className="text-destructive">*</span>
					</Label>

					{picked ? (
						<div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2">
							<span className="flex flex-col gap-0.5">
								<span className="text-sm text-foreground">
									{contactLabel(picked)}
								</span>
								{enrollmentHint(history[picked.id]) && (
									<span className="flex items-center gap-1 text-xs text-amber-600">
										<History
											width={12}
											height={12}
											className="shrink-0"
										/>
										{enrollmentHint(history[picked.id])}
									</span>
								)}
							</span>
							<button
								type="button"
								className="text-muted-foreground hover:text-foreground"
								onClick={clearPickedContact}
								aria-label={__('Clear', 'doublescale')}
							>
								<X width={16} height={16} />
							</button>
						</div>
					) : (
						<div className="relative">
							<Search
								width={16}
								height={16}
								className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								type="text"
								className="h-10 w-full pl-10"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder={__(
									'Search contacts by name or email…',
									'doublescale'
								)}
								autoFocus
							/>
							{(searching || results.length > 0) && (
								<div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
									{searching && (
										<div className="px-3 py-2 text-sm text-muted-foreground">
											{__('Searching…', 'doublescale')}
										</div>
									)}
									{!searching && results.length === 0 && (
										<div className="px-3 py-2 text-sm text-muted-foreground">
											{__(
												'No contacts found.',
												'doublescale'
											)}
										</div>
									)}
									{results.map((c) => {
										const hint = enrollmentHint(
											history[c.id]
										);
										return (
											<button
												key={c.id}
												type="button"
												className="block w-full px-3 py-2 text-left text-sm hover:bg-muted/60"
												onClick={() => {
													setPicked(c);
													setResults([]);
													setQuery('');
												}}
											>
												<span className="block">
													{contactLabel(c)}
												</span>
												{hint && (
													<span className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
														<History
															width={12}
															height={12}
															className="shrink-0"
														/>
														{hint}
													</span>
												)}
											</button>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={submitting}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						type="button"
						onClick={() => void handleRun()}
						disabled={!picked || submitting}
					>
						{submitting
							? __('Running…', 'doublescale')
							: __('Run', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default TestRunDialog;
