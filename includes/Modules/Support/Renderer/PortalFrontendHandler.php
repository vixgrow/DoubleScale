<?php
/**
 * Customer-facing support portal renderer.
 *
 * Renders the `[doublescale_support_portal]` shortcode. Mirrors the
 * Booking renderer's enqueue pattern ({@see Modules/Booking/Renderer/BookingFrontendHandler.php}),
 * with two key differences:
 *
 *   1. Portal is shortcode-driven, NOT URL-query-driven, so we do NOT
 *      hijack `template_redirect` or wipe the global styles queue —
 *      the portal renders inline on whatever page the admin pasted
 *      the shortcode onto (host theme stays intact).
 *
 *   2. Portal is logged-in-only by product direction. A shortcode
 *      placed on a public page returns an empty string for logged-out
 *      visitors — no markup, no mount node, no enqueued bundle. This
 *      mirrors the way the booking renderer simply returns early when
 *      no booking is being viewed.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Renderer;

defined( 'ABSPATH' ) || exit;

final class PortalFrontendHandler {

	public const SHORTCODE_NAME = 'doublescale_support_portal';

	private const SHORTCODE = self::SHORTCODE_NAME;
	private const MOUNT_ID  = 'doublescale-support-portal';
	private const HANDLE    = 'doublescale-support-renderer';

	public function __construct() {
		add_shortcode( self::SHORTCODE, array( $this, 'render_shortcode' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue' ) );
		add_action( 'save_post_page', array( self::class, 'maybe_flush_portal_url_cache' ), 10, 1 );
	}

	/**
	 * Invalidate the cached portal permalink when a page containing the shortcode is saved.
	 *
	 * @param int $post_id Saved post ID.
	 * @return void
	 */
	public static function maybe_flush_portal_url_cache( $post_id ): void {
		$post = get_post( $post_id );
		if ( ! $post || 'page' !== $post->post_type || empty( $post->post_content ) ) {
			return;
		}
		if ( has_shortcode( $post->post_content, self::SHORTCODE_NAME ) ) {
			\DoubleScale\Modules\Support\Services\PortalUrl::flush_cache();
		}
	}

	/**
	 * Shortcode callback.
	 *
	 * Returns the mount markup for logged-in users; nothing for guests. The
	 * optional `box_id` attribute scopes the portal to one support mailbox:
	 * `[doublescale_support_portal box_id="3"]` makes tickets created here route
	 * to mailbox 3 (and the customer sees only that mailbox's tickets). The
	 * default `box_id="0"` leaves the portal unscoped. The id rides on the mount
	 * node as `data-box-id`, so multiple scoped portals can coexist on one page.
	 *
	 * We enqueue from `wp_enqueue_scripts` (not here) so the bundle is
	 * available even if the shortcode lives below content that hasn't
	 * been parsed yet by the time scripts are decided.
	 *
	 * @param array<string, mixed>|string $atts Shortcode attributes; `box_id` (int) optional.
	 * @return string HTML mount node, or empty string for guests.
	 */
	public function render_shortcode( $atts = array() ): string {
		if ( ! is_user_logged_in() ) {
			return '';
		}

		$atts   = shortcode_atts( array( 'box_id' => 0 ), $atts, self::SHORTCODE );
		$box_id = max( 0, (int) $atts['box_id'] );

		return sprintf(
			'<div id="%s" data-box-id="%d"></div>',
			esc_attr( self::MOUNT_ID ),
			$box_id
		);
	}

	/**
	 * Register + enqueue the renderer bundle on pages that contain the
	 * shortcode AND are being viewed by a logged-in user. This keeps the
	 * JS off every page on the site (it's only needed where the admin
	 * actually placed the shortcode) and off logged-out visits entirely.
	 */
	public function maybe_enqueue(): void {
		if ( ! is_user_logged_in() ) {
			return;
		}

		if ( ! $this->current_page_has_shortcode() ) {
			return;
		}

		$plugin_dir = defined( 'DOUBLESCALE_PLUGIN_DIR' ) ? \DOUBLESCALE_PLUGIN_DIR : '';
		$plugin_url = defined( 'DOUBLESCALE_PLUGIN_URL' ) ? \DOUBLESCALE_PLUGIN_URL : '';
		$version    = defined( 'DOUBLESCALE_VERSION' ) ? \DOUBLESCALE_VERSION : '1.0.0';

		$asset_file = $plugin_dir . 'build/renderer/support/index.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : null;
		$deps       = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
		$ver        = isset( $asset['version'] ) ? $asset['version'] : $version;

		wp_register_script(
			self::HANDLE,
			$plugin_url . 'build/renderer/support/index.js',
			$deps,
			$ver,
			true
		);

		wp_register_style(
			self::HANDLE,
			$plugin_url . 'build/renderer/support/style.css',
			array(),
			$ver
		);

		$user = wp_get_current_user();

		wp_localize_script(
			self::HANDLE,
			'doublescale_support_portal_config',
			array(
				'rest_url'  => esc_url_raw( rest_url( 'doublescale/v1/support/portal' ) ),
				'rest_root' => esc_url_raw( rest_url() ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'user'      => array(
					'id'           => (int) $user->ID,
					'email'        => sanitize_email( $user->user_email ),
					'display_name' => $user->display_name ? sanitize_text_field( $user->display_name ) : '',
				),
				'lang'      => get_locale(),
				'mount_id'  => self::MOUNT_ID,
			)
		);

		wp_style_add_data( self::HANDLE, 'rtl', 'replace' );

		wp_enqueue_script( self::HANDLE );
		wp_enqueue_style( self::HANDLE );
	}

	/**
	 * True if the currently-rendering post contains our shortcode.
	 *
	 * We check `$post->post_content` directly rather than parsing the
	 * full output, because `has_shortcode( get_the_content(), … )` is
	 * unreliable on archive / shop pages where the loop hasn't started
	 * yet at `wp_enqueue_scripts` time. The post object is already
	 * populated by then on singular views, which is where shortcodes
	 * live in practice.
	 */
	private function current_page_has_shortcode(): bool {
		if ( ! is_singular() ) {
			return false;
		}

		$post = get_post();
		if ( ! $post || empty( $post->post_content ) ) {
			return false;
		}

		return has_shortcode( $post->post_content, self::SHORTCODE );
	}
}
