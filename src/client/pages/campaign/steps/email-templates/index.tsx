/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getToLink, useLocation, useNavigate } from '@doublescale/navigation';
import { useCampaignStep } from '../shared';
import {
	AiIcon,
	MyTemplatesSidebarIcon,
	ReadyToUseIcon,
	PanelLayout, 
	PlayIcon, 
	ThreeDotsIcon
} from '@doublescale/components';
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
} from './templatesConfig';
import { getUserTemplates, renderTemplate } from '@/builder/api/templates';
import type { EmailTemplate } from '@doublescale/client';
import configApi from '@doublescale/config';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	ArrowLeft,
	ArrowUpFromLine,
	Plus,
} from 'lucide-react'; 
import AIEmailBuilder from '../templates/ai-email-builder';
import PreviewEyeIcon from '@doublescale/shared/icons/preview-eye';

const BUILDER_INITIAL_KEY = 'doublescale_campaign_builder_initial';

const resolveAssetUrls = (obj: unknown): unknown => {
	const proBase = configApi.getProPluginDirUrl();
	const base =
		typeof proBase === 'string' && proBase.length > 0
			? proBase
			: configApi.getPluginDirUrl();
	const baseUrl = base.replace(/\/?$/, '/') + 'assets/images/templates/';
	const json = JSON.stringify(obj);
	return JSON.parse(json.replace(/\{\{ASSETS_URL\}\}/g, baseUrl));
};

interface ReadyToUseTemplateCardProps {
	template: TemplateItemConfig;
	onUseTemplate: (template: TemplateItemConfig) => void;
	onPreview: (template: TemplateItemConfig) => void;
}

const ReadyToUseTemplateCard = ({
	template,
	onUseTemplate,
	onPreview,
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
			<div className="absolute right-2 top-2 z-10">
				<Button
					type="button"
					variant="secondary"
					size="icon"
					onClick={() => onPreview(template)}
					className="h-9 w-9 rounded-lg bg-white shadow-sm hover:bg-secondary"
					aria-label={__('preview', 'doublescale')}
				>
					<PreviewEyeIcon width={24} height={24} color="#3A3A98"/>
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
				onClick={() => onUseTemplate(template)}
				className="shrink-0 rounded-md bg-white text-sm font-medium"
			>
				{__('Use template', 'doublescale')}
			</Button>
		</div>
	</div>
);

interface MyTemplateCardProps {
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
			<div className="absolute right-2 top-2 z-10">
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
							<PreviewEyeIcon width={16} height={16} color="#3A3A98"/>
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
				onClick={() => onUseTemplate(template)}
				className="shrink-0 rounded-md bg-white text-sm font-medium"
			>
				{__('Use template', 'doublescale')}
			</Button>
		</div>
	</div>
);

const EmailTemplatesStep: React.FC = () => {
	const { campaign, saveCampaignStep, isNewCampaign, goToStep } =
		useCampaignStep();
	const navigate = useNavigate();
	const location = useLocation();

	const showBackToBuilder =
		campaign?.id &&
		new URLSearchParams(location.search).get('changeTemplate') === '1';

	const [activeTab, setActiveTab] = useState<'my-templates' | 'ready-to-use'>(
		'ready-to-use'
	);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
		TEMPLATE_CATEGORIES[0]?.id || 'announcements'
	);
	const [myTemplates, setMyTemplates] = useState<EmailTemplate[]>([]);
	const [myTemplatesLoading, setMyTemplatesLoading] = useState(false);
	const [aiBuilderVisible, setAiBuilderVisible] = useState(false);
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
		if (activeTab === 'my-templates' && campaign) {
			setMyTemplatesLoading(true);
			getUserTemplates()
				.then((templates) =>
					setMyTemplates(Array.isArray(templates) ? templates : [])
				)
				.catch(() => setMyTemplates([]))
				.finally(() => setMyTemplatesLoading(false));
		}
	}, [activeTab, campaign?.id]);

	const applyBuiltInTemplateAndNavigate = async (
		template: TemplateItemConfig
	) => {
		if (!campaign) return;
		try {
			const body = template.data?.body;
			if (body?.type !== 'builder' || !body?.value) return;

			const resolved = resolveAssetUrls(body.value) as {
				sections: unknown[];
				globalSettings?: Record<string, unknown>;
				buttonSettings?: Record<string, unknown>;
			};

			sessionStorage.setItem(
				`${BUILDER_INITIAL_KEY}_${campaign.id}`,
				JSON.stringify(resolved)
			);
			const ok = await saveCampaignStep('email-templates', {});
			if (!ok) {
				sessionStorage.removeItem(`${BUILDER_INITIAL_KEY}_${campaign.id}`);
				return;
			}
			const navState = isNewCampaign ? { state: { isNew: true } } : undefined;
			navigate(getToLink(`campaigns/${campaign.id}/builder`), navState);
		} catch (error) {
			console.error('Error applying template:', error);
		}
	};

	const applyUserTemplateAndNavigate = async (template: EmailTemplate) => {
		if (!campaign || !template.id) return;
		try {
			const ok = await saveCampaignStep('email-templates', {
				template_id: template.id,
			});
			if (!ok) return;
			const navState = isNewCampaign ? { state: { isNew: true } } : undefined;
			navigate(getToLink(`campaigns/${campaign.id}/builder`), navState);
		} catch (error) {
			console.error('Error applying template:', error);
		}
	};

	const handleStartFromScratch = async () => {
		if (!campaign) return;
		sessionStorage.removeItem(`${BUILDER_INITIAL_KEY}_${campaign.id}`);
		const ok = await saveCampaignStep('email-templates', {});
		if (!ok) return;
		const navState = isNewCampaign ? { state: { isNew: true } } : undefined;
		navigate(getToLink(`campaigns/${campaign.id}/builder`), navState);
	};

	const handlePreviewBuiltIn = (template: TemplateItemConfig) => {
		setPreviewTemplate(template);
		setPreviewHtml('');
		setPreviewLoading(false);
		// For built-in templates, show image as preview
		setPreviewHtml('');
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

	const handleUseBuiltInTemplate = (template: TemplateItemConfig) => {
		setPreviewTemplate(null);
		applyBuiltInTemplateAndNavigate(template);
	};

	const handleUseUserTemplate = (template: EmailTemplate) => {
		setPreviewTemplate(null);
		applyUserTemplateAndNavigate(template);
	};

	const handleExportUserTemplate = (template: EmailTemplate) => {
		if (!template.body) return;
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
		} catch (error) {
			console.error('Error exporting template:', error);
		}
	};

	const isBuiltInPreview =
		previewTemplate &&
		'data' in previewTemplate &&
		'imageUrl' in previewTemplate;
	const isUserPreview = previewTemplate && 'body' in previewTemplate;

	return (
		<div>
			<PanelLayout
				items={[
					{ label: __('Campaigns', 'doublescale'), href: 'campaigns' },
					{
						label: __('Create Campaign', 'doublescale'),
						href: `campaigns/${campaign?.id}/template`,
					},
					{ label: __('Email Builder', 'doublescale') },
				]}
				panelbtns={[
					<Button variant="secondaryDeepBlue">
						<PlayIcon />
						{__('Watch Tutorial', 'doublescale')}
					</Button>,
				]}
				type="campaign"
			>
				<Card className="overflow-hidden rounded-lg bg-[#F7F8FA] shadow-none p-6">
					{/* Header - flex with buttons */}
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							{!showBackToBuilder && campaign?.id && (
								<Button
									type="button"
									variant="secondary"
									size="icon"
									className="shrink-0 rounded-md bg-white"
									onClick={() => goToStep('template')}
									aria-label={__(
										'Back to set-up info',
										'doublescale'
									)}
								>
									<ArrowLeft className="h-4 w-4" />
								</Button>
							)}
							{showBackToBuilder && (
								<Button
									variant="outline"
									className="shrink-0 text-destructive border-destructive bg-transparent rounded-md"
									onClick={() =>
										navigate(
											getToLink(
												`campaigns/${campaign.id}/builder`
											)
										)
									}
								>
									<ArrowLeft className="h-4 w-4" />
									{__('Back to builder', 'doublescale')}
								</Button>
							)}
							<div>
								<h1 className="text-xl font-semibold text-foreground">
									{__('All templates', 'doublescale')}
								</h1>
								<p className="text-muted-foreground mt-3">
									{__(
										'Create your campaign by choosing from ready-made email templates, starting from scratch, or reusing your saved designs.',
										'doublescale'
									)}
								</p>
							</div>
						</div>
						<div className="flex gap-4 flex-shrink-0">
							<Button
								variant="secondary"
								onClick={() => setAiBuilderVisible(true)}
								className="rounded-md"
							>
								<AiIcon width={32} height={32} />
								{__('Generate With AI', 'doublescale')}
							</Button>
							<Button
								variant="default"
								onClick={handleStartFromScratch}
								className="rounded-md"
							>
								<Plus className="h-8 w-8" />
								{__('Start From Scratch', 'doublescale')}
							</Button>
						</div>
					</div>
					<div className="border-b border-border py-3" />
					{/* Tabs - in card with white bg */}
					<Card className="mt-6 bg-white border border-border shadow-none">
						<CardContent className="p-0">
							<div className="flex gap-8 px-4 pt-2 pb-0">
								<button
									type="button"
									onClick={() => setActiveTab('my-templates')}
									className={`flex items-center gap-2 pb-2 -mb-px transition-colors ${activeTab === 'my-templates'
										? 'text-primary border-b-2 border-primary'
										: 'text-muted-foreground hover:text-primary'
										}`}
								>
									<MyTemplatesSidebarIcon
										width={24}
										height={24}
									/>
									<span className="text-lg">
										{__('My Templates', 'doublescale')}
									</span>
								</button>
								<button
									type="button"
									onClick={() => setActiveTab('ready-to-use')}
									className={`flex items-center gap-2 pb-2 -mb-px transition-colors ${activeTab === 'ready-to-use'
										? 'text-primary border-b-2 border-primary'
										: 'text-muted-foreground hover:text-primary'
										}`}
								>
									<ReadyToUseIcon width={24} height={24} />
									<span className="text-lg">
										{__('Ready-to-use', 'doublescale')}
									</span>
								</button>
							</div>
						</CardContent>
					</Card>

					{/* Tab content */}
					{activeTab === 'my-templates' ? (
						<div className="min-h-[400px] pt-6">
							<Card className="h-full min-h-[300px] overflow-auto border border-border shadow-none bg-white">
								<CardContent className="p-6">
									{myTemplatesLoading ? (
										<div className="flex items-center justify-center py-16">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
											{myTemplates.map((template) => (
												<MyTemplateCard
													key={template.id}
													template={template}
													onUseTemplate={
														handleUseUserTemplate
													}
													onPreview={
														handlePreviewUserTemplate
													}
													onExport={
														handleExportUserTemplate
													}
												/>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					) : (
						<div className="flex gap-4 min-h-[400px] pt-6">
							<div className="w-1/4 flex-shrink-0">
								<Card className="h-full min-h-[300px] border border-border shadow-none bg-white">
									<CardContent className="p-6">
										<h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
											{__('ALL CATEGORIES', 'doublescale')}
										</h3>
										<nav className="flex flex-col gap-2">
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
													className={`text-left p-2 rounded-lg text-sm transition-colors ${selectedCategoryId ===
														category.id
														? 'bg-secondary text-primary font-medium'
														: 'text-foreground hover:bg-muted font-normal'
														}`}
												>
													{category.title}
												</button>
											))}
										</nav>
									</CardContent>
								</Card>
							</div>
							<div className="flex-1 min-w-0">
								<Card className="h-full min-h-[300px] overflow-auto border border-border shadow-none bg-white">
									<CardContent className="p-6">
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
											{displayTemplates.map(
												(template) => (
													<ReadyToUseTemplateCard
														key={template.id}
														template={template}
														onUseTemplate={
															handleUseBuiltInTemplate
														}
														onPreview={
															handlePreviewBuiltIn
														}
													/>
												)
											)}
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					)}
				</Card>
			</PanelLayout>

			{/* Preview Dialog */}
			<Dialog
				open={!!previewTemplate}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewTemplate(null);
					}
				}}
			>
				<DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden z-[100000]">
					<DialogHeader>
						<DialogTitle className="text-center">
							{__('Preview template', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					<div className="flex-1 overflow-auto mt-4">
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
									className="max-w-full h-auto rounded-lg border"
								/>
							</div>
						)}
						{isUserPreview && (
							<>
								{previewLoading ? (
									<div className="flex flex-col items-center justify-center min-h-[400px]">
										<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
										<p className="text-muted-foreground mt-4">
											{__(
												'Loading preview...',
												'doublescale'
											)}
										</p>
									</div>
								) : previewHtml ? (
									<iframe
										srcDoc={previewHtml}
										className="w-full min-h-[600px] border-0"
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

			<AIEmailBuilder
				visible={aiBuilderVisible}
				setVisible={setAiBuilderVisible}
				campaign={campaign}
			/>
		</div>
	);
};

export default EmailTemplatesStep;
