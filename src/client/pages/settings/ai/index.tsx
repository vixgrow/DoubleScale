/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const AI_PROVIDERS = [
	{ value: '', label: __('Select a provider', 'doublescale') },
	{ value: 'openai', label: 'OpenAI' },
	{ value: 'anthropic', label: 'Anthropic (Claude)' },
	{ value: 'gemini', label: 'Google Gemini' },
	{
		value: 'custom',
		label: __('Custom / OpenAI-compatible', 'doublescale'),
	},
];

const CUSTOM_PROVIDER_EXAMPLES = [
	'OpenRouter (https://openrouter.ai/api/v1)',
	'Ollama (http://localhost:11434/v1)',
	'LM Studio (http://localhost:1234/v1)',
	'Groq (https://api.groq.com/openai/v1)',
	'Azure OpenAI',
];

interface AISettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

interface ModelOption {
	value: string;
	label: string;
}


const AISettings: React.FC<AISettingsProps> = ({ settings, onChange }) => {
	const [isTesting, setIsTesting] = useState(false);
	const [isFetchingModels, setIsFetchingModels] = useState(false);
	const [models, setModels] = useState<ModelOption[]>([]);
	const [modelsError, setModelsError] = useState<string | null>(null);
	const [testResult, setTestResult] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	const aiSettings = settings.ai || {
		provider: '',
		model: '',
		api_key: '',
		base_url: '',
	};
	const selectedProvider = aiSettings.provider || '';
	const apiKey = aiSettings.api_key || '';
	const baseUrl = aiSettings.base_url || '';

	// Fetch models whenever provider, api_key, or base_url changes.
	useEffect(() => {
		const isCustom = selectedProvider === 'custom';
		const hasMaskedKey = /^\*+.{0,4}$/.test(apiKey);
		const hasConnection = !!(aiSettings.connections?.[selectedProvider]?.api_key);
		if (!selectedProvider) {
			setModels([]);
			return;
		}
		if (isCustom && !baseUrl) {
			setModels([]);
			return;
		}
		// Skip fetch only when there is truly no key anywhere — no local key
		// and no saved connection the backend could fall back to.
		if (!isCustom && !apiKey && !hasConnection) {
			setModels([]);
			return;
		}

		let cancelled = false;

		const fetchModels = async () => {
			setIsFetchingModels(true);
			setModelsError(null);

			try {
				const body: Record<string, string> = {
					provider: selectedProvider,
					...(!hasMaskedKey && apiKey ? { api_key: apiKey } : {}),
					...(baseUrl ? { base_url: baseUrl } : {}),
				};
				const response = (await apiFetch({
					path: '/doublescale/v1/ai/models',
					method: 'POST',
					data: body,
				})) as { success: boolean; models: ModelOption[] };

				if (!cancelled) {
					setModels(response.models || []);
					const currentModel = aiSettings.model;
					const inList = response.models?.some(
						(m) => m.value === currentModel
					);
					if (!inList && response.models?.length > 0) {
						onChange({
							...settings,
							ai: {
								...aiSettings,
								model: response.models[0].value,
							} as Settings['ai'],
						});
					}
				}
			} catch (err: any) {
				if (!cancelled) {
					setModelsError(
						err?.message ||
						__(
							'Failed to fetch models. Check your API key.',
							'doublescale'
						)
					);
					setModels([]);
				}
			} finally {
				if (!cancelled) {
					setIsFetchingModels(false);
				}
			}
		};

		const timer = setTimeout(fetchModels, 600);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedProvider, apiKey, baseUrl]);

	const handleChange = (key: string, value: string) => {
		const updated = { ...aiSettings, [key]: value };

		if (key === 'provider') {
			// Save current provider's connection before switching.
			const connections = { ...(aiSettings.connections || {}) };
			if (aiSettings.provider) {
				connections[aiSettings.provider] = {
					api_key: aiSettings.api_key || '',
					model: aiSettings.model || '',
					base_url: aiSettings.base_url || '',
				};
			}

			// Restore saved connection for the new provider.
			const saved = connections[value] || {};
			updated.api_key = saved.api_key || '';
			updated.model = saved.model || '';
			updated.base_url = saved.base_url || '';
			updated.connections = connections;

			setModels([]);
			setModelsError(null);
			setTestResult(null);
		}

		onChange({
			...settings,
			ai: updated as Settings['ai'],
		});
	};

	const handleTestConnection = async () => {
		setIsTesting(true);
		setTestResult(null);

		try {
			// Pass currently-selected (possibly unsaved) values so the backend
			// can test without requiring a prior save.
			const hasMaskedKey = /^\*+.{0,4}$/.test(apiKey);
			const body: Record<string, string> = {
				provider: selectedProvider,
				model: aiSettings.model,
			};
			// Only include api_key if it's a real (unmasked) value.
			if (apiKey && !hasMaskedKey) body.api_key = apiKey;
			if (baseUrl) body.base_url = baseUrl;

			const response = (await apiFetch({
				path: '/doublescale/v1/ai/test-connection',
				method: 'POST',
				data: body,
			})) as { success: boolean; message: string };

			setTestResult({
				type: 'success',
				message:
					response.message ||
					__('Connection successful!', 'doublescale'),
			});
		} catch (error: any) {
			setTestResult({
				type: 'error',
				message:
					error?.message ||
					__(
						'Connection failed. Please check your settings.',
						'doublescale'
					),
			});
		} finally {
			setIsTesting(false);
		}
	};

	// Build select options — prepend a placeholder if no model selected yet.
	const modelOptions: ModelOption[] = isFetchingModels
		? [{ value: '', label: __('Loading models...', 'doublescale') }]
		: models.length > 0
			? models
			: aiSettings.model
				? [{ value: aiSettings.model, label: aiSettings.model }]
				: [];

	const isCustom = selectedProvider === 'custom';
	const canShowModelSelect =
		selectedProvider &&
		(isCustom ? !!baseUrl : !!(apiKey || isFetchingModels));
	const canTestConnection =
		selectedProvider &&
		aiSettings.model &&
		(isCustom ? !!baseUrl : !!apiKey);

	return (
		<div className="ai-settings doublescale-fields">
			<div className="text-foreground font-semibold text-2xl mb-1">
				{__('AI Email Builder', 'doublescale')}
			</div>
			<p className="text-sm text-muted-foreground mb-6">
				{__(
					'Configure your AI provider to generate email templates using artificial intelligence. Your API key is stored securely and used only for template generation.',
					'doublescale'
				)}
			</p>

			<div className="flex flex-col gap-5 max-w-2xl">
				{/* Provider */}
				<Field
					label={__('AI Provider', 'doublescale')}
					value={selectedProvider}
					onChange={(value) => handleChange('provider', value)}
					type="select"
					options={AI_PROVIDERS}
				/>

				{/* Base URL — only for custom/compatible providers */}
				{selectedProvider === 'custom' && (
					<div>
						<Field
							label={__('Base URL', 'doublescale')}
							value={baseUrl}
							onChange={(value) =>
								handleChange('base_url', value)
							}
							type="url"
							placeholder="https://openrouter.ai/api/v1"
						/>
						<p className="text-xs text-muted-foreground mt-1.5">
							{__('Examples: ', 'doublescale')}
							{CUSTOM_PROVIDER_EXAMPLES.join(' · ')}
						</p>
					</div>
				)}

				{/* API Key — shown as soon as provider is selected */}
				{selectedProvider && (
					<Field
						label={
							selectedProvider === 'custom'
								? __('API Key (optional for Ollama/local)', 'doublescale')
								: __('API Key', 'doublescale')
						}
						value={apiKey}
						onChange={(value) => handleChange('api_key', value)}
						type="password"
						placeholder={
							selectedProvider === 'openai'
								? 'sk-...'
								: selectedProvider === 'anthropic'
									? 'sk-ant-...'
									: selectedProvider === 'gemini'
										? 'AIzaSy...'
										: 'sk-or-... or leave empty for Ollama'
						}
					/>
				)}

				{/* Model — fetched dynamically */}
				{canShowModelSelect && (
					<div>
						<div className="flex items-center gap-2 mb-[10px]">
							<span className="text-foreground font-normal text-base">
								{__('Model', 'doublescale')}
							</span>
							{isFetchingModels && (
								<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
							)}
						</div>

						{modelsError ? (
							<p className="text-sm text-red-600">
								{modelsError}
							</p>
						) : modelOptions.length > 0 ? (
							<Field
								label=""
								value={aiSettings.model || modelOptions[0]?.value}
								onChange={(value) =>
									handleChange('model', value)
								}
								type="select"
								options={modelOptions}
								disabled={isFetchingModels}
							/>
						) : null}
					</div>
				)}

				{/* Test Connection */}
				{canTestConnection && (
					<div className="flex items-center gap-3">
						<Button
							onClick={handleTestConnection}
							disabled={isTesting}
							variant="outline"
							className="rounded-lg"
						>
							{isTesting
								? __('Testing...', 'doublescale')
								: __('Test Connection', 'doublescale')}
						</Button>

						{testResult && (
							<span
								className={`text-sm font-medium ${testResult.type === 'success'
									? 'text-green-600'
									: 'text-red-600'
									}`}
							>
								{testResult.message}
							</span>
						)}
					</div>
				)}
			</div>

			{applyFilters('doublescale_settings_ai_assistant_section', null, settings, onChange) as React.ReactNode}
		</div>
	);
};

export default AISettings;
