import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import ConfigApi from '@doublescale/config';
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
	ChevronRight,
	Mail,
	Clock,
} from 'lucide-react';

import { EMAIL_SEQUENCE_TYPE, SEQUENCE_MAIL_TYPE, END_POINT } from '../constants';
import type { AISequenceEmail, AISequenceGeneratorProps } from '../types';

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

type ViewState = 'form' | 'preview';

const AISequenceGenerator: React.FC<AISequenceGeneratorProps> = ({
	visible,
	setVisible,
	onSuccess,
	handleNavigate,
}) => {
	const { createNotice } = useDispatch('doublescale/core');

	const [prompt, setPrompt] = useState('');
	const [emailCount, setEmailCount] = useState(5);
	const [sequenceName, setSequenceName] = useState('');
	const [tone, setTone] = useState('professional');
	const [industry, setIndustry] = useState('');
	const [primaryColor, setPrimaryColor] = useState('#1E3A8A');
	const [customColor, setCustomColor] = useState('');
	const [buttonStyle, setButtonStyle] = useState('rounded');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [generatedEmails, setGeneratedEmails] = useState<AISequenceEmail[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [view, setView] = useState<ViewState>('form');
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [expandedEmail, setExpandedEmail] = useState<number | null>(0);
	const aiConfigured = ConfigApi.isAiConfigured();

	const effectiveColor = customColor || primaryColor;

	const handleGenerate = async () => {
		if (prompt.trim().length < 10) {
			setError(
				__('Please provide a more detailed description (at least 10 characters).', 'doublescale')
			);
			return;
		}

		setIsGenerating(true);
		setError(null);
		setGeneratedEmails([]);

		try {
			const response = (await apiFetch({
				path: '/doublescale/v1/ai/generate-email-sequence',
				method: 'POST',
				data: {
					prompt,
					email_count: emailCount,
					tone,
					industry,
					primary_color: effectiveColor,
					button_style: buttonStyle,
				},
			})) as {
				success: boolean;
				emails: AISequenceEmail[];
			};

			if (response.emails?.length) {
				setGeneratedEmails(response.emails);
				if (!sequenceName.trim()) {
					setSequenceName(prompt.slice(0, 80));
				}
				setView('preview');
				setExpandedEmail(0);
			} else {
				setError(__('No emails were generated. Please try a different prompt.', 'doublescale'));
			}
		} catch (err: any) {
			setError(
				err?.message || __('Failed to generate sequence. Please try again.', 'doublescale')
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleCreateSequence = async () => {
		if (!generatedEmails.length || !sequenceName.trim()) return;

		setIsCreating(true);
		setError(null);

		try {
			const parentResponse = (await apiFetch({
				path: END_POINT,
				method: 'POST',
				data: {
					name: sequenceName,
					description: prompt.slice(0, 200),
					type: EMAIL_SEQUENCE_TYPE,
					status: 'draft',
				},
			})) as { id: number };

			const parentId = parentResponse.id;

			for (let i = 0; i < generatedEmails.length; i++) {
				const email = generatedEmails[i];
				await apiFetch({
					path: END_POINT,
					method: 'POST',
					data: {
						type: SEQUENCE_MAIL_TYPE,
						parent_id: parentId,
						name: email.subject,
						subject: email.subject,
						email_body: JSON.stringify(email.template),
						description: __('AI generated sequence email', 'doublescale'),
						status: 'draft',
						settings: {
							pre_header: '',
							delay: {
								value: email.delay_days,
								unit: 'days',
							},
							sending_time_range: { from: '', to: '' },
							enable_specific_days: false,
							days: {
								monday: false,
								tuesday: false,
								wednesday: false,
								thursday: false,
								friday: false,
								saturday: false,
								sunday: false,
							},
							add_utm_parameters: false,
							utm_parameters: {
								campaign_source: '',
								campaign_medium: '',
								campaign_name: '',
								campaign_term: '',
								campaign_content: '',
							},
							templates: [],
						},
					},
				});
			}

			createNotice({
				type: 'success',
				message: __('Email sequence created successfully with AI-generated emails!', 'doublescale'),
			});

			handleClose();
			onSuccess();

			if (handleNavigate) {
				handleNavigate(`email-sequences/${parentId}`);
			}
		} catch (err: any) {
			setError(
				err?.message || __('Failed to create sequence. Please try again.', 'doublescale')
			);
		} finally {
			setIsCreating(false);
		}
	};

	const handleRegenerate = () => {
		setView('form');
		setGeneratedEmails([]);
		setError(null);
	};

	const handleClose = () => {
		setVisible(false);
		setGeneratedEmails([]);
		setError(null);
		setView('form');
		setPrompt('');
		setSequenceName('');
	};

	return (
		<Dialog open={visible} onOpenChange={handleClose}>
			<DialogContent
				className={
					view === 'preview'
						? 'max-w-[960px] w-full mx-auto h-[90vh] flex flex-col'
						: 'max-w-[640px] w-full mx-auto'
				}
			>
				{view === 'form' ? (
					<>
						<DialogHeader className="text-center sm:text-center">
							<DialogTitle className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
								<Sparkles className="w-6 h-6 text-primary" />
								{__('AI Sequence Generator', 'doublescale')}
							</DialogTitle>
							<DialogDescription className="text-foreground">
								{__('Describe your email sequence and AI will generate all the emails with professional templates.', 'doublescale')}
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
								<Label className="text-sm font-medium text-foreground mb-1.5 block">
									{__('Describe your email sequence', 'doublescale')}
								</Label>
								<Textarea
									placeholder={__(
										'E.g., Onboarding sequence for new SaaS trial users. Welcome them, show key features, share tips, offer upgrade incentive.',
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

							<div className="flex gap-4">
								<div className="w-[140px]">
									<Label className="text-sm font-medium text-foreground mb-1.5 block">
										{__('Number of Emails', 'doublescale')}
									</Label>
									<Input
										type="number"
										min={2}
										max={10}
										value={emailCount}
										onChange={(e) => setEmailCount(Math.min(10, Math.max(2, parseInt(e.target.value) || 2)))}
										className="h-10 bg-white"
										disabled={isGenerating}
									/>
								</div>
								<div className="flex-1">
									<Label className="text-sm font-medium text-foreground mb-1.5 block">
										{__('Tone', 'doublescale')}
									</Label>
									<select
										value={tone}
										onChange={(e) => setTone(e.target.value)}
										className="w-full h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
										disabled={isGenerating}
									>
										{TONE_OPTIONS.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								</div>
								<div className="flex-1">
									<Label className="text-sm font-medium text-foreground mb-1.5 block">
										{__('Industry (optional)', 'doublescale')}
									</Label>
									<Input
										type="text"
										value={industry}
										onChange={(e) => setIndustry(e.target.value)}
										placeholder={__('E.g., E-commerce, SaaS', 'doublescale')}
										className="h-10 bg-white"
										disabled={isGenerating}
									/>
								</div>
							</div>

							{/* Customization */}
							<div className="border border-input rounded-lg">
								<button
									type="button"
									className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground hover:bg-gray-50 rounded-lg"
									onClick={() => setShowAdvanced(!showAdvanced)}
								>
									<span className="flex items-center gap-2">
										<Palette className="w-4 h-4" />
										{__('Customize Colors & Style', 'doublescale')}
									</span>
									<ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
								</button>

								{showAdvanced && (
									<div className="px-4 pb-4 flex flex-col gap-4 border-t border-input pt-4">
										<div>
											<Label className="text-sm font-medium text-foreground mb-2 block">
												{__('Brand Color', 'doublescale')}
											</Label>
											<div className="flex items-center gap-2 flex-wrap">
												{COLOR_PRESETS.map((color) => (
													<button
														key={color.value}
														type="button"
														className={`w-8 h-8 rounded-full border-2 transition-all ${
															primaryColor === color.value && !customColor
																? 'border-foreground scale-110 ring-2 ring-offset-1 ring-foreground/30'
																: 'border-transparent hover:scale-105'
														}`}
														style={{ backgroundColor: color.value }}
														onClick={() => {
															setPrimaryColor(color.value);
															setCustomColor('');
														}}
														title={color.label}
													/>
												))}
												<div className="flex items-center gap-1.5 ml-2">
													<input
														type="color"
														value={customColor || primaryColor}
														onChange={(e) => setCustomColor(e.target.value)}
														className="w-8 h-8 rounded cursor-pointer border border-input"
														title={__('Custom color', 'doublescale')}
													/>
													<span className="text-xs text-muted-foreground">
														{__('Custom', 'doublescale')}
													</span>
												</div>
											</div>
										</div>

										<div>
											<Label className="text-sm font-medium text-foreground mb-2 block">
												{__('Button Style', 'doublescale')}
											</Label>
											<div className="flex gap-3">
												{BUTTON_STYLES.map((style) => (
													<button
														key={style.value}
														type="button"
														className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border text-sm font-medium transition-all ${
															buttonStyle === style.value
																? 'border-primary bg-primary/5 text-primary'
																: 'border-input text-muted-foreground hover:border-primary/50'
														}`}
														style={{ borderRadius: `${Math.min(style.radius, 12)}px` }}
														onClick={() => setButtonStyle(style.value)}
													>
														<span
															className="inline-block w-16 h-6 text-xs text-white flex items-center justify-center"
															style={{
																backgroundColor: effectiveColor,
																borderRadius: `${style.radius}px`,
																display: 'flex',
															}}
														>
															{__('Button', 'doublescale')}
														</span>
														<span>{style.label}</span>
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
								<Button variant="outline" onClick={handleClose} disabled={isGenerating} className="rounded-lg">
									{__('Cancel', 'doublescale')}
								</Button>
								<Button
									variant="gradient"
									onClick={handleGenerate}
									disabled={!aiConfigured || isGenerating || prompt.trim().length < 10}
									className="rounded-lg min-w-[180px]"
								>
									{isGenerating ? (
										<>
											<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
											{__('Generating Sequence...', 'doublescale')}
										</>
									) : (
										<>
											<Sparkles className="w-4 h-4 mr-1.5" />
											{__('Generate Sequence', 'doublescale')}
										</>
									)}
								</Button>
							</div>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader className="flex-shrink-0">
							<DialogTitle className="text-xl font-bold flex items-center gap-2">
								<Check className="w-5 h-5 text-green-600" />
								{__('Sequence Generated', 'doublescale')} — {generatedEmails.length} {__('Emails', 'doublescale')}
							</DialogTitle>
							<DialogDescription className="text-foreground">
								{__('Review the generated emails below. Click "Create Sequence" to save them all.', 'doublescale')}
							</DialogDescription>
						</DialogHeader>

						{/* Sequence Name */}
						<div className="flex-shrink-0 flex items-center gap-3">
							<Label className="text-sm font-medium whitespace-nowrap">
								{__('Sequence Name:', 'doublescale')}
							</Label>
							<Input
								type="text"
								value={sequenceName}
								onChange={(e) => setSequenceName(e.target.value)}
								placeholder={__('Enter a name for your sequence', 'doublescale')}
								className="h-9 bg-white"
							/>
						</div>

						{/* Email List */}
						<div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
							{generatedEmails.map((email, index) => (
								<div
									key={index}
									className="border border-input rounded-lg overflow-hidden"
								>
									<button
										type="button"
										className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
										onClick={() =>
											setExpandedEmail(expandedEmail === index ? null : index)
										}
									>
										<div className="flex items-center gap-3">
											<span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
												{index + 1}
											</span>
											<div>
												<p className="text-sm font-semibold text-foreground">
													{email.subject}
												</p>
												<div className="flex items-center gap-3 mt-0.5">
													<span className="text-xs text-muted-foreground flex items-center gap-1">
														<Clock className="w-3 h-3" />
														{email.delay_days === 0
															? __('Immediately', 'doublescale')
															: email.delay_days === 1
																? __('After 1 day', 'doublescale')
																: `${__('After', 'doublescale')} ${email.delay_days} ${__('days', 'doublescale')}`}
													</span>
													<span className="text-xs text-muted-foreground flex items-center gap-1">
														<Mail className="w-3 h-3" />
														{__('Email', 'doublescale')} {index + 1} {__('of', 'doublescale')} {generatedEmails.length}
													</span>
												</div>
											</div>
										</div>
										<ChevronRight
											className={`w-4 h-4 text-muted-foreground transition-transform ${
												expandedEmail === index ? 'rotate-90' : ''
											}`}
										/>
									</button>

									{expandedEmail === index && (
										<div className="border-t border-input bg-gray-100 p-2">
											{email.preview_html ? (
												<iframe
													title={`${__('Email Preview', 'doublescale')} ${index + 1}`}
													srcDoc={email.preview_html}
													className="w-full h-[400px] border border-input rounded bg-white"
												/>
											) : (
												<div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
													{__('Preview not available', 'doublescale')}
												</div>
											)}
										</div>
									)}
								</div>
							))}
						</div>

						{error && (
							<div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex-shrink-0">
								<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
								<span>{error}</span>
							</div>
						)}

						<DialogFooter className="flex gap-2 sm:justify-between flex-shrink-0">
							<div className="flex gap-2 w-full justify-between">
								<Button variant="outline" onClick={handleRegenerate} className="rounded-lg">
									<ArrowLeft className="w-4 h-4 mr-1.5" />
									{__('Back', 'doublescale')}
								</Button>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={handleRegenerate}
										disabled={isCreating}
										className="rounded-lg"
									>
										<RotateCcw className="w-4 h-4 mr-1.5" />
										{__('Regenerate', 'doublescale')}
									</Button>
									<Button
										variant="gradient"
										onClick={handleCreateSequence}
										disabled={isCreating || !sequenceName.trim()}
										className="rounded-lg min-w-[180px]"
									>
										{isCreating ? (
											<>
												<Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
												{__('Creating...', 'doublescale')}
											</>
										) : (
											<>
												<Check className="w-4 h-4 mr-1.5" />
												{__('Create Sequence', 'doublescale')}
											</>
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

export default AISequenceGenerator;
