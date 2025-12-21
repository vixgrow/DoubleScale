export interface Plugin {
	id: string;
	name: string;
	icon?: string;
	description: string;
	pluginFile?: string; // WordPress plugin file path (e.g., 'quill-smtp/quillsmtp.php')
	downloadUrl?: string; // WordPress.org zip URL
	isInstalled?: boolean;
	isActive?: boolean;
	settingsUrl?: string; // URL to plugin settings page
}

export interface PluginStatus {
	isInstalled: boolean;
	isActive: boolean;
	actualPluginFile?: string | null; // The actual plugin file path if different from expected
}
