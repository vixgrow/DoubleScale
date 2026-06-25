/**
 * Knowledge Base — settings tab. Reads/writes the dedicated
 * `knowledgebase/settings` route (its own `doublescale_settings['knowledgebase']`
 * slice), not the global settings controller.
 */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, getToLink } from '@doublescale/navigation';

import { getSettings, saveSettings, type KbSettings } from './api';

const Settings = () => {
	const navigate = useNavigate();
	const [settings, setSettings] = useState<KbSettings | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		getSettings()
			.then(setSettings)
			.catch((e) => setError((e as { message?: string })?.message || __('Failed to load.', 'doublescale')));
	}, []);

	const update = <K extends keyof KbSettings>(key: K, value: KbSettings[K]) => {
		setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
		setSaved(false);
	};

	const save = async () => {
		if (!settings) {
			return;
		}
		setSaving(true);
		setError('');
		try {
			const res = await saveSettings(settings);
			setSettings(res.settings);
			setSaved(true);
		} catch (e) {
			setError((e as { message?: string })?.message || __('Failed to save.', 'doublescale'));
		} finally {
			setSaving(false);
		}
	};

	if (!settings) {
		return <p className="p-6 text-sm text-gray-500">{error || __('Loading…', 'doublescale')}</p>;
	}

	return (
		<div className="p-6 space-y-5 max-w-2xl">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{__('Knowledge Base settings', 'doublescale')}</h1>
				<button
					type="button"
					className="text-sm text-primary hover:underline"
					onClick={() => navigate(getToLink('knowledgebase'))}
				>
					← {__('Back to articles', 'doublescale')}
				</button>
			</div>

			{error && <p className="text-sm text-red-600">{error}</p>}
			{saved && <p className="text-sm text-green-600">{__('Saved.', 'doublescale')}</p>}

			<label className="block text-sm">
				<span className="mb-1 block text-gray-500">{__('Public access', 'doublescale')}</span>
				<select
					value={settings.public_access}
					onChange={(e) => update('public_access', e.target.value as KbSettings['public_access'])}
					className="w-full rounded-md border px-3 py-2"
				>
					<option value="public">{__('Public — open to anonymous visitors', 'doublescale')}</option>
					<option value="portal">{__('Portal — logged-in users only', 'doublescale')}</option>
					<option value="disabled">{__('Disabled — no front-end KB', 'doublescale')}</option>
				</select>
			</label>

			<label className="block text-sm">
				<span className="mb-1 block text-gray-500">{__('Default new-article visibility', 'doublescale')}</span>
				<select
					value={settings.default_visibility}
					onChange={(e) => update('default_visibility', e.target.value as KbSettings['default_visibility'])}
					className="w-full rounded-md border px-3 py-2"
				>
					<option value="public">{__('Public', 'doublescale')}</option>
					<option value="members">{__('Members only', 'doublescale')}</option>
				</select>
			</label>

			<label className="block text-sm">
				<span className="mb-1 block text-gray-500">{__('Articles per page', 'doublescale')}</span>
				<input
					type="number"
					min={1}
					max={100}
					value={settings.articles_per_page}
					onChange={(e) => update('articles_per_page', Number(e.target.value))}
					className="w-32 rounded-md border px-3 py-2"
				/>
			</label>

			<label className="block text-sm">
				<span className="mb-1 block text-gray-500">{__('Related articles to show', 'doublescale')}</span>
				<input
					type="number"
					min={0}
					max={12}
					value={settings.related_count}
					onChange={(e) => update('related_count', Number(e.target.value))}
					className="w-32 rounded-md border px-3 py-2"
				/>
			</label>

			<label className="block text-sm">
				<span className="mb-1 block text-gray-500">{__('Restricted redirect URL (empty = 404)', 'doublescale')}</span>
				<input
					type="url"
					value={settings.restricted_redirect_url}
					onChange={(e) => update('restricted_redirect_url', e.target.value)}
					placeholder="https://…"
					className="w-full rounded-md border px-3 py-2"
				/>
			</label>

			{(
				[
					['show_in_portal', __('Show the Knowledge Base tab in the client portal', 'doublescale')],
					['show_toc', __('Show the auto table of contents', 'doublescale')],
					['show_related', __('Show the related-articles block', 'doublescale')],
					['enable_feedback', __('Show the “Was this helpful?” control', 'doublescale')],
					['track_contact_views', __('Log article reads to the contact timeline (GDPR)', 'doublescale')],
				] as Array<[keyof KbSettings, string]>
			).map(([key, label]) => (
				<label key={String(key)} className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={Boolean(settings[key])}
						onChange={(e) => update(key, e.target.checked as KbSettings[typeof key])}
					/>
					{label}
				</label>
			))}

			<button
				type="button"
				disabled={saving}
				className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
				onClick={save}
			>
				{saving ? __('Saving…', 'doublescale') : __('Save settings', 'doublescale')}
			</button>
		</div>
	);
};

export default Settings;
