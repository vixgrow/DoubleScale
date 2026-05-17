/**
 * Amazon SES Identities panel for the doublescale-pro built-in SMTP settings.
 *
 * Mirrors the SMTP `AccountSettings` Identities table. Backend routes are
 * registered by `Aws\REST\Settings_Controller` under `/smtp/v1/mailers/aws/...`.
 */

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	addAwsIdentity,
	deleteAwsIdentity,
	fetchAwsIdentities,
	resendAwsIdentityVerification,
	type AwsIdentity,
} from './smtp-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AwsIdentitiesPanelProps {
	accountId: string;
}

const STATUS_BADGE: Record<string, string> = {
	Success:
		'inline-flex h-5 items-center rounded-full bg-emerald-100 px-2 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
	Pending:
		'inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
	Failed:
		'inline-flex h-5 items-center rounded-full bg-rose-100 px-2 text-[11px] font-medium text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};

const AwsIdentitiesPanel: React.FC<AwsIdentitiesPanelProps> = ({
	accountId,
}) => {
	const [identities, setIdentities] = useState<AwsIdentity[]>([]);
	const [isFetching, setIsFetching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);

	const [openAdd, setOpenAdd] = useState(false);
	const [identityType, setIdentityType] = useState<'email' | 'domain'>(
		'email'
	);
	const [identityValue, setIdentityValue] = useState('');
	const [adding, setAdding] = useState(false);
	const [addedMessage, setAddedMessage] = useState('');

	const [deleteTarget, setDeleteTarget] = useState<AwsIdentity | null>(null);
	const [deleting, setDeleting] = useState(false);

	const [domainTarget, setDomainTarget] = useState<AwsIdentity | null>(null);

	const [resendingFor, setResendingFor] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!accountId) {
			setIdentities([]);
			return;
		}
		setIsFetching(true);
		setError(null);
		try {
			const list = await fetchAwsIdentities(accountId);
			setIdentities(list);
		} catch (e: unknown) {
			setError(
				e instanceof Error
					? e.message
					: __('Could not load SES identities.', 'doublescale')
			);
			setIdentities([]);
		} finally {
			setIsFetching(false);
		}
	}, [accountId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const handleAdd = async () => {
		if (adding || !identityValue.trim()) {
			return;
		}
		setAdding(true);
		setError(null);
		try {
			await addAwsIdentity(accountId, identityValue.trim(), identityType);
			if (identityType === 'email') {
				setAddedMessage(
					sprintf(
						__(
							'Verification email sent to %s. Check the inbox to confirm.',
							'doublescale'
						),
						identityValue.trim()
					)
				);
			} else {
				setAddedMessage(
					__(
						'Domain added. Open the row’s view action to see DKIM CNAME records.',
						'doublescale'
					)
				);
			}
			setIdentityValue('');
			await refresh();
		} catch (e: unknown) {
			setAddedMessage(
				e instanceof Error
					? e.message
					: __('Could not add identity.', 'doublescale')
			);
		} finally {
			setAdding(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget || deleting) {
			return;
		}
		setDeleting(true);
		setError(null);
		try {
			await deleteAwsIdentity(
				accountId,
				deleteTarget.identity,
				deleteTarget.type
			);
			setInfo(
				sprintf(
					__('Identity %s deleted.', 'doublescale'),
					deleteTarget.identity
				)
			);
			setDeleteTarget(null);
			await refresh();
			setTimeout(() => setInfo(null), 3000);
		} catch (e: unknown) {
			setError(
				e instanceof Error
					? e.message
					: __('Could not delete identity.', 'doublescale')
			);
		} finally {
			setDeleting(false);
		}
	};

	const handleResend = async (identity: AwsIdentity) => {
		if (resendingFor) {
			return;
		}
		setResendingFor(identity.identity);
		setError(null);
		try {
			await resendAwsIdentityVerification(accountId, identity.identity);
			setInfo(
				sprintf(
					__('Verification email re-sent to %s.', 'doublescale'),
					identity.identity
				)
			);
			setTimeout(() => setInfo(null), 3000);
		} catch (e: unknown) {
			setError(
				e instanceof Error
					? e.message
					: __('Could not resend verification.', 'doublescale')
			);
		} finally {
			setResendingFor(null);
		}
	};

	if (!accountId) {
		return (
			<Alert>
				<AlertDescription className="text-xs">
					{__(
						'Save the AWS access key, secret, and region above first; identities will appear here once the account is linked.',
						'doublescale'
					)}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="space-y-3 rounded-md border bg-muted/20 p-3">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h4 className="text-sm font-semibold">
						{__('SES Identities', 'doublescale')}
					</h4>
					<p className="text-xs text-muted-foreground">
						{__(
							'Verified senders (email or domain) for this AWS account. Required by SES before sending.',
							'doublescale'
						)}
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void refresh()}
						disabled={isFetching}
					>
						{isFetching
							? __('Refreshing…', 'doublescale')
							: __('Refresh', 'doublescale')}
					</Button>
					<Button
						type="button"
						size="sm"
						onClick={() => {
							setIdentityType('email');
							setIdentityValue('');
							setAddedMessage('');
							setOpenAdd(true);
						}}
					>
						{__('+ Add identity', 'doublescale')}
					</Button>
				</div>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertDescription className="text-xs">
						{error}
					</AlertDescription>
				</Alert>
			)}
			{info && (
				<Alert>
					<AlertDescription className="text-xs">
						{info}
					</AlertDescription>
				</Alert>
			)}

			{isFetching && identities.length === 0 ? (
				<p className="py-2 text-center text-xs text-muted-foreground">
					{__('Loading identities…', 'doublescale')}
				</p>
			) : identities.length === 0 ? (
				<p className="py-2 text-center text-xs text-muted-foreground">
					{__(
						'No identities yet. Add an email or domain to start.',
						'doublescale'
					)}
				</p>
			) : (
				<div className="overflow-x-auto rounded border bg-background">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>
									{__('Sender', 'doublescale')}
								</TableHead>
								<TableHead>
									{__('Type', 'doublescale')}
								</TableHead>
								<TableHead>
									{__('Status', 'doublescale')}
								</TableHead>
								<TableHead className="text-right">
									{__('Actions', 'doublescale')}
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{identities.map((id) => {
								const status =
									(id.status as string) || 'Pending';
								const cls =
									STATUS_BADGE[status] || STATUS_BADGE.Pending;
								return (
									<TableRow key={`${id.type}:${id.identity}`}>
										<TableCell className="font-mono text-xs">
											{id.identity}
										</TableCell>
										<TableCell className="text-xs capitalize">
											{id.type}
										</TableCell>
										<TableCell>
											<span className={cls}>
												{status}
											</span>
										</TableCell>
										<TableCell className="space-x-1 text-right">
											{id.type === 'email' &&
												status === 'Pending' && (
													<Button
														type="button"
														variant="outline"
														size="sm"
														disabled={
															resendingFor ===
															id.identity
														}
														onClick={() =>
															void handleResend(id)
														}
													>
														{resendingFor ===
														id.identity
															? __(
																	'Sending…',
																	'doublescale'
															  )
															: __(
																	'Resend',
																	'doublescale'
															  )}
													</Button>
												)}
											{id.type === 'domain' && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														setDomainTarget(id)
													}
												>
													{__(
														'DKIM',
														'doublescale'
													)}
												</Button>
											)}
											<Button
												type="button"
												variant="destructive"
												size="sm"
												onClick={() =>
													setDeleteTarget(id)
												}
											>
												{__('Delete', 'doublescale')}
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			)}

			<Dialog
				open={openAdd}
				onOpenChange={(o) => {
					setOpenAdd(o);
					if (!o) {
						setAddedMessage('');
						setIdentityValue('');
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{__('Add SES identity', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						{addedMessage ? (
							<Alert>
								<AlertDescription className="text-xs">
									{addedMessage}
								</AlertDescription>
							</Alert>
						) : (
							<>
								<div className="space-y-1">
									<Label className="text-xs">
										{__('Identity type', 'doublescale')}
									</Label>
									<div className="flex gap-2 text-sm">
										<label className="inline-flex items-center gap-1">
											<input
												type="radio"
												value="email"
												checked={identityType === 'email'}
												onChange={() =>
													setIdentityType('email')
												}
											/>
											{__('Email', 'doublescale')}
										</label>
										<label className="inline-flex items-center gap-1">
											<input
												type="radio"
												value="domain"
												checked={
													identityType === 'domain'
												}
												onChange={() =>
													setIdentityType('domain')
												}
											/>
											{__('Domain', 'doublescale')}
										</label>
									</div>
								</div>
								<div className="space-y-1">
									<Label htmlFor="aws-new-identity">
										{identityType === 'email'
											? __('Email address', 'doublescale')
											: __('Domain', 'doublescale')}
									</Label>
									<Input
										id="aws-new-identity"
										value={identityValue}
										placeholder={
											identityType === 'email'
												? 'sender@example.com'
												: 'example.com'
										}
										onChange={(e) =>
											setIdentityValue(e.target.value)
										}
									/>
								</div>
							</>
						)}
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpenAdd(false)}
						>
							{__('Close', 'doublescale')}
						</Button>
						{!addedMessage && (
							<Button
								type="button"
								disabled={adding || !identityValue.trim()}
								onClick={() => void handleAdd()}
							>
								{adding
									? __('Adding…', 'doublescale')
									: __('Add identity', 'doublescale')}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{__('Delete identity', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					<p className="text-sm">
						{deleteTarget &&
							sprintf(
								__('Delete %s?', 'doublescale'),
								deleteTarget.identity
							)}
					</p>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setDeleteTarget(null)}
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={deleting}
							onClick={() => void handleDelete()}
						>
							{deleting
								? __('Deleting…', 'doublescale')
								: __('Delete', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!domainTarget}
				onOpenChange={(o) => !o && setDomainTarget(null)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{__('DKIM settings', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					{domainTarget && (
						<div className="space-y-3 text-sm">
							<p>
								{sprintf(
									__(
										'Add the following CNAME records to your DNS for %s. See AWS Easy DKIM docs for details.',
										'doublescale'
									),
									domainTarget.identity
								)}
							</p>
							{domainTarget.dkim?.DkimEnabled &&
							(domainTarget.dkim.DkimTokens?.length || 0) > 0 ? (
								<div className="overflow-x-auto rounded border bg-background">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>
													{__('Name', 'doublescale')}
												</TableHead>
												<TableHead>
													{__('Value', 'doublescale')}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{(
												domainTarget.dkim
													.DkimTokens as string[]
											).map((tok) => (
												<TableRow key={tok}>
													<TableCell className="font-mono text-xs">
														{tok}._domainkey.
														{domainTarget.identity}
													</TableCell>
													<TableCell className="font-mono text-xs">
														{tok}.dkim.amazonses.com
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							) : (
								<Alert>
									<AlertDescription className="text-xs">
										{__(
											'DKIM is not enabled for this domain in SES.',
											'doublescale'
										)}
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setDomainTarget(null)}
						>
							{__('Close', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default AwsIdentitiesPanel;
