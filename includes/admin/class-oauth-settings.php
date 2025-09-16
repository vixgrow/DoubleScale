<?php
/**
 * OAuth Settings Page
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Admin;

use QuillCRM\Settings;

/**
 * OAuth Settings
 */
class OAuth_Settings {

	/**
	 * Initialize OAuth settings
	 */
	public function __construct() {
		add_action('admin_init', [$this, 'register_settings']);
		add_filter('quillcrm_settings_sections', [$this, 'add_settings_section']);
		add_filter('quillcrm_settings_fields', [$this, 'add_settings_fields']);
	}

	/**
	 * Register OAuth settings
	 */
	public function register_settings() {
		// Register GoHighLevel OAuth settings
		register_setting('quillcrm_settings', 'quillcrm_settings', [
			'sanitize_callback' => [$this, 'sanitize_settings']
		]);
	}

	/**
	 * Add OAuth settings section
	 *
	 * @param array $sections Existing sections
	 * @return array
	 */
	public function add_settings_section($sections) {
		$sections['integrations'] = [
			'title' => __('Integrations', 'quillcrm'),
			'description' => __('Configure OAuth integrations for importing contacts', 'quillcrm')
		];
		
		return $sections;
	}

	/**
	 * Add OAuth settings fields
	 *
	 * @param array $fields Existing fields
	 * @return array
	 */
	public function add_settings_fields($fields) {
		$fields['integrations']['gohighlevel_oauth'] = [
			'title' => __('GoHighLevel OAuth', 'quillcrm'),
			'type' => 'custom',
			'callback' => [$this, 'render_gohighlevel_oauth_settings'],
			'description' => __('Configure OAuth authentication for GoHighLevel contact imports', 'quillcrm')
		];

		return $fields;
	}

	/**
	 * Render GoHighLevel OAuth settings
	 */
	public function render_gohighlevel_oauth_settings() {
		// Render React component container
		?><div id="quillcrm-oauth-settings-root" class="quillcrm-react-container"></div>
		<script>
		document.addEventListener('DOMContentLoaded', function() {
			if (window.QuillCRM && window.QuillCRM.renderOAuthSettings) {
				window.QuillCRM.renderOAuthSettings('quillcrm-oauth-settings-root');
			}
		});
		</script><?php
	}

	/**
	 * Enqueue scripts for React component
	 */
	public function enqueue_oauth_scripts() {
		// This would be called when the settings page loads
		// The actual React component would be loaded via WordPress admin scripts
		wp_enqueue_script('quillcrm-oauth-settings');
		wp_enqueue_style('quillcrm-oauth-settings');
	}

	/**
	 * Sanitize OAuth settings
	 *
	 * @param array $settings Raw settings input
	 * @return array
	 */
	public function sanitize_settings($settings) {
		if (isset($settings['gohighlevel_client_id'])) {
			$settings['gohighlevel_client_id'] = sanitize_text_field($settings['gohighlevel_client_id']);
		}

		if (isset($settings['gohighlevel_client_secret'])) {
			$settings['gohighlevel_client_secret'] = sanitize_text_field($settings['gohighlevel_client_secret']);
		}

		return $settings;
	}
}