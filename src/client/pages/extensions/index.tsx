/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Download,
	Power,
	CheckCircle2,
	Loader2,
	Search,
	Lock,
	ChevronDown,
} from 'lucide-react';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import type { Addon } from '@doublescale/config';
import { PageHeader } from '@doublescale/components';
import { Card, CardContent } from '@doublescale/components/ui/card';
import { Button } from '@doublescale/components/ui/button';
import { Badge } from '@doublescale/components/ui/badge';
import { Input } from '@doublescale/components/ui/input';

type ApiAction = {
	action: 'install' | 'activate';
	addon: string;
};

const basePluginUrl = ConfigAPI.getPluginDirUrl();
const proPluginUrl =
	(typeof window !== 'undefined' &&
		(
			window as unknown as {
				doublescalePro?: { proPluginUrl?: string };
			}
		).doublescalePro?.proPluginUrl) ||
	basePluginUrl;

const addonImages: Record<string, string> = {
	zapier: `${proPluginUrl}assets/images/zapier/zapier.svg`,
	make: `${proPluginUrl}assets/images/make/make.svg`,
};

const getAddonImageUrl = (addon: Addon): string => {
	if (addonImages[addon.slug]) {
		return addonImages[addon.slug];
	}

	if (addon.image) {
		return `${basePluginUrl}assets/images/${addon.image}`;
	}

	return '';
};

const ExtensionCard: React.FC<{
	addon: Addon;
	apiAction: ApiAction | null;
	onAction: (action: 'install' | 'activate', slug: string) => void;
	highlighted?: boolean;
	cardRef?: React.Ref<HTMLDivElement>;
}> = ({ addon, apiAction, onAction, highlighted, cardRef }) => {
	const isProcessing = apiAction?.addon === addon.slug;
	const currentAction = isProcessing ? apiAction?.action : null;
	const imageUrl = getAddonImageUrl(addon);

	const isPlanLocked =
		!!addon.plan &&
		!addon.is_installed &&
		!addon.is_active &&
		!ConfigAPI.isPlanAccessible(addon.plan);
	const planLabel = addon.plan
		? (ConfigAPI.getPlanLevels()[addon.plan]?.label ?? addon.plan)
		: '';
	const upgradeUrl = ConfigAPI.getUrlDoubleScalePro();

	const [isExpanded, setIsExpanded] = useState(false);

	const renderStatus = () => {
		if (isPlanLocked) {
			return (
				<Badge
					variant="outline"
					className="bg-gray-50 text-gray-500 border-gray-200"
				>
					<Lock className="w-3.5 h-3.5 mr-1" />
					{planLabel}
				</Badge>
			);
		}
		if (addon.is_active) {
			return (
				<Badge
					variant="outline"
					className="bg-emerald-50 text-emerald-700 border-emerald-200"
				>
					<CheckCircle2 className="w-3.5 h-3.5 mr-1" />
					{__('Active', 'doublescale')}
				</Badge>
			);
		}
		if (addon.is_installed) {
			return (
				<Badge
					variant="outline"
					className="bg-amber-50 text-amber-700 border-amber-200"
				>
					{__('Installed', 'doublescale')}
				</Badge>
			);
		}
		return (
			<Badge
				variant="outline"
				className="bg-gray-50 text-gray-500 border-gray-200"
			>
				{__('Not Installed', 'doublescale')}
			</Badge>
		);
	};

	const renderAction = () => {
		if (addon.is_active) {
			return null;
		}

		if (addon.is_installed) {
			return (
				<Button
					onClick={() => onAction('activate', addon.slug)}
					variant="secondary"
					size="sm"
					className="rounded-lg"
					disabled={!!apiAction}
				>
					{currentAction === 'activate' ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<Power className="w-4 h-4" />
					)}
					{currentAction === 'activate'
						? __('Activating...', 'doublescale')
						: __('Activate', 'doublescale')}
				</Button>
			);
		}

		return (
			<Button
				onClick={() => onAction('install', addon.slug)}
				variant="gradient"
				size="sm"
				className="rounded-lg"
				disabled={!!apiAction}
			>
				{currentAction === 'install' ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<Download className="w-4 h-4" />
				)}
				{currentAction === 'install'
					? __('Installing...', 'doublescale')
					: __('Install', 'doublescale')}
			</Button>
		);
	};

	return (
		<Card
			ref={cardRef}
			className={`shadow-none border transition-all duration-500 ${
				highlighted
					? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
					: 'bg-white'
			}`}
		>
			<CardContent className="p-5">
				<div
					className={`flex items-start gap-4 ${isPlanLocked ? 'cursor-pointer' : ''}`}
					onClick={isPlanLocked ? () => setIsExpanded((v) => !v) : undefined}
				>
					{imageUrl && (
						<div className="shrink-0 w-14 h-14 flex items-center justify-center rounded-lg bg-gray-50 border p-2">
							<img
								src={imageUrl}
								alt={addon.label}
								className="w-full h-auto"
							/>
						</div>
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center justify-between gap-3 mb-1">
							<h3 className="font-semibold text-base truncate">
								{addon.label}
							</h3>
							<div className="flex items-center gap-2">
								{renderStatus()}
								{isPlanLocked && (
									<ChevronDown
										className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
									/>
								)}
							</div>
						</div>
						{!isPlanLocked && (
							<>
								<p className="text-sm text-gray-500 mb-3">
									{addon.description}
								</p>
								<div className="flex items-center justify-end">
									{renderAction()}
								</div>
							</>
						)}
					</div>
				</div>

				{isPlanLocked && isExpanded && (
					<div className="flex flex-col items-center text-center py-8 px-4 mt-4 border-t">
						<Lock className="w-16 h-16 text-gray-700 mb-4" />
						<p className="text-gray-600 text-sm mb-5 max-w-[300px]">
							{sprintf(
								__(
									"We're sorry, %1$s is not available on your plan. Please upgrade to the %2$s plan to unlock all %2$s features.",
									'doublescale'
								),
								addon.label,
								planLabel
							)}
						</p>
						<a
							href={upgradeUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block text-white font-semibold text-sm uppercase tracking-wide px-6 py-3 rounded-md"
							style={{
								background: 'linear-gradient(135deg, #ec4899, #f97316)',
							}}
						>
							{sprintf(
								__('Upgrade to %s!', 'doublescale'),
								planLabel
							)}
						</a>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

const Extensions: React.FC = () => {
	const [addons, setAddons] = useState(ConfigAPI.getAddons());
	const [apiAction, setApiAction] = useState<ApiAction | null>(null);
	const [notice, setNotice] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	const urlParams = new URLSearchParams(window.location.search);
	const initialSlug = urlParams.get('search') || '';
	const [searchQuery, setSearchQuery] = useState('');
	const [highlightedSlug, setHighlightedSlug] = useState(initialSlug);
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

	useEffect(() => {
		if (!highlightedSlug || !cardRefs.current[highlightedSlug]) {
			return;
		}

		setTimeout(() => {
			cardRefs.current[highlightedSlug]?.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
			});
		}, 200);

		const timer = setTimeout(() => setHighlightedSlug(''), 3000);
		return () => clearTimeout(timer);
	}, []);

	const handleAction = (action: 'install' | 'activate', addonSlug: string) => {
		if (apiAction) return;
		setApiAction({ action, addon: addonSlug });
		setNotice(null);

		const data = new FormData();
		data.append('action', `doublescale_addon_${action}`);
		data.append('_nonce', ConfigAPI.getStoreNonce());
		data.append('addon', addonSlug);

		fetch(`${ConfigAPI.getAjaxUrl()}`, {
			method: 'POST',
			credentials: 'same-origin',
			body: data,
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.success) {
					setNotice({
						type: 'success',
						message: res.data,
					});

					setAddons((prev) => {
						const updated = { ...prev };
						if (action === 'install') {
							updated[addonSlug] = {
								...updated[addonSlug],
								is_installed: true,
							};
						} else if (action === 'activate') {
							updated[addonSlug] = {
								...updated[addonSlug],
								is_active: true,
							};
						}
						ConfigAPI.setAddons(updated);
						return updated;
					});

					if (action === 'activate') {
						setTimeout(() => window.location.reload(), 1000);
					}
				} else {
					setNotice({
						type: 'error',
						message: res.data ?? __('An error occurred', 'doublescale'),
					});
				}
			})
			.catch((err) => {
				setNotice({
					type: 'error',
					message:
						err?.message ?? __('An error occurred', 'doublescale'),
				});
			})
			.finally(() => {
				setApiAction(null);
			});
	};

	const addonList = Object.values(addons);
	const query = searchQuery.toLowerCase().trim();
	const filteredAddons = query
		? addonList.filter(
				(addon) =>
					addon.label.toLowerCase().includes(query) ||
					addon.slug.toLowerCase().includes(query) ||
					addon.description.toLowerCase().includes(query)
			)
		: addonList;

	return (
		<div className="doublescale-extensions">
			<PageHeader
				title={__('Extensions', 'doublescale')}
				subtitle={__('Extensions', 'doublescale')}
				actions={[]}
			/>

			{notice && (
				<div
					className={`p-3 rounded-lg text-sm font-medium mb-4 ${
						notice.type === 'success'
							? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
							: 'bg-red-50 text-red-700 border border-red-200'
					}`}
				>
					{notice.message}
				</div>
			)}

			<Card className="shadow-none bg-muted/50">
				<CardContent className="p-6">
					<div className="relative mb-5 max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder={__('Search extensions...', 'doublescale')}
							className="pl-9"
						/>
					</div>

					{filteredAddons.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							{query
								? __('No extensions match your search.', 'doublescale')
								: __('No extensions available.', 'doublescale')}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{filteredAddons.map((addon) => (
								<ExtensionCard
									key={addon.slug}
									addon={addon}
									apiAction={apiAction}
									onAction={handleAction}
									highlighted={highlightedSlug === addon.slug}
									cardRef={(el) => {
										cardRefs.current[addon.slug] = el;
									}}
								/>
							))}
						</div>
					)}

					<p className="text-xs text-gray-400 mt-6">
						{__(
							'Extensions require an active license. Visit your account at doublescale.io to manage your plan.',
							'doublescale'
						)}
					</p>
				</CardContent>
			</Card>
		</div>
	);
};

export default Extensions;
