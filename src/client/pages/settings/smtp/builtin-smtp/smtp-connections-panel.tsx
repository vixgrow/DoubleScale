/**
 * Table / card list of SMTP connections — isolated so parent wizard state does not force full re-layout.
 */
import { memo, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { EditIcon } from '@doublescale/components';
import TrashIcon from '@doublescale/shared/icons/trash';
import { Calendar } from 'lucide-react';
import {
	getSmtpMailerLogoUrl,
	getSmtpMailerOptionLabel,
} from '../mailer-options';
import type { SmtpConnection } from '../types';
import {
	formatConnectionDate,
	getConnectionDisplayLabel,
} from './settings-utils';
import DealCalenderIcon from '@doublescale/shared/icons/deal-calender';

function mailerLogoFallbackInitials(label: string): string {
	const cleaned = label.replace(/\s+/g, ' ').trim();
	if (!cleaned) return '?';
	const words = cleaned.split(' ').filter(Boolean);
	if (words.length >= 2) {
		return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
	}
	return cleaned.slice(0, 2).toUpperCase();
}

function ConnectionMailerLogo({
	mailerSlug,
	className,
}: {
	mailerSlug: string;
	className?: string;
}) {
	const raw = String(mailerSlug || '').trim();
	const slug = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '');
	const label = getSmtpMailerOptionLabel(slug || raw);
	const logoUrlRaw = getSmtpMailerLogoUrl(slug || raw);
	const [broken, setBroken] = useState(false);
	const logoUrl = logoUrlRaw && !broken ? logoUrlRaw : undefined;

	if (logoUrl) {
		return (
			<span className={cn('inline-flex items-center', className)}>
				<img
					src={logoUrl}
					alt=""
					title={label}
					className="block h-8 w-[45px] object-contain object-left"
					loading="lazy"
					decoding="async"
					onError={() => setBroken(true)}
				/>
			</span>
		);
	}

	return (
		<span
			className={cn(
				'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md bg-muted px-2 text-[11px] font-bold text-foreground',
				className
			)}
			title={label}
			aria-label={label}
		>
			{mailerLogoFallbackInitials(label)}
		</span>
	);
}

export type SmtpConnectionsPanelProps = {
	connectionsView: 'table' | 'card';
	connections: Record<string, SmtpConnection> | undefined;
	onEdit: (id: string) => void;
	onRequestDelete: (id: string) => void;
};

function SmtpConnectionsPanelInner({
	connectionsView,
	connections,
	onEdit,
	onRequestDelete,
}: SmtpConnectionsPanelProps) {
	const connectionIds = useMemo(
		() => Object.keys(connections || {}),
		[connections]
	);

	if (connectionIds.length === 0) {
		return (
			<p className="text-sm text-muted-foreground py-4">
				{__(
					'No connections yet. Add a connection to start routing mail.',
					'doublescale'
				)}
			</p>
		);
	}

	if (connectionsView === 'table') {
		return (
			<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white">
				<Table className="[&_thead_th]:text-sm  [&_thead_th]:capitalize [&_thead_th]:font-medium [&_thead_th]:leading-6 [&_thead_th]:text-foreground [&_tbody_td]:text-sm [&_tbody_td]:font-medium [&_tbody_td]:leading-6 [&_tbody_td]:text-foreground">
					<TableHeader className="bg-muted">
						<TableRow className="hover:bg-transparent border-border">
							<TableHead>
								{__('Provider', 'doublescale')}
							</TableHead>
							<TableHead>
								{__('Connection Name', 'doublescale')}
							</TableHead>
							<TableHead>
								{__('Created Date', 'doublescale')}
							</TableHead>
							<TableHead className="text-right">
								{__('Actions', 'doublescale')}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{connectionIds.map((id, idx) => {
							const row = connections![id];
							return (
								<TableRow
									key={id}
									className={cn(
										'border-border hover:bg-muted',
										idx % 2 === 0 ? 'bg-white' : 'bg-muted'
									)}
								>
									<TableCell className="max-w-[180px] flex items-center">
										<ConnectionMailerLogo
											mailerSlug={String(
												row.mailer || ''
											)}
										/>
									</TableCell>
									<TableCell
										className="max-w-[260px] truncate"
										title={id}
									>
										{getConnectionDisplayLabel(row, id)}
									</TableCell>
									<TableCell className="whitespace-nowrap">
										{formatConnectionDate(row)}
									</TableCell>
									<TableCell className="text-right">
										<div className="inline-flex items-center gap-1">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="!text-[#0D9DFC]"
												title={__(
													'Edit connection',
													'doublescale'
												)}
												onClick={() => onEdit(id)}
												aria-label={__(
													'Edit connection',
													'doublescale'
												)}
											>
												<EditIcon
													width={24}
													height={24}
													color="#0D9DFC"
												/>
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												title={__(
													'Delete connection',
													'doublescale'
												)}
												onClick={() =>
													onRequestDelete(id)
												}
												aria-label={__(
													'Delete connection',
													'doublescale'
												)}
											>
												<TrashIcon />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		);
	}

	return (
		<div className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 content-start items-start gap-6 overflow-y-auto rounded-2xl border border-border bg-muted p-6 md:grid-cols-2">
			{connectionIds.map((id) => {
				const row = connections![id];
				return (
					<div
						key={id}
						className="self-start rounded-xl border border-border bg-white p-4"
					>
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between gap-2">
								<div className="min-w-0 flex flex-col gap-2">
									<p className="truncate text-sm font-semibold leading-6 text-foreground">
										{getConnectionDisplayLabel(row, id)}
									</p>
								</div>
								<div className="inline-flex items-center gap-1">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="text-[#0D9DFC]"
										onClick={() => onEdit(id)}
										title={__(
											'Edit connection',
											'doublescale'
										)}
										aria-label={__(
											'Edit connection',
											'doublescale'
										)}
									>
										<EditIcon
											width={24}
											height={24}
											color="#0D9DFC"
										/>
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										title={__(
											'Delete connection',
											'doublescale'
										)}
										onClick={() => onRequestDelete(id)}
										aria-label={__(
											'Delete connection',
											'doublescale'
										)}
									>
										<TrashIcon width={24} height={24} />
									</Button>
								</div>
							</div>
							<div className="flex items-center justify-between gap-2">
								<ConnectionMailerLogo
									mailerSlug={String(row.mailer || '')}
								/>
								<div className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted-foreground">
									<DealCalenderIcon />
									<span>{formatConnectionDate(row)}</span>
								</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

export const SmtpConnectionsPanel = memo(SmtpConnectionsPanelInner);
