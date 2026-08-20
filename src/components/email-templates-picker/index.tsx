/**
 * Reusable email template gallery (ready-to-use + my templates).
 * Used by the campaign email-templates step and embedded OpenBuilder flows.
 */

import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

import {
	AiIcon,
	MyTemplatesSidebarIcon,
	PremiumIcon,
	ReadyToUseIcon,
	ThreeDotsIcon,
} from '@doublescale/components';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	TEMPLATE_CATEGORIES,
	type TemplateItemConfig,
} from '@/client/pages/campaign/steps/email-templates/templatesConfig';
import {
	getTemplate,
	getUserTemplates,
	renderTemplate,
} from '@/builder/api/templates';
import type { EmailTemplate } from '@doublescale/client';
import type { BuilderData } from '@/builder/index';
import configApi from '@doublescale/config';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, ArrowUpFromLine, Plus } from 'lucide-react';
import PreviewEyeIcon from '@doublescale/shared/icons/preview-eye';

const TemplatePremiumBadge = () => (
	<div
		className="rounded-full bg-white p-1 shrink-0"
		title={__('Pro feature', 'doublescale')}
	>
		<PremiumIcon width={20} height={20} />
	</div>
);

const resolveAssetUrls = (obj: unknown): unknown => {
	const baseUrl =
		configApi.getPluginDirUrl().replace(/\/?$/, '/') + 'assets/images/';
	const json = JSON.stringify(obj);
	return JSON.parse(json.replace(/\{\{ASSETS_URL\}\}/g, baseUrl));
};

interface TemplateCardProGateProps {
	isProActive: boolean;
	onUpgrade: () => void;
	upgradeLabel: string;
	upgradeDisabled: boolean;
}

interface ReadyToUseTemplateCardProps extends TemplateCardProGateProps {
	template: TemplateItemConfig;
	onUseTemplate: (template: TemplateItemConfig) => void;
	onPreview: (template: TemplateItemConfig) => void;
}

const ReadyToUseTemplateCard = ({
	template,
	onUseTemplate,
	onPreview,
	isProActive,
	onUpgrade,
	upgradeLabel,
	upgradeDisabled,
}: ReadyToUseTemplateCardProps) => (
	<div className="flex flex-col gap-3 rounded-lg border border-border bg-[#F7F8FA] p-4">
		<div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
			{template.imageUrl ? (
				<img
					src={template.imageUrl}
					alt={template.title}
					className="h-full w-full object-cover"
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center text-muted-foreground">
					{template.title}
				</div>
			)}
			<div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
				{!isProActive && <TemplatePremiumBadge />}
				<Button
					type="button"
					variant="secondary"
					size="icon"
					onClick={() => onPreview(template)}
					className="h-9 w-9 rounded-lg bg-white shadow-sm hover:bg-secondary"
					aria-label={__('preview', 'doublescale')}
				>
					<PreviewEyeIcon width={24} height={24} color="#3A3A98" />
				</Button>
			</div>
		</div>
		<div className="flex items-center justify-between gap-3">
			<h3 className="min-w-0 flex-1 text-left font-medium leading-snug text-foreground line-clamp-2">
				{template.title}
			</h3>
			<Button
				size="sm"
				variant="secondary"
				onClick={() =>
					isProActive ? onUseTemplate(template) : onUpgrade()
				}
				disabled={!isProActive && upgradeDisabled}
				className="shrink-0 rounded-md bg-white text-sm font-medium"
			>
				{isProActive ? __('Use', 'doublescale') : upgradeLabel}
			</Button>
		</div>
	</div>
);

interface MyTemplateCardProps extends TemplateCardProGateProps {
	template: EmailTemplate;
	onUseTemplate: (template: EmailTemplate) => void;
	onPreview: (template: EmailTemplate) => void;
	onExport: (template: EmailTemplate) => void;
}

const MyTemplateCard = ({
	template,
	onUseTemplate,
	onPreview,
	onExport,
	isProActive,
	onUpgrade,
	upgradeLabel,
	upgradeDisabled,
}: MyTemplateCardProps) => (
	<div className="flex flex-col gap-3 rounded-lg border border-border bg-[#F7F8FA] p-4">
		<div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted border border-border">
			{template.thumbnail ? (
				<img
					src={template.thumbnail}
					alt={template.name}
					className="h-full w-full object-cover"
				/>
			) : (
				<div className="flex h-full w-full items-center justify-center bg-muted/50 text-muted-foreground">
					{template.name}
				</div>
			)}
			<div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
				{!isProActive && <TemplatePremiumBadge />}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="secondary"
							size="icon"
							className="h-9 w-9 rounded-lg bg-white shadow-sm hover:bg-secondary"
							aria-label={__('More options', 'doublescale')}
						>
							<ThreeDotsIcon width={24} height={24} />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="min-w-[10rem]">
						<DropdownMenuItem
							onSelect={() => onPreview(template)}
							className="cursor-pointer gap-2"
						>
							<PreviewEyeIcon
								width={16}
								height={16}
								color="#3A3A98"
							/>
							{__('Preview', 'doublescale')}
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={() => onExport(template)}
							className="cursor-pointer gap-2"
						>
							<ArrowUpFromLine className="h-4 w-4" />
							{__('Export', 'doublescale')}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
		<div className="flex items-center justify-between gap-3">
			<h3 className="min-w-0 flex-1 text-left font-medium leading-snug text-foreground line-clamp-2">
				{template.name}
			</h3>
			<Button
				size="sm"
				variant="secondary"
				onClick={() =>
					isProActive ? onUseTemplate(template) : onUpgrade()
				}
				disabled={!isProActive && upgradeDisabled}
				className="shrink-0 rounded-md bg-white text-sm font-medium"
			>
				{isProActive ? __('Use', 'doublescale') : upgradeLabel}
			</Button>
		</div>
	</div>
);

export interface EmailTemplatesPickerProps {
	onApplyBuilderData: (data: BuilderData) => void;
	onStartFromScratch: () => void;
	onGenerateWithAi?: () => void;
	onBack?: () => void;
	showBackButton?: boolean;
	/**
	 * When false, the gallery skips the Pro upsell entirely. Embedded builder
	 * flows (automation "Send Email", email sequences) are already behind a Pro
	 * action, so re-gating the templates there is wrong.
	 */
	requireProForTemplates?: boolean;
}

export const EmailTemplatesPicker: React.FC<EmailTemplatesPickerProps> = ({
	onApplyBuilderData,
	onStartFromScratch,
	onGenerateWithAi,
	onBack,
	showBackButton = false,
	requireProForTemplates = true,
}) => {
	const { createNotice } = useDispatch('doublescale/core');
	const {
		isProActive: isProActiveFromHook,
		isInstalling,
		isActivating,
		handleUpgradeClick,
		getUpgradeButtonText,
	} = useProUpgrade();
	const isProActive = requireProForTemplates ? isProActiveFromHook : true;
	const upgradeLabel = getUpgradeButtonText();
	const upgradeDisabled = isInstalling || isActivating;
	const handleTemplateUpgrade = () => handleUpgradeClick();

	const [activeTab, setActiveTab] = useState<'my-templates' | 'ready-to-use'>(
		'ready-to-use'
	);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
		TEMPLATE_CATEGORIES[0]?.id || 'announcements'
	);
	const [myTemplates, setMyTemplates] = useState<EmailTemplate[]>([]);
	const [myTemplatesLoading, setMyTemplatesLoading] = useState(false);
	const [previewTemplate, setPreviewTemplate] = useState<
		TemplateItemConfig | EmailTemplate | null
	>(null);
	const [previewHtml, setPreviewHtml] = useState<string>('');
	const [previewLoading, setPreviewLoading] = useState(false);

	const selectedCategory = TEMPLATE_CATEGORIES.find(
		(c) => c.id === selectedCategoryId
	);
	const displayTemplates = selectedCategory?.templates || [];

	useEffect(() => {
		if (activeTab === 'my-templates') {
			setMyTemplatesLoading(true);
			getUserTemplates()
				.then((templates) =>
					setMyTemplates(Array.isArray(templates) ? templates : [])
				)
				.catch(() => setMyTemplates([]))
				.finally(() => setMyTemplatesLoading(false));
		}
	}, [activeTab]);

	const applyBuiltInTemplate = (template: TemplateItemConfig) => {
		const body = template.data?.body;
		if (body?.type !== 'builder' || !body?.value) {
			return;
		}

		const resolved = resolveAssetUrls(body.value) as BuilderData;
		onApplyBuilderData(resolved);
	};

	const applyUserTemplate = async (template: EmailTemplate) => {
		if (!template.id) {
			return;
		}

		try {
			const loaded = await getTemplate(template.id);
			const body =
				typeof loaded.body === 'string'
					? JSON.parse(loaded.body)
					: loaded.body;

			if (body?.type === 'builder' && body.value) {
				onApplyBuilderData(body.value as BuilderData);
			}
		} catch (error) {
			console.error('Error loading template:', error);
			createNotice({
				type: 'error',
				message: __(
					'Failed to load the selected template.',
					'doublescale'
				),
			});
		}
	};

	const handlePreviewBuiltIn = (template: TemplateItemConfig) => {
		setPreviewTemplate(template);
		setPreviewHtml('');
		setPreviewLoading(false);
	};

	const handlePreviewUserTemplate = async (template: EmailTemplate) => {
		setPreviewTemplate(template);
		setPreviewLoading(true);
		setPreviewHtml('');
		try {
			if (template.id) {
				const html = await renderTemplate(template.id);
				setPreviewHtml(html);
			}
		} catch {
			setPreviewHtml(
				'<p style="color: red; padding: 20px; text-align: center;">Failed to load preview</p>'
			);
		} finally {
			setPreviewLoading(false);
		}
	};

	const handleExportUserTemplate = (template: EmailTemplate) => {
		if (!template.body) {
			createNotice({
				type: 'error',
				message: __(
					'This template has no content to export.',
					'doublescale'
				),
			});
			return;
		}
		try {
			const bodyData =
				typeof template.body === 'string'
					? JSON.parse(template.body)
					: template.body;
			const exportData = {
				name: template.name,
				type: template.type,
				body: bodyData,
			};
			const blob = new Blob([JSON.stringify(exportData, null, 2)], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${template.name || 'template'}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			createNotice({
				type: 'success',
				message: __('Template exported successfully.', 'doublescale'),
			});
		} catch (error) {
			console.error('Error exporting template:', error);
			createNotice({
				type: 'error',
				message: __('Failed to export template.', 'doublescale'),
			});
		}
	};

	const isBuiltInPreview =
		previewTemplate &&
		'data' in previewTemplate &&
		'imageUrl' in previewTemplate;
	const isUserPreview = previewTemplate && 'body' in previewTemplate;

	return (
		<div className="flex min-h-0 flex-col">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-start gap-4">
					{showBackButton && onBack ? (
						<Button
							type="button"
							variant="secondary"
							size="icon"
							className="shrink-0 rounded-md bg-white"
							onClick={onBack}
							aria-label={__('Back', 'doublescale')}
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
					) : null}
					<div>
						<h1 className="text-xl font-semibold text-foreground">
							{__('All templates', 'doublescale')}
						</h1>
						<p className="mt-3 text-muted-foreground">
							{__(
								'Create your email by choosing from ready-made templates, starting from scratch, or reusing your saved designs.',
								'doublescale'
							)}
						</p>
					</div>
				</div>
				<div className="flex shrink-0 flex-col gap-4 lg:flex-row">
					{onGenerateWithAi ? (
						<Button
							variant="secondary"
							onClick={onGenerateWithAi}
							className="rounded-md"
						>
							<AiIcon width={32} height={32} />
							{__('Generate With AI', 'doublescale')}
						</Button>
					) : null}
					<Button
						variant="default"
						onClick={onStartFromScratch}
						className="rounded-md"
					>
						<Plus className="h-8 w-8" />
						{__('Start From Scratch', 'doublescale')}
					</Button>
				</div>
			</div>

			<div className="border-b border-border py-3" />

			<Card className="mt-6 min-w-0 border border-border bg-white shadow-none">
				<CardContent className="max-sm:overflow-x-auto p-0 max-sm:overflow-y-hidden">
					<div className="flex gap-8 px-4 pt-2 pb-0 max-sm:w-max max-sm:flex-nowrap">
						<button
							type="button"
							onClick={() => setActiveTab('my-templates')}
							className={`flex shrink-0 items-center gap-2 pb-2 -mb-px transition-colors ${
								activeTab === 'my-templates'
									? 'text-primary border-b-2 border-primary'
									: 'text-muted-foreground hover:text-primary'
							}`}
						>
							<MyTemplatesSidebarIcon width={24} height={24} />
							<span className="text-base lg:text-lg">
								{__('My Templates', 'doublescale')}
							</span>
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('ready-to-use')}
							className={`flex shrink-0 items-center gap-2 pb-2 -mb-px transition-colors ${
								activeTab === 'ready-to-use'
									? 'text-primary border-b-2 border-primary'
									: 'text-muted-foreground hover:text-primary'
							}`}
						>
							<ReadyToUseIcon width={24} height={24} />
							<span className="text-base lg:text-lg">
								{__('Ready-to-use', 'doublescale')}
							</span>
						</button>
					</div>
				</CardContent>
			</Card>

			{activeTab === 'my-templates' ? (
				<div className="min-h-[400px] pt-6">
					<Card className="h-full min-h-[300px] overflow-auto border border-border bg-white shadow-none">
						<CardContent className="p-6">
							{myTemplatesLoading ? (
								<div className="flex items-center justify-center py-16">
									<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
								</div>
							) : myTemplates.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
									<MyTemplatesSidebarIcon
										width={64}
										height={64}
									/>
									<p className="text-center">
										{__(
											'No saved templates yet. Create one in the builder and save it as a template.',
											'doublescale'
										)}
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{myTemplates.map((template) => (
										<MyTemplateCard
											key={template.id}
											template={template}
											isProActive={isProActive}
											onUpgrade={handleTemplateUpgrade}
											upgradeLabel={upgradeLabel}
											upgradeDisabled={upgradeDisabled}
											onUseTemplate={(item) => {
												setPreviewTemplate(null);
												void applyUserTemplate(item);
											}}
											onPreview={handlePreviewUserTemplate}
											onExport={handleExportUserTemplate}
										/>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			) : (
				<div className="flex min-h-[400px] flex-col gap-4 pt-6 lg:flex-row">
					<div className="w-full shrink-0 lg:w-1/4">
						<Card className="h-full border border-border bg-white shadow-none lg:min-h-[300px]">
							<CardContent className="p-6">
								<h3 className="mb-2 text-center text-sm uppercase tracking-wider text-muted-foreground lg:text-left">
									{__('ALL CATEGORIES', 'doublescale')}
								</h3>
								<nav className="flex flex-row flex-wrap justify-center gap-2 max-lg:overflow-x-auto lg:flex-col lg:justify-start">
									{TEMPLATE_CATEGORIES.filter(
										(c) => c.templates.length > 0
									).map((category) => (
										<button
											key={category.id}
											type="button"
											onClick={() =>
												setSelectedCategoryId(
													category.id
												)
											}
											className={`shrink-0 rounded-lg p-2 text-left text-sm transition-colors max-lg:whitespace-nowrap lg:shrink ${
												selectedCategoryId ===
												category.id
													? 'bg-secondary font-medium text-primary'
													: 'font-normal text-foreground hover:bg-muted'
											}`}
										>
											{category.title}
										</button>
									))}
								</nav>
							</CardContent>
						</Card>
					</div>
					<div className="min-w-0 flex-1">
						<Card className="h-full min-h-[300px] overflow-auto border border-border bg-white shadow-none">
							<CardContent className="p-6">
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{displayTemplates.map((template) => (
										<ReadyToUseTemplateCard
											key={template.id}
											template={template}
											isProActive={isProActive}
											onUpgrade={handleTemplateUpgrade}
											upgradeLabel={upgradeLabel}
											upgradeDisabled={upgradeDisabled}
											onUseTemplate={(item) => {
												setPreviewTemplate(null);
												applyBuiltInTemplate(item);
											}}
											onPreview={handlePreviewBuiltIn}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			)}

			<Dialog
				open={!!previewTemplate}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewTemplate(null);
					}
				}}
			>
				<DialogContent
					className="z-[160026] flex max-h-[90vh] max-w-4xl flex-col overflow-hidden"
					overlayClassName="z-[160026]"
				>
					<DialogHeader>
						<DialogTitle className="text-center">
							{__('Preview template', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					<div className="mt-4 flex-1 overflow-auto">
						{isBuiltInPreview && previewTemplate && (
							<div className="flex justify-center">
								<img
									src={
										(previewTemplate as TemplateItemConfig)
											.imageUrl
									}
									alt={
										(previewTemplate as TemplateItemConfig)
											.title
									}
									className="h-auto max-w-full rounded-lg border"
								/>
							</div>
						)}
						{isUserPreview && (
							<>
								{previewLoading ? (
									<div className="flex min-h-[400px] flex-col items-center justify-center">
										<div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
										<p className="mt-4 text-muted-foreground">
											{__(
												'Loading preview...',
												'doublescale'
											)}
										</p>
									</div>
								) : previewHtml ? (
									<iframe
										srcDoc={previewHtml}
										className="min-h-[600px] w-full border-0"
										title={__(
											'Template Preview',
											'doublescale'
										)}
										sandbox="allow-same-origin"
									/>
								) : null}
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default EmailTemplatesPicker;
