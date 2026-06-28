<?php
/**
 * Knowledge Base feature settings.
 *
 * Lives in its own `doublescale_settings['knowledgebase']` slice and is read /
 * written directly here — NOT through the global RestSettingsController, whose
 * schema is not extensible (Support does the same with its `support` slice).
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Settings\Settings;

/**
 * KnowledgebaseSettings class.
 */
final class KnowledgebaseSettings {

	/**
	 * Settings slice key inside `doublescale_settings`.
	 */
	private const SLICE = 'knowledgebase';

	/**
	 * Default values for every v1 setting (so the module works untouched).
	 *
	 * @return array<string, mixed>
	 */
	public static function defaults(): array {
		return array(
			'public_access'           => 'public',
			'articles_per_page'       => 12,
			'enable_feedback'         => true,
			'show_in_portal'          => true,
			'default_group'           => 0,
			'show_toc'                => true,
			'show_related'            => true,
			'related_count'           => 4,
			'track_contact_views'     => true,
			'default_visibility'      => 'public',
			'restricted_redirect_url' => '',
			// Body editor for the admin article editor: the bespoke Lexical editor
			// (default) or the embedded Gutenberg block editor (opt-in MVP).
			'editor'                  => 'lexical',
		);
	}

	/**
	 * The full, defaults-merged settings array.
	 *
	 * @return array<string, mixed>
	 */
	public static function all(): array {
		$stored = Settings::get( self::SLICE, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}

		return array_merge( self::defaults(), $stored );
	}

	/**
	 * Read a single setting, defaults-merged.
	 *
	 * @param string $key Setting key.
	 * @return mixed
	 */
	public static function get( string $key ) {
		$all = self::all();

		return $all[ $key ] ?? null;
	}

	/**
	 * Persist a sanitised settings array (only known keys survive).
	 *
	 * @param array<string, mixed> $input Raw incoming settings.
	 * @return array<string, mixed> The stored, sanitised values.
	 */
	public static function save( array $input ): array {
		$sanitised = self::sanitize( $input );
		Settings::update( self::SLICE, $sanitised );

		return $sanitised;
	}

	/**
	 * Sanitise + clamp every known setting, falling back to current/default.
	 *
	 * @param array<string, mixed> $input Raw incoming settings.
	 * @return array<string, mixed>
	 */
	public static function sanitize( array $input ): array {
		$current = self::all();
		$out     = array();

		$access               = isset( $input['public_access'] ) ? (string) $input['public_access'] : $current['public_access'];
		$out['public_access'] = in_array( $access, array( 'public', 'portal', 'disabled' ), true ) ? $access : 'public';

		$per_page                 = isset( $input['articles_per_page'] ) ? (int) $input['articles_per_page'] : (int) $current['articles_per_page'];
		$out['articles_per_page'] = min( 100, max( 1, $per_page ) );

		$out['enable_feedback'] = isset( $input['enable_feedback'] ) ? (bool) $input['enable_feedback'] : (bool) $current['enable_feedback'];
		$out['show_in_portal']  = isset( $input['show_in_portal'] ) ? (bool) $input['show_in_portal'] : (bool) $current['show_in_portal'];
		$out['default_group']   = isset( $input['default_group'] ) ? max( 0, (int) $input['default_group'] ) : (int) $current['default_group'];
		$out['show_toc']        = isset( $input['show_toc'] ) ? (bool) $input['show_toc'] : (bool) $current['show_toc'];
		$out['show_related']    = isset( $input['show_related'] ) ? (bool) $input['show_related'] : (bool) $current['show_related'];

		$related_count        = isset( $input['related_count'] ) ? (int) $input['related_count'] : (int) $current['related_count'];
		$out['related_count'] = min( 12, max( 0, $related_count ) );

		$out['track_contact_views'] = isset( $input['track_contact_views'] ) ? (bool) $input['track_contact_views'] : (bool) $current['track_contact_views'];

		$default_visibility        = isset( $input['default_visibility'] ) ? (string) $input['default_visibility'] : $current['default_visibility'];
		$out['default_visibility'] = in_array( $default_visibility, array( 'public', 'members' ), true ) ? $default_visibility : 'public';

		$redirect                       = isset( $input['restricted_redirect_url'] ) ? esc_url_raw( (string) $input['restricted_redirect_url'] ) : (string) $current['restricted_redirect_url'];
		$out['restricted_redirect_url'] = $redirect;

		$editor        = isset( $input['editor'] ) ? (string) $input['editor'] : (string) $current['editor'];
		$out['editor'] = in_array( $editor, array( 'lexical', 'blocks' ), true ) ? $editor : 'lexical';

		return $out;
	}
}
