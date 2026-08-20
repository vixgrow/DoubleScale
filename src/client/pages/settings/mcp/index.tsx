/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { Badge } from '@doublescale/components/ui/badge';
import { Button } from '@doublescale/components/ui/button';
import { Input } from '@doublescale/components/ui/input';
import { Label } from '@doublescale/components/ui/label';
import { Switch } from '@doublescale/components/ui/switch';
interface McpTool {
	name: string;
	label: string;
	description: string;
	category: string;
}

interface McpApiKey {
	id: string;
	label: string;
	user_login: string;
	created_at: string;
	last_used: string;
}

interface McpEligibleUser {
	id: number;
	user_login: string;
	label: string;
	role: string;
}

interface McpStatus {
	abilities_api_available: boolean;
	wp_version: string;
	required_wp_version: string;
	abilities_enabled: boolean;
	mcp_enabled: boolean;
	connected: boolean;
	endpoint_url: string;
	tools: McpTool[];
	/** Every key for an administrator; only the caller's own otherwise. */
	api_keys: McpApiKey[];
	/**
	 * Whether the caller governs the whole MCP surface. False for a CRM user who
	 * may still manage their own key, so the endpoint toggle and the site-wide
	 * key list are hidden from them.
	 */
	can_manage_mcp: boolean;
	current_user: string;
	current_user_id: number;
	eligible_key_users: McpEligibleUser[];
	app_passwords_url: string;
	app_passwords_available: boolean;
}

type ClientKey =
	| 'claude-code'
	| 'claude-desktop'
	| 'cursor'
	| 'codex'
	| 'other';

const CLIENT_TABS: Array<{
	key: ClientKey;
	label: string;
	/** Where the snippet goes, shown above the code block. */
	target: string;
	/**
	 * Clients that shell out to `npx mcp-remote` need Node installed. Ours is
	 * a plain HTTP endpoint with no session handshake, so any client that can
	 * send a header connects directly — no helper process.
	 */
	needsNode: boolean;
}> = [
	{
		key: 'claude-code',
		label: __('Claude Code', 'doublescale'),
		target: __('Run this in your terminal.', 'doublescale'),
		needsNode: false,
	},
	{
		key: 'claude-desktop',
		label: __('Claude Desktop', 'doublescale'),
		target: __(
			'Add to claude_desktop_config.json — macOS: ~/Library/Application Support/Claude/ · Windows: %APPDATA%\\Claude\\',
			'doublescale'
		),
		needsNode: true,
	},
	{
		key: 'cursor',
		label: __('Cursor', 'doublescale'),
		target: __(
			'Add to Cursor’s mcp.json (Settings → Tools & MCP).',
			'doublescale'
		),
		needsNode: false,
	},
	{
		key: 'codex',
		label: __('OpenAI Codex', 'doublescale'),
		target: __('Add to ~/.codex/config.toml', 'doublescale'),
		needsNode: true,
	},
	{
		key: 'other',
		label: __('Other', 'doublescale'),
		target: __(
			'Any MCP-compatible client that can send an HTTP header.',
			'doublescale'
		),
		needsNode: false,
	},
];

/**
 * Failure modes specific to THIS endpoint.
 *
 * Deliberately not a copy of another plugin's list: we have no adapter plugin
 * to be missing, and the module gate plus per-user tool filtering produce
 * "where did my tools go" symptoms that only exist here.
 */
const TROUBLESHOOTING: Array<{ problem: string; fix: string }> = [
	{
		problem: __('The client reports 401 / unauthorized', 'doublescale'),
		fix: __(
			'The key is wrong, was revoked, or the Authorization header did not reach the server. Create a fresh key and re-copy the snippet. Keys are shown once and cannot be recovered.',
			'doublescale'
		),
	},
	{
		problem: __('No tools appear in the client', 'doublescale'),
		fix: __(
			'Restart the client completely — closing the window is not enough; quit from the menu bar or system tray. If tools are still missing, confirm the toggle above is on.',
			'doublescale'
		),
	},
	{
		problem: __(
			'Some tools are missing, but others work',
			'doublescale'
		),
		fix: __(
			'That is expected. Tools are hidden when their module is switched off under Settings → Modules, and when the user the key belongs to lacks permission for them. A key sees exactly what that user sees.',
			'doublescale'
		),
	},
	{
		problem: __('A tool returns "not allowed" or empty results', 'doublescale'),
		fix: __(
			'The key acts as a specific user. If that user only sees their own invoices or tickets, so does the agent. Issue the key from an account with wider access if you need a wider view.',
			'doublescale'
		),
	},
	{
		problem: __('"server failed to start" (Claude Desktop / Codex)', 'doublescale'),
		fix: __(
			'Those clients launch a Node helper. Run "node -v" in a terminal; if it is not found, install the LTS build from nodejs.org and restart the client.',
			'doublescale'
		),
	},
	{
		problem: __('Claude Desktop lost all its MCP servers', 'doublescale'),
		fix: __(
			'claude_desktop_config.json must stay valid JSON — a missing or extra comma stops every server from loading, not just this one.',
			'doublescale'
		),
	},
	{
		problem: __('Works locally but not from another machine', 'doublescale'),
		fix: __(
			'The endpoint URL must be reachable from wherever the client runs, with a matching scheme. A localhost URL only works on this computer.',
			'doublescale'
		),
	},
];

const McpSettings: React.FC = () => {
	const [status, setStatus] = useState<McpStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [keyLabel, setKeyLabel] = useState('');
	// Empty means "for me" — the common case, and the original behaviour.
	const [keyUserId, setKeyUserId] = useState('');
	const [newKey, setNewKey] = useState('');
	const [newKeyOwner, setNewKeyOwner] = useState('');
	const [newKeyId, setNewKeyId] = useState('');
	const [activeClient, setActiveClient] = useState<ClientKey>('claude-code');
	// Never sent anywhere: the header is assembled in the browser so the
	// password does not travel to our server just to be base64'd.
	const [appPassword, setAppPassword] = useState('');
	const [emailingKey, setEmailingKey] = useState(false);
	// Off by default: a key is a permanent password, and once it is in an inbox
	// it stays there. The admin has to opt in per send.
	const [emailIncludesKey, setEmailIncludesKey] = useState(false);
	const [creatingKey, setCreatingKey] = useState(false);
	const [copied, setCopied] = useState(false);
	// Seeded from the browser, but overridable: an admin may be generating a
	// snippet for a different machine than the one they are sitting at.
	const [isWindows, setIsWindows] = useState<boolean>(() =>
		typeof navigator !== 'undefined'
			? /win/i.test(navigator.platform || navigator.userAgent || '')
			: false
	);
	const [notice, setNotice] = useState<{
		type: 'success' | 'error';
		message: string;
	} | null>(null);

	const fetchStatus = useCallback(async () => {
		try {
			const response = await apiFetch<McpStatus>({
				path: '/doublescale/v1/mcp/status',
			});
			setStatus(response);
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to load MCP status', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStatus();
	}, [fetchStatus]);

	const handleToggle = async (enabled: boolean) => {
		setSaving(true);
		// Optimistic: the switch should not lag behind the click.
		setStatus((current) =>
			current ? { ...current, mcp_enabled: enabled } : current
		);

		try {
			await apiFetch({
				path: '/doublescale/v1/mcp/settings',
				method: 'POST',
				data: { enabled },
			});
			await fetchStatus();
			setNotice({
				type: 'success',
				message: enabled
					? __('MCP endpoint enabled', 'doublescale')
					: __('MCP endpoint disabled', 'doublescale'),
			});
		} catch (error) {
			// Roll back so the UI never claims a state the server rejected.
			setStatus((current) =>
				current ? { ...current, mcp_enabled: !enabled } : current
			);
			setNotice({
				type: 'error',
				message: __('Failed to update MCP settings', 'doublescale'),
			});
		} finally {
			setSaving(false);
		}
	};

	/**
	 * The Authorization value for a WordPress Application Password.
	 *
	 * Application passwords are HTTP Basic, not Bearer: the header carries
	 * base64("username:password"), so pasting the password on its own — the
	 * obvious thing to try — always fails with "Authentication required".
	 * WordPress also displays the password in groups of four, and those spaces
	 * are display only.
	 */
	const basicAuthHeader = useMemo((): string => {
		const password = appPassword.replace(/\s+/g, '');
		if (!status || !password) {
			return '';
		}
		try {
			// btoa is Latin-1 only; usernames can hold anything.
			const bytes = new TextEncoder().encode(
				`${status.current_user}:${password}`
			);
			return `Basic ${btoa(String.fromCharCode(...bytes))}`;
		} catch {
			return '';
		}
	}, [appPassword, status]);

	const buildSnippet = (client: ClientKey): string => {
		if (!status) {
			return '';
		}

		const url = status.endpoint_url;
		// An entered application password wins: the admin is actively working
		// on that path, and a snippet showing Bearer would be wrong for it.
		const credential =
			basicAuthHeader || `Bearer ${newKey || '<your-api-key>'}`;
		const authHeader = `Authorization: ${credential}`;

		if (client === 'claude-code') {
			return [
				'claude mcp add \\',
				'  --transport http \\',
				`  doublescale ${url} \\`,
				`  --header "${authHeader}"`,
			].join('\n');
		}

		if (client === 'cursor') {
			return JSON.stringify(
				{
					mcpServers: {
						doublescale: {
							url,
							headers: {
								Authorization: `Bearer ${
									newKey || '<your-api-key>'
								}`,
							},
						},
					},
				},
				null,
				2
			);
		}

		// Windows launches the helper through cmd.exe, which breaks twice on the
		// direct form: it splits "C:\Program Files\nodejs" at the space, and it
		// splits the auth header at the space after "Authorization:". Routing
		// through `cmd /c` fixes the first; passing the value via env fixes the
		// second. Note the leading space inside the env value — it is the one
		// that belongs after the colon.
		const bearer = credential;

		if (client === 'claude-desktop') {
			const server = isWindows
				? {
						command: 'cmd',
						args: [
							'/c',
							'npx',
							'-y',
							'mcp-remote',
							url,
							'--header',
							'Authorization:${AUTH_HEADER}',
						],
						env: { AUTH_HEADER: ` ${bearer}` },
					}
				: {
						command: 'npx',
						args: ['-y', 'mcp-remote', url, '--header', authHeader],
					};

			return JSON.stringify({ mcpServers: { doublescale: server } }, null, 2);
		}

		if (client === 'codex') {
			if (isWindows) {
				return [
					'[mcp_servers.doublescale]',
					'command = "cmd"',
					'args = [',
					'  "/c",',
					'  "npx",',
					'  "-y",',
					'  "mcp-remote",',
					`  "${url}",`,
					'  "--header",',
					'  "Authorization:${AUTH_HEADER}"',
					']',
					'',
					'[mcp_servers.doublescale.env]',
					`AUTH_HEADER = " ${bearer}"`,
				].join('\n');
			}

			return [
				'[mcp_servers.doublescale]',
				'command = "npx"',
				'args = [',
				'  "-y",',
				'  "mcp-remote",',
				`  "${url}",`,
				'  "--header",',
				`  "${authHeader}"`,
				']',
			].join('\n');
		}

		return [
			`Endpoint: ${url}`,
			'Transport: HTTP (JSON-RPC 2.0)',
			`Header: ${authHeader}`,
		].join('\n');
	};

	/**
	 * Mail the setup steps to whoever the key belongs to.
	 *
	 * The configuration is generated here and posted to the server rather than
	 * rebuilt in PHP: the per-client, per-OS templates live in this file, and a
	 * second copy would drift from this one without anyone noticing.
	 */
	const handleEmailSetup = async () => {
		if (!newKeyId) {
			return;
		}
		setEmailingKey(true);
		try {
			const tab = CLIENT_TABS.find((entry) => entry.key === activeClient);
			const response = await apiFetch<{ message: string }>({
				path: `/doublescale/v1/mcp/keys/${newKeyId}/email`,
				method: 'POST',
				data: {
					client: tab?.label || activeClient,
					os: isWindows ? 'Windows' : 'macOS / Linux',
					config: buildSnippet(activeClient),
					config_path: tab?.target || '',
					// Only travels when the admin explicitly asked for it.
					secret: emailIncludesKey ? newKey : '',
				},
			});
			setNotice({ type: 'success', message: response.message });
		} catch (error) {
			setNotice({
				type: 'error',
				message:
					(error as { message?: string })?.message ||
					__('Could not send the email.', 'doublescale'),
			});
		} finally {
			setEmailingKey(false);
		}
	};

	const handleCreateKey = async () => {
		setCreatingKey(true);
		try {
			const response = await apiFetch<{
				key: string;
				id: string;
				user_login: string;
				api_keys: McpApiKey[];
			}>({
				path: '/doublescale/v1/mcp/keys',
				method: 'POST',
				data: {
					label: keyLabel || undefined,
					// Omitted binds the key to the current user.
					user_id: keyUserId ? Number(keyUserId) : undefined,
				},
			});
			// Held in state only for this render: the server stores a hash and
			// can never show it again.
			setNewKey(response.key);
			setNewKeyOwner(response.user_login);
			setNewKeyId(response.id);
			setEmailIncludesKey(false);
			setKeyLabel('');
			setKeyUserId('');
			setStatus((current) =>
				current ? { ...current, api_keys: response.api_keys } : current
			);
		} catch (error) {
			// The server explains *why* a subject was refused (administrator,
			// no CRM role); a generic message would send the admin guessing.
			const message =
				(error as { message?: string })?.message ||
				__('Failed to create API key', 'doublescale');
			setNotice({ type: 'error', message });
		} finally {
			setCreatingKey(false);
		}
	};

	const handleDeleteKey = async (id: string) => {
		try {
			const response = await apiFetch<{ api_keys: McpApiKey[] }>({
				path: `/doublescale/v1/mcp/keys/${id}`,
				method: 'DELETE',
			});
			setStatus((current) =>
				current ? { ...current, api_keys: response.api_keys } : current
			);
			setNotice({
				type: 'success',
				message: __('API key revoked', 'doublescale'),
			});
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to revoke API key', 'doublescale'),
			});
		}
	};

	const handleCopy = async (client: ClientKey) => {
		try {
			await navigator.clipboard.writeText(buildSnippet(client));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Could not copy to clipboard', 'doublescale'),
			});
		}
	};

	if (loading) {
		return (
			<div className="p-6 text-sm text-gray-500">
				{__('Loading MCP settings…', 'doublescale')}
			</div>
		);
	}

	if (!status) {
		return null;
	}

	return (
		<div className="mcp-settings doublescale-fields">
			<div className="flex items-center justify-between mb-6">
				<div className="text-[#09090B] font-semibold text-2xl">
					{__('MCP for AI Agents', 'doublescale')}
				</div>
				<Badge className='shadow-none' variant={status.connected ? 'default' : 'secondary'}>
					{status.connected
						? __('Connected', 'doublescale')
						: __('Not connected', 'doublescale')}
				</Badge>
			</div>

			{notice && (
				<div
					className={`mb-6 rounded-md border p-4 text-sm ${
						notice.type === 'success'
							? 'border-green-200 bg-green-50 text-green-900'
							: 'border-red-200 bg-red-50 text-red-900'
					}`}
				>
					{notice.message}
				</div>
			)}

			{/*
			 * Enable toggle — administrators only. A CRM user reaches this page
			 * to manage their own key; showing them a switch that 403s on click
			 * would read as a broken page rather than a permission boundary.
			 */}
			{status.can_manage_mcp ? (
				<div className="flex items-center justify-between pb-5 border-b mb-6">
					<div className="flex-1 pr-6">
						<Label className="text-[#09090B] font-medium text-base">
							{__('Enable MCP for AI Agents', 'doublescale')}
						</Label>
						<p className="text-sm text-gray-500 mt-1">
							{__(
								'When enabled, DoubleScale publishes its read-only abilities over MCP so AI agents can read your CRM data. Every request still enforces the connecting user’s module access, role, and record ownership.',
								'doublescale'
							)}
						</p>
					</div>
					<Switch
						checked={status.mcp_enabled}
						disabled={saving || !status.abilities_api_available}
						onCheckedChange={handleToggle}
					/>
				</div>
			) : (
				<div className="pb-5 border-b mb-6">
					<Label className="text-[#09090B] font-medium text-base">
						{__('Your MCP API keys', 'doublescale')}
					</Label>
					<p className="text-sm text-gray-500 mt-1">
						{status.mcp_enabled
							? __(
									'Create a key below to connect an AI agent to DoubleScale as you. It carries your own permissions — an agent using it sees exactly the records you can see, and nothing more.',
									'doublescale'
								)
							: __(
									'MCP is switched off for this site, so a key you create here will not connect yet. Ask an administrator to enable it.',
									'doublescale'
								)}
					</p>
				</div>
			)}

			{/*
			 * Two different reasons produce no tools, and they need different
			 * fixes: an old WordPress has no Abilities API to register against,
			 * while the kill switch is a deliberate setting. Naming the wrong
			 * one sends the admin hunting for an option that is already correct.
			 */}
			{!status.abilities_api_available && (
				<div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4">
					<p className="text-sm text-amber-900">
						{sprintf(
							/* translators: 1: required WordPress version, 2: current WordPress version. */
							__(
								'MCP needs the WordPress Abilities API, added in WordPress %1$s. This site runs WordPress %2$s, so no tools are published. Update WordPress to use this feature.',
								'doublescale'
							),
							status.required_wp_version,
							status.wp_version
						)}
					</p>
				</div>
			)}

			{status.abilities_api_available && !status.abilities_enabled && (
				<div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
					<p className="text-sm text-red-900">
						{__(
							'The abilities layer is switched off (doublescale_disable_abilities), so no tools are published even with MCP enabled.',
							'doublescale'
						)}
					</p>
				</div>
			)}

			{/* Status block */}
			<div className="mb-8">
				<div className="text-[#09090B] font-semibold text-lg mb-4">
					{__('Status', 'doublescale')}
				</div>

				<div className="grid grid-cols-1 gap-4">
					<div className="flex items-start justify-between border-b pb-4">
						<div className="pr-6">
							<div className="font-medium text-sm">
								{__('Server', 'doublescale')}
							</div>
							<div className="text-sm text-gray-500">
								{__(
									'Built into DoubleScale — no adapter or companion plugin required.',
									'doublescale'
								)}
							</div>
						</div>
						<Badge className='shadow-none' variant="default">
							{__('Self-hosted', 'doublescale')}
						</Badge>
					</div>

					<div className="flex items-start justify-between border-b pb-4">
						<div className="pr-6">
							<div className="font-medium text-sm">
								{__('Endpoint URL', 'doublescale')}
							</div>
							<div className="text-sm text-gray-500">
								{__('MCP clients connect to this URL.', 'doublescale')}
							</div>
						</div>
						<Input
							readOnly
							value={status.endpoint_url}
							className="max-w-md font-mono text-xs"
							onFocus={(event) => event.currentTarget.select()}
						/>
					</div>

					<div className="flex items-start justify-between border-b pb-4">
						<div>
							<div className="font-medium text-sm">
								{__('Tools available', 'doublescale')}
							</div>
							<div className="text-sm text-gray-500">
								{__(
									'Tools from modules you have switched off are not published.',
									'doublescale'
								)}
							</div>
						</div>
						<div className="text-sm font-semibold">
							{status.tools.length}
						</div>
					</div>
				</div>
			</div>

			{/* Connect a client */}
			<div className="mb-8">
				<div className="text-[#09090B] font-semibold text-lg mb-2">
					{__('Connect a client', 'doublescale')}
				</div>
				<p className="text-sm text-gray-500 mb-4">
					{__(
						'Create an API key below. The key connects as you, so it sees exactly what you can see — no more. You can also use a WordPress Application Password (Basic auth), which requires the site to be served over HTTPS.',
						'doublescale'
					)}{' '}
					<a
						className="underline"
						href={status.app_passwords_url}
						target="_blank"
						rel="noreferrer"
					>
						{__('Application Passwords', 'doublescale')}
					</a>
					{!status.app_passwords_available && (
						<span className="block mt-1 text-amber-700">
							{__(
								'Application Passwords are unavailable on this site because it is not served over HTTPS. Use an API key instead.',
								'doublescale'
							)}
						</span>
					)}
				</p>

				{/*
				 * Application passwords are HTTP Basic, so the header is
				 * base64("username:password") — not the password on its own.
				 * Everyone tries the password alone first and gets a bare
				 * "Authentication required", so do the encoding here rather
				 * than describing it.
				 */}
				{status.app_passwords_available && (
					<details className="mb-4 rounded-md border bg-gray-50 p-3">
						<summary className="text-sm font-medium cursor-pointer">
							{__(
								'Using an Application Password instead of an API key?',
								'doublescale'
							)}
						</summary>

						<p className="text-sm text-gray-600 mt-3 mb-2">
							{__(
								'Paste it here and the snippets below switch to it. It is converted in your browser and never sent to the server.',
								'doublescale'
							)}
						</p>

						<Input
							value={appPassword}
							onChange={(event) => setAppPassword(event.target.value)}
							placeholder={__(
								'e.g. abcd efgh ijkl mnop qrst uvwx',
								'doublescale'
							)}
							className="max-w-md font-mono"
						/>

						{basicAuthHeader ? (
							<div className="mt-3">
								<p className="text-sm text-gray-600 mb-1">
									{sprintf(
										/* translators: %s: WordPress username. */
										__(
											'Authorization header for %s:',
											'doublescale'
										),
										status.current_user
									)}
								</p>
								<code className="block bg-white border rounded px-3 py-2 text-xs font-mono break-all">
									{basicAuthHeader}
								</code>
								<p className="text-xs text-gray-500 mt-2">
									{__(
										'Note it says Basic, not Bearer — Bearer is only for the API keys below, and an Application Password sent as Bearer is always rejected.',
										'doublescale'
									)}
								</p>
							</div>
						) : (
							<p className="text-xs text-gray-500 mt-2">
								{__(
									'The spaces WordPress shows are for readability — paste it with or without them.',
									'doublescale'
								)}
							</p>
						)}
					</details>
				)}

				<p className="text-sm text-gray-500 mb-4">
					{__(
						'Give each client its own key — one for Claude Code, one for Cursor, and so on. Then you can revoke a single client without breaking the others.',
						'doublescale'
					)}
				</p>

				{/* Create a key */}
				<div className="flex items-end gap-3 mb-2 flex-wrap">
					<div className="flex-1 min-w-[200px] max-w-sm">
						<Label className="text-sm">
							{__('Key name', 'doublescale')}
						</Label>
						<Input
							value={keyLabel}
							onChange={(event) => setKeyLabel(event.target.value)}
							placeholder={__('e.g. Claude on my laptop', 'doublescale')}
						/>
					</div>

					{/*
					 * Binding a key to the teammate who will actually use it is
					 * what keeps record ownership meaningful — a key always
					 * carries its owner's permissions, so handing someone your
					 * own key would show them everyone's records.
					 */}
					{status.eligible_key_users.length > 0 && (
						<div className="flex-1 min-w-[200px] max-w-sm">
							<Label className="text-sm">
								{__('Acts as', 'doublescale')}
							</Label>
							<select
								className="flex !h-10 w-full !rounded-lg border !border-border bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								value={keyUserId}
								onChange={(event) => setKeyUserId(event.target.value)}
							>
								<option value="">
									{sprintf(
										/* translators: %s: current user's WordPress username. */
										__('Me (%s)', 'doublescale'),
										status.current_user
									)}
								</option>
								{status.eligible_key_users.map((user) => (
									<option key={user.id} value={String(user.id)}>
										{user.label} ({user.user_login})
									</option>
								))}
							</select>
						</div>
					)}

					<Button
						onClick={handleCreateKey}
						disabled={creatingKey}
						size="sm"
						className="h-10"
					>
						{creatingKey
							? __('Creating…', 'doublescale')
							: __('Create API key', 'doublescale')}
					</Button>
				</div>

				<p className="text-sm text-gray-500 mb-4">
					{status.eligible_key_users.length > 0
						? __(
								'A key always carries its owner’s permissions. To give a teammate access, create the key for them rather than sharing your own — otherwise they would see every record you can see.',
								'doublescale'
							)
						: __(
								'A key carries your permissions. Anyone holding it sees exactly what you can see.',
								'doublescale'
							)}
				</p>

				{newKey && (
					<div className="mb-5 rounded-md border border-green-200 bg-green-50 p-4">
						<p className="text-sm font-medium text-green-900 mb-2">
							{newKeyOwner && newKeyOwner !== status.current_user
								? sprintf(
										/* translators: %s: WordPress username the key acts as. */
										__(
											'Copy this key now — it will not be shown again. It acts as %s and carries their permissions.',
											'doublescale'
										),
										newKeyOwner
									)
								: __(
										'Copy this key now — it will not be shown again.',
										'doublescale'
									)}
						</p>
						<code className="block bg-white border rounded px-3 py-2 text-xs font-mono break-all">
							{newKey}
						</code>

						{/* Emailing the steps is the useful half; emailing the
						    credential is a separate, explicit decision. */}
						<div className="mt-4 pt-4 border-t border-green-200">
							<p className="text-sm text-green-900 mb-2">
								{sprintf(
									/* translators: 1: AI client name, 2: operating system. */
									__(
										'Email the setup steps for %1$s on %2$s to this key’s owner. Switch the tabs below first if that is not the right client.',
										'doublescale'
									),
									CLIENT_TABS.find((t) => t.key === activeClient)?.label ||
										activeClient,
									isWindows
										? __('Windows', 'doublescale')
										: __('macOS / Linux', 'doublescale')
								)}
							</p>

							<label className="flex items-start gap-2 text-sm text-green-900 mb-3">
								<input
									type="checkbox"
									className="mt-1"
									checked={emailIncludesKey}
									onChange={(event) =>
										setEmailIncludesKey(event.target.checked)
									}
								/>
								<span>
									{__(
										'Include the key itself in the email',
										'doublescale'
									)}
									<span className="block text-xs text-amber-800 mt-0.5">
										{__(
											'A key is a permanent password. Emailed, it stays in the inbox, the mail provider, and every backup — and keeps working. Prefer sending it over a channel you can clear.',
											'doublescale'
										)}
									</span>
								</span>
							</label>

							<Button
								variant="outline"
								size="sm"
								onClick={handleEmailSetup}
								disabled={emailingKey}
							>
								{emailingKey
									? __('Sending…', 'doublescale')
									: __('Email setup instructions', 'doublescale')}
							</Button>
						</div>
					</div>
				)}

				{status.api_keys.length > 0 && (
					<div className="mb-5 border rounded-md divide-y">
						{status.api_keys.map((key) => (
							<div
								key={key.id}
								className="flex items-center justify-between p-3"
							>
								<div>
									<div className="text-sm font-medium">
										{key.label}
									</div>
									<div className="text-xs text-gray-500">
										{sprintf(
											/* translators: 1: username, 2: creation date */
											__('Acts as %1$s · created %2$s', 'doublescale'),
											key.user_login,
											key.created_at.slice(0, 10)
										)}
										{key.last_used
											? sprintf(
													/* translators: %s: date */
													__(' · last used %s', 'doublescale'),
													key.last_used.slice(0, 10)
												)
											: ` · ${__('never used', 'doublescale')}`}
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleDeleteKey(key.id)}
								>
									{__('Revoke', 'doublescale')}
								</Button>
							</div>
						))}
					</div>
				)}

				<div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
					<span className="text-gray-500">
						{__('Client runs on:', 'doublescale')}
					</span>
					{[
						{
							value: true,
							label: __('Windows', 'doublescale'),
						},
						{
							value: false,
							label: __('macOS / Linux', 'doublescale'),
						},
					].map((osTab) => {
						const isActive = isWindows === osTab.value;
						return (
							<button
								key={String(osTab.value)}
								type="button"
								onClick={() => setIsWindows(osTab.value)}
								className={`flex items-center gap-1.5 rounded-lg border p-2 text-sm transition-colors ${
									isActive
										? 'bg-[#EEEEFF] text-primary font-medium'
										: 'border-border bg-white text-accent-foreground font-normal'
								}`}
							>
								{osTab.label}
							</button>
						);
					})}
				</div>

				{/* Controlled rather than Tabs: the email action needs to know
				    which client the admin is looking at. */}
				<div className="flex flex-wrap items-center gap-2 mb-4">
					{CLIENT_TABS.map((tab) => {
						const isActive = activeClient === tab.key;
						return (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveClient(tab.key)}
								className={`flex items-center gap-1.5 rounded-lg border p-2 text-sm transition-colors ${
									isActive
										? 'bg-[#EEEEFF] text-primary font-medium'
										: 'border-border bg-white text-accent-foreground font-normal'
								}`}
							>
								{tab.label}
							</button>
						);
					})}
				</div>

				{CLIENT_TABS.map((tab) => {
					if (tab.key !== activeClient) {
						return null;
					}
					return (
						<div key={tab.key}>
							<p className="text-sm text-gray-500 mb-2">
								{tab.target}
							</p>

							<pre className="bg-gray-50 border rounded-md p-4 text-xs overflow-x-auto whitespace-pre">
								{buildSnippet(tab.key)}
							</pre>

							{/* The snippet embeds a live credential. People do
							    paste these into issues and screenshots. */}
							<p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
								{__(
									'This snippet contains your API key. Treat it like a password — do not commit it to a repository, paste it into a shared chat, or include it in a screenshot.',
									'doublescale'
								)}
							</p>

							{tab.needsNode && (
								<p className="text-sm text-gray-500 mt-2">
									{__(
										'This client reaches the endpoint through a Node helper, so Node.js must be installed. Check with "node -v" — if that fails, install the LTS build from nodejs.org.',
										'doublescale'
									)}
								</p>
							)}

							{tab.needsNode && isWindows && (
								<p className="text-sm text-gray-500 mt-2">
									{__(
										'The Windows form runs the helper through cmd and passes the key as an environment variable. Both are needed: cmd.exe otherwise splits the Node path at the space in "Program Files", and splits the header at the space before "Bearer". Keep the leading space in AUTH_HEADER.',
										'doublescale'
									)}
								</p>
							)}

							<div className="flex items-center gap-3 mt-3">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleCopy(tab.key)}
								>
									{copied
										? __('Copied', 'doublescale')
										: __('Copy snippet', 'doublescale')}
								</Button>
								{!newKey && (
									<span className="text-sm text-gray-500">
										{__(
											'Create a key above to get a ready-to-paste snippet.',
											'doublescale'
										)}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Published tools */}
			{status.tools.length > 0 && (
				<div>
					<div className="text-[#09090B] font-semibold text-lg mb-4">
						{sprintf(
							/* translators: %d: number of tools */
							__('Published tools (%d)', 'doublescale'),
							status.tools.length
						)}
					</div>
					<div className="border rounded-md divide-y">
						{status.tools.map((tool) => (
							<div key={tool.name} className="p-3">
								<div className="font-mono text-xs text-gray-700">
									{tool.name}
								</div>
								<div className="text-sm text-gray-500 mt-1">
									{tool.description}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Troubleshooting */}
			<div className="mt-8">
				<div className="text-[#09090B] font-semibold text-lg mb-4">
					{__('Troubleshooting', 'doublescale')}
				</div>
				<div className="border rounded-md divide-y">
					{TROUBLESHOOTING.map((entry) => (
						<div key={entry.problem} className="p-3">
							<div className="text-sm font-medium">
								{entry.problem}
							</div>
							<div className="text-sm text-gray-500 mt-1">
								{entry.fix}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default McpSettings;
