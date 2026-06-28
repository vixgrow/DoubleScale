/**
 * Knowledge Base — settings tab. Reads/writes the dedicated
 * `knowledgebase/settings` route (its own `doublescale_settings['knowledgebase']`
 * slice), not the global settings controller.
 *
 * Built on the shared design system (`@/components/ui/*`) so it matches the rest
 * of the admin (Inbox, Templates, …) rather than hand-rolled HTML.
 */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, getToLink } from '@doublescale/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

import { getSettings, listGroups, saveSettings, type KbGroup, type KbSettings } from './api';

/** The boolean feature flags, rendered as a stack of Switch rows. */
const TOGGLES: Array<[keyof KbSettings, string]> = [
	['show_in_portal', __('Show the Knowledge Base tab in the client portal', 'doublescale')],
	['show_toc', __('Show the auto table of contents', 'doublescale')],
	['show_related', __('Show the related-articles block', 'doublescale')],
	['enable_feedback', __('Show the “Was this helpful?” control', 'doublescale')],
	['track_contact_views', __('Log article reads to the contact timeline (GDPR)', 'doublescale')],
];

const Settings = () => {
	const navigate = useNavigate();
	const [settings, setSettings] = useState<KbSettings | null>(null);
	const [groups, setGroups] = useState<KbGroup[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		getSettings()
			.then(setSettings)
			.catch((e) => setError((e as { message?: string })?.message || __('Failed to load.', 'doublescale')));
		listGroups()
			.then((res) => setGroups(res.data))
			.catch(() => undefined);
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
		return <p className="p-6 text-sm text-muted-foreground">{error || __('Loading…', 'doublescale')}</p>;
	}

	return (
		<div className="p-6 space-y-5 max-w-2xl">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">{__('Knowledge Base settings', 'doublescale')}</h1>
				<Button variant="ghost" size="sm" onClick={() => navigate(getToLink('knowledgebase'))}>
					← {__('Back to articles', 'doublescale')}
				</Button>
			</div>

			{error && <p className="text-sm text-destructive">{error}</p>}
			{saved && <p className="text-sm text-emerald-600">{__('Saved.', 'doublescale')}</p>}

			<Card>
				<CardHeader>
					<CardTitle>{__('Access', 'doublescale')}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-5">
					<div className="space-y-1.5">
						<Label>{__('Public access', 'doublescale')}</Label>
						<Select
							value={settings.public_access}
							onValueChange={(value) =>
								update('public_access', value as KbSettings['public_access'])
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="public">
									{__('Public — open to anonymous visitors', 'doublescale')}
								</SelectItem>
								<SelectItem value="portal">
									{__('Portal — logged-in users only', 'doublescale')}
								</SelectItem>
								<SelectItem value="disabled">
									{__('Disabled — no front-end KB', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{__(
								'The front door for the whole KB site. Per-article and per-group visibility apply on top of this.',
								'doublescale'
							)}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label>{__('Default new-article visibility', 'doublescale')}</Label>
						<Select
							value={settings.default_visibility}
							onValueChange={(value) =>
								update('default_visibility', value as KbSettings['default_visibility'])
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="public">{__('Public', 'doublescale')}</SelectItem>
								<SelectItem value="members">{__('Members only', 'doublescale')}</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{__(
								'Only sets the starting position of the “Members only” toggle for newly created articles. You can change it per article, and a status or group can still restrict it further.',
								'doublescale'
							)}
						</p>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="kb-restricted-redirect">
							{__('Restricted redirect URL (empty = 404)', 'doublescale')}
						</Label>
						<Input
							id="kb-restricted-redirect"
							type="url"
							value={settings.restricted_redirect_url}
							onChange={(e) => update('restricted_redirect_url', e.target.value)}
							placeholder="https://…"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{__('Display', 'doublescale')}</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-6">
					<div className="space-y-1.5">
						<Label htmlFor="kb-per-page">{__('Articles per page', 'doublescale')}</Label>
						<Input
							id="kb-per-page"
							type="number"
							min={1}
							max={100}
							value={settings.articles_per_page}
							onChange={(e) => update('articles_per_page', Number(e.target.value))}
							className="w-32"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="kb-related">{__('Related articles to show', 'doublescale')}</Label>
						<Input
							id="kb-related"
							type="number"
							min={0}
							max={12}
							value={settings.related_count}
							onChange={(e) => update('related_count', Number(e.target.value))}
							className="w-32"
						/>
					</div>
					<div className="space-y-1.5">
						<Label>{__('Default group for new articles', 'doublescale')}</Label>
						<Select
							value={String(settings.default_group)}
							onValueChange={(value) => update('default_group', Number(value))}
						>
							<SelectTrigger className="w-56">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="0">{__('— None —', 'doublescale')}</SelectItem>
								{groups.map((g) => (
									<SelectItem key={g.id} value={String(g.id)}>
										{g.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label>{__('Article editor', 'doublescale')}</Label>
						<Select
							value={settings.editor}
							onValueChange={(value) => update('editor', value as KbSettings['editor'])}
						>
							<SelectTrigger className="w-56">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="lexical">{__('Rich text (default)', 'doublescale')}</SelectItem>
								<SelectItem value="blocks">{__('Block editor (beta)', 'doublescale')}</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{__(
								'Block editor embeds the WordPress Gutenberg editor for article bodies. Beta — switch back to Rich text anytime.',
								'doublescale'
							)}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{__('Portal & features', 'doublescale')}</CardTitle>
				</CardHeader>
				<CardContent className="divide-y">
					{TOGGLES.map(([key, label]) => (
						<div key={String(key)} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
							<Label htmlFor={`kb-${String(key)}`} className="pr-4 font-normal">
								{label}
							</Label>
							<Switch
								id={`kb-${String(key)}`}
								checked={Boolean(settings[key])}
								onCheckedChange={(checked) => update(key, checked as KbSettings[typeof key])}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			<Button disabled={saving} onClick={save}>
				{saving ? __('Saving…', 'doublescale') : __('Save settings', 'doublescale')}
			</Button>
		</div>
	);
};

export default Settings;
