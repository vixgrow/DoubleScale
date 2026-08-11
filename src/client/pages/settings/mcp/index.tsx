/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { Badge } from '@doublescale/components/ui/badge';
import { Button } from '@doublescale/components/ui/button';
import { Input } from '@doublescale/components/ui/input';
import { Label } from '@doublescale/components/ui/label';
import { Switch } from '@doublescale/components/ui/switch';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@doublescale/components/ui/tabs';

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

interface McpStatus {
	abilities_enabled: boolean;
	mcp_enabled: boolean;
	connected: boolean;
	endpoint_url: string;
	tools: McpTool[];
	api_keys: McpApiKey[];
	current_user: string;
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
	const [newKey, setNewKey] = useState('');
	const [creatingKey, setCreatingKey] = useState(false);
	const [copied, setCopied] = useState(false);
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

	const buildSnippet = (client: ClientKey): string => {
		if (!status) {
			return '';
		}

		const url = status.endpoint_url;
		const authHeader = `Authorization: Bearer ${
			newKey || '<your-api-key>'
		}`;

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

		if (client === 'claude-desktop') {
			return JSON.stringify(
				{
					mcpServers: {
						doublescale: {
							command: 'npx',
							args: [
								'-y',
								'mcp-remote',
								url,
								'--header',
								authHeader,
							],
						},
					},
				},
				null,
				2
			);
		}

		if (client === 'codex') {
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

	const handleCreateKey = async () => {
		setCreatingKey(true);
		try {
			const response = await apiFetch<{
				key: string;
				api_keys: McpApiKey[];
			}>({
				path: '/doublescale/v1/mcp/keys',
				method: 'POST',
				data: { label: keyLabel || undefined },
			});
			// Held in state only for this render: the server stores a hash and
			// can never show it again.
			setNewKey(response.key);
			setKeyLabel('');
			setStatus((current) =>
				current ? { ...current, api_keys: response.api_keys } : current
			);
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to create API key', 'doublescale'),
			});
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
				<Badge variant={status.connected ? 'default' : 'secondary'}>
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

			{/* Enable toggle */}
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
					disabled={saving}
					onCheckedChange={handleToggle}
				/>
			</div>

			{!status.abilities_enabled && (
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
						<Badge variant="default">
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

				<p className="text-sm text-gray-500 mb-4">
					{__(
						'Give each client its own key — one for Claude Code, one for Cursor, and so on. Then you can revoke a single client without breaking the others.',
						'doublescale'
					)}
				</p>

				{/* Create a key */}
				<div className="flex items-end gap-3 mb-4">
					<div className="flex-1 max-w-sm">
						<Label className="text-sm">
							{__('Key name', 'doublescale')}
						</Label>
						<Input
							value={keyLabel}
							onChange={(event) => setKeyLabel(event.target.value)}
							placeholder={__('e.g. Claude on my laptop', 'doublescale')}
						/>
					</div>
					<Button
						onClick={handleCreateKey}
						disabled={creatingKey}
						size="sm"
					>
						{creatingKey
							? __('Creating…', 'doublescale')
							: __('Create API key', 'doublescale')}
					</Button>
				</div>

				{newKey && (
					<div className="mb-5 rounded-md border border-green-200 bg-green-50 p-4">
						<p className="text-sm font-medium text-green-900 mb-2">
							{__(
								'Copy this key now — it will not be shown again.',
								'doublescale'
							)}
						</p>
						<code className="block bg-white border rounded px-3 py-2 text-xs font-mono break-all">
							{newKey}
						</code>
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

				<Tabs defaultValue="claude-code">
					<TabsList>
						{CLIENT_TABS.map((tab) => (
							<TabsTrigger key={tab.key} value={tab.key}>
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>

					{CLIENT_TABS.map((tab) => (
						<TabsContent key={tab.key} value={tab.key}>
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
						</TabsContent>
					))}
				</Tabs>
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
