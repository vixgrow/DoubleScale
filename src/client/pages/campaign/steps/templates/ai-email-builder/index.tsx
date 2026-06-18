/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getToLink, useNavigate } from '@doublescale/navigation';
import { saveTemplate } from '@/builder/api/templates';
import { STORE_KEY } from '@/stores/email-builder/constants';
import type { Campaign, EmailTemplate } from '@doublescale/client';
import {
	Sparkles,
	Loader2,
	RotateCcw,
	Check,
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	Palette,
	ChevronDown,
} from 'lucide-react';
import ConfigApi from '@doublescale/config';

const TONE_OPTIONS = [
	{ value: 'professional', label: __('Professional', 'doublescale') },
	{ value: 'casual', label: __('Casual', 'doublescale') },
	{ value: 'friendly', label: __('Friendly', 'doublescale') },
	{ value: 'urgent', label: __('Urgent', 'doublescale') },
	{ value: 'formal', label: __('Formal', 'doublescale') },
];

const COLOR_PRESETS = [
	{ value: '#1E3A8A', label: __('Navy', 'doublescale') },
	{ value: '#DC2626', label: __('Red', 'doublescale') },
	{ value: '#059669', label: __('Green', 'doublescale') },
	{ value: '#7C3AED', label: __('Purple', 'doublescale') },
	{ value: '#D97706', label: __('Amber', 'doublescale') },
	{ value: '#0891B2', label: __('Teal', 'doublescale') },
	{ value: '#BE185D', label: __('Pink', 'doublescale') },
	{ value: '#1F2937', label: __('Charcoal', 'doublescale') },
];

const BUTTON_STYLES = [
	{ value: 'rounded', label: __('Rounded', 'doublescale'), radius: 6 },
	{ value: 'pill', label: __('Pill', 'doublescale'), radius: 50 },
	{ value: 'square', label: __('Square', 'doublescale'), radius: 0 },
];

interface AIEmailBuilderProps {
	visible: boolean;
	setVisible: (visible: boolean) => void;
	campaign?: Campaign | null;
	insideBuilder?: boolean;
	onApplyTemplate?: (template: GeneratedTemplate) => void;
	/** Use when this dialog must sit above high z-index fullscreen shells (e.g. email sequence editor). */
	stackAboveFullscreenShell?: boolean;
}

interface GeneratedTemplate {
	type: string;
	value: {
		sections: any[];
		globalSettings: any;
		buttonSettings: any;
	};
}

type ViewState = 'form' | 'preview';

const AIEmailBuilder: React.FC<AIEmailBuilderProps> = ({
	visible,
	setVisible,
	campaign,
	insideBuilder = false,
	onApplyTemplate,
	stackAboveFullscreenShell = false,
}) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const [prompt, setPrompt] = useState('');
	const [tone, setTone] = useState('professional');
	const [industry, setIndustry] = useState('');
	const [primaryColor, setPrimaryColor] = useState('#1E3A8A');
	const [customColor, setCustomColor] = useState('');
	const [buttonStyle, setButtonStyle] = useState('rounded');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isApplying, setIsApplying] = useState(false);
	const [generatedTemplate, setGeneratedTemplate] =
		useState<GeneratedTemplate | null>(null);
	const [previewHtml, setPreviewHtml] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const [view, setView] = useState<ViewState>('form');
	const [showAdvanced, setShowAdvanced] = useState(false);
	const aiConfigured = ConfigApi.isAiConfigured();

	const effectiveColor = customColor || primaryColor;

	const iframeSrcDoc = previewHtml || undefined;

	const handleGenerate = async () => {
		if (prompt.trim().length < 10) {
			setError(
				__(
					'Please provide a more detailed description (at least 10 characters).',
					'doublescale'
				)
			);
			return;
		}

		setIsGenerating(true);
		setError(null);
		setGeneratedTemplate(null);
		setPreviewHtml('');

		try {
			const response = (await apiFetch({
				path: '/doublescale/v1/ai/generate-email',
				method: 'POST',
				data: {
					prompt,
					tone,
					industry,
					primary_color: effectiveColor,
					button_style: buttonStyle,
				},
			})) as {
				success: boolean;
				template: GeneratedTemplate;
				preview_html: string;
			};

			setGeneratedTemplate(response.template);
			setPreviewHtml(response.preview_html || '');
			setView('preview');
		} catch (err: any) {
			setError(
				err?.message ||
					__(
						'Failed to generate template. Please try again.',
						'doublescale'
					)
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const loadIntoBuilderStore = () => {
		if (!generatedTemplate?.value) return;
		const { sections, globalSettings, buttonSettings } =
			generatedTemplate.value;

		dispatch(STORE_KEY).resetBuilder();

		if (sections?.length) {
			dispatch(STORE_KEY).setBuilderState(sections);
		}
		if (globalSettings) {
			dispatch(STORE_KEY).updateGlobalSettings(globalSettings);
		}
		if (buttonSettings) {
			dispatch(STORE_KEY).setButtonSettings(buttonSettings);
		}
	};

	const handleUseTemplate = async () => {
		if (!generatedTemplate) return;

		setIsApplying(true);

		try {
			if (onApplyTemplate) {
				onApplyTemplate(generatedTemplate);
				handleClose();
			} else if (campaign) {
				const templateId = campaign.settings?.template_ids?.[0];

				if (templateId) {
					await apiFetch({
						path: `/doublescale/v1/templates/${templateId}`,
						method: 'PUT',
						data: {
							body: JSON.stringify(generatedTemplate),
						},
					});
				} else {
					await saveTemplate({
						name:
							campaign.name ||
							__('AI Generated Template', 'doublescale'),
						type: 'email',
						body: JSON.stringify(generatedTemplate),
						campaign_id: campaign.id,
					} as Partial<EmailTemplate> & { campaign_id?: number });
				}

				if (insideBuilder) {
					loadIntoBuilderStore();
					handleClose();
				} else {
					navigate(getToLink(`campaigns/${campaign.id}/builder`));
				}
			}
		} catch (err: any) {
			setError(
				err?.message ||
					__(
						'Failed to apply template. Please try again.',
						'doublescale'
					)
			);
		} finally {
			setIsApplying(false);
		}
	};

	const handleRegenerate = () => {
		setView('form');
		setGeneratedTemplate(null);
		setPreviewHtml('');
		setError(null);
	};

	const handleClose = () => {
		setVisible(false);
		setGeneratedTemplate(null);
		setPreviewHtml('');
		setError(null);
		setView('form');
	};

	const handleBackToForm = () => {
		setView('form');
	};

	return (
		<Dialog open={visible} onOpenChange={handleClose}>
			<DialogContent
				overlayClassName={
					stackAboveFullscreenShell ? 'z-[160010]' : undefined
				}
				className={cn(
					view === 'preview'
						? 'max-w-[900px] w-full mx-auto h-[85vh] overflow-y-auto flex flex-col'
						: 'max-w-[640px] max-h-[90vh] overflow-y-auto w-full mx-auto',
					stackAboveFullscreenShell && 'z-[160011]'
				)}
			>
				{view === 'form' ? (
					<>
						<DialogHeader className="text-center sm:text-center">
							<DialogTitle className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
								<Sparkles className="w-6 h-6 text-primary" />
								{__('AI Email Builder', 'doublescale')}
							</DialogTitle>
							<DialogDescription className="text-foreground">
								{__(
									'Describe the email you want to create and AI will generate a professional template for you.',
									'doublescale'
								)}
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col gap-4 py-2">
							{!aiConfigured && (
								<div className="flex items-center gap-1.5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
									<AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
									{__('AI is not configured. Set up your AI provider and API key in Settings > AI.', 'doublescale')}
								</div>
							)}
							<div>
								<label className="text-sm font-medium text-foreground mb-1.5 block">
									{__('Describe your email', 'doublescale')}
								</label>
								<Textarea
									placeholder={__(
										'E.g., Create a promotional email for our summer sale with 30% off all products. Include a hero section, product highlights, and a call-to-action button.',
										'doublescale'
									)}
									value={prompt}
									onChange={(e) => {
										setPrompt(e.target.value);
										if (error) setError(null);
									}}
									className="min-h-[100px] bg-white"
									disabled={isGenerating}
								/>
							</div>

							<div className="flex flex-col gap-4 sm:flex-row">
								<div className="flex-1">
									<label className="text-sm font-medium text-foreground mb-1.5 block">
										{__('Tone', 'doublescale')}
									</label>
									<select
										value={tone}
										onChange={(e) =>
											setTone(e.target.value)
										}
										className="w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
										disabled={isGenerating}
									>
										{TONE_OPTIONS.map((opt) => (
											<option
												key={opt.value}
												value={opt.value}
											>
												{opt.label}
											</option>
										))}
									</select>
								</div>
								<div className="flex-1">
									<label className="text-sm font-medium text-foreground mb-1.5 block">
										{__(
											'Industry (optional)',
											'doublescale'
										)}
									</label>
									<input
										type="text"
										value={industry}
										onChange={(e) =>
											setIndustry(e.target.value)
										}
										placeholder={__(
											'E.g., E-commerce, SaaS',
											'doublescale'
										)}
										className="w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
										disabled={isGenerating}
									/>
								</div>
							</div>

							{/* Customization */}
							<div className="border border-input rounded-lg">
								<button
									type="button"
									className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-gray-50 rounded-lg"
									onClick={() =>
										setShowAdvanced(!showAdvanced)
									}
								>
									<span className="flex items-center gap-2">
										<Palette className="w-4 h-4" />
										{__(
											'Customize Colors & Style',
											'doublescale'
										)}
									</span>
									<ChevronDown
										className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
									/>
								</button>

								{showAdvanced && (
									<div className="px-4 pb-4 flex flex-col gap-4 border-t border-input pt-4">
										{/* Color selection */}
										<div>
											<label className="text-sm font-medium text-foreground mb-2 block">
												{__(
													'Brand Color',
													'doublescale'
												)}
											</label>
										<div className="flex flex-wrap items-center gap-2">
											{COLOR_PRESETS.map((color) => (
													<button
														key={color.value}
														type="button"
														className={`w-8 h-8 rounded-full border-2 transition-all ${
															primaryColor ===
																color.value &&
															!customColor
																? 'border-foreground scale-110 ring-2 ring-offset-1 ring-foreground/30'
																: 'border-transparent hover:scale-105'
														}`}
														style={{
															backgroundColor:
																color.value,
														}}
														onClick={() => {
															setPrimaryColor(
																color.value
															);
															setCustomColor('');
														}}
														title={color.label}
													/>
												))}
												<div className="flex items-center gap-1.5 ml-2">
													<input
														type="color"
														value={
															customColor ||
															primaryColor
														}
														onChange={(e) =>
															setCustomColor(
																e.target.value
															)
														}
														className="w-8 h-8 rounded cursor-pointer border border-input"
														title={__(
															'Custom color',
															'doublescale'
														)}
													/>
													<span className="text-xs text-muted-foreground">
														{__(
															'Custom',
															'doublescale'
														)}
													</span>
												</div>
											</div>
										</div>

										{/* Button style */}
										<div>
											<label className="text-sm font-medium text-foreground mb-2 block">
												{__(
													'Button Style',
													'doublescale'
												)}
											</label>
											<div className="flex flex-col sm:flex-row gap-3">
												{BUTTON_STYLES.map((style) => (
													<button
														key={style.value}
														type="button"
														className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border text-sm font-medium transition-all ${
															buttonStyle ===
															style.value
																? 'border-primary bg-primary/5 text-primary'
																: 'border-input text-muted-foreground hover:border-primary/50'
														}`}
														style={{
															borderRadius: `${Math.min(style.radius, 12)}px`,
														}}
														onClick={() =>
															setButtonStyle(
																style.value
															)
														}
													>
														<span
															className="inline-block w-16 h-6 text-xs text-white flex items-center justify-center"
															style={{
																backgroundColor:
																	effectiveColor,
																borderRadius: `${style.radius}px`,
																display: 'flex',
															}}
														>
															{__(
																'Button',
																'doublescale'
															)}
														</span>
														<span>
															{style.label}
														</span>
													</button>
												))}
											</div>
										</div>
									</div>
								)}
							</div>

							{error && (
								<div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
									<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
									<span>{error}</span>
								</div>
							)}
						</div>

						<DialogFooter className="flex gap-2 sm:justify-between">
							<div className="flex gap-2 w-full justify-end">
								<Button
									variant="outline"
									onClick={handleClose}
									disabled={isGenerating}
									className="rounded-lg"
								>
									{__('Cancel', 'doublescale')}
								</Button>
								<Button
									variant="gradient"
									onClick={handleGenerate}
									disabled={
										!aiConfigured ||
										isGenerating ||
										prompt.trim().length < 10
									}
									className="rounded-lg min-w-[140px]"
								>
									{isGenerating ? (
										<>
											<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
											{__('Generating...', 'doublescale')}
										</>
									) : (
										<>
											<Sparkles className="w-4 h-4 mr-1.5" />
											{__('Generate', 'doublescale')}
										</>
									)}
								</Button>
							</div>
						</DialogFooter>
					</>
				) : (
					<>
						{/* Preview view */}
						<DialogHeader className="flex-shrink-0">
							<DialogTitle className="text-xl font-bold flex items-center gap-2">
								<Check className="w-5 h-5 text-green-600" />
								{__(
									'Template Generated',
									'doublescale'
								)}
							</DialogTitle>
							<DialogDescription className="text-foreground">
								{__(
									'Preview your generated template below. You can use it, regenerate with different settings, or edit it in the builder.',
									'doublescale'
								)}
							</DialogDescription>
						</DialogHeader>

						<div className="flex-1 min-h-0 border border-input rounded-lg overflow-hidden bg-gray-100">
							{iframeSrcDoc ? (
								<iframe
									title={__(
										'Email Preview',
										'doublescale'
									)}
									srcDoc={iframeSrcDoc}
									className="w-full h-full border-0"
								/>
							) : (
								<div className="flex items-center justify-center h-full text-muted-foreground text-sm">
									{__(
										'Preview not available',
										'doublescale'
									)}
								</div>
							)}
						</div>

						{error && (
							<div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex-shrink-0">
								<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
								<span>{error}</span>
							</div>
						)}

						<DialogFooter className="flex gap-2 sm:justify-between flex-shrink-0">
							<div className="flex gap-2 w-full justify-between">
								<Button
									variant="outline"
									onClick={handleBackToForm}
									className="rounded-lg"
								>
									<ArrowLeft className="w-4 h-4 mr-1.5" />
									{__('Back', 'doublescale')}
								</Button>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={handleRegenerate}
										disabled={isGenerating}
										className="rounded-lg"
									>
										<RotateCcw className="w-4 h-4 mr-1.5" />
										{__('Regenerate', 'doublescale')}
									</Button>
									<Button
										variant="gradient"
										onClick={handleUseTemplate}
										disabled={isApplying}
										className="rounded-lg"
									>
										{isApplying ? (
											<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
										) : (
											<Check className="w-4 h-4 mr-1.5" />
										)}
										{isApplying
											? __(
													'Applying...',
													'doublescale'
												)
											: __(
													'Use Template',
													'doublescale'
												)}
									</Button>
								</div>
							</div>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default AIEmailBuilder;
