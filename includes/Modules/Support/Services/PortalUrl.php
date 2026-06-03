<?php
/**
 * Resolves customer-facing support portal URLs.
 *
 * @package DoubleScale\Modules\Support
 */

namespace DoubleScale\Modules\Support\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Support\Models\TicketModel;
use DoubleScale\Modules\Support\Renderer\PortalFrontendHandler;

/**
 * PortalUrl helper.
 */
final class PortalUrl {

	/**
	 * Query argument used to deep-link a ticket in the portal SPA.
	 */
	public const TICKET_QUERY_ARG = 'ds_support_ticket';

	/**
	 * Transient key for the resolved portal page permalink.
	 */
	private const PAGE_URL_TRANSIENT = 'doublescale_support_portal_page_url';

	/**
	 * Permalink of the first published page that contains the portal shortcode.
	 *
	 * @return string Empty when no portal page is found.
	 */
	public static function get_portal_page_url(): string {
		$cached = get_transient( self::PAGE_URL_TRANSIENT );
		if ( is_string( $cached ) ) {
			/**
			 * Filter the cached support portal page URL.
			 *
			 * @param string $url Portal page permalink (may be empty).
			 */
			return (string) apply_filters( 'doublescale_support_portal_page_url', $cached );
		}

		$page_id = self::locate_portal_page_id();
		$url     = $page_id > 0 ? (string) get_permalink( $page_id ) : '';

		set_transient( self::PAGE_URL_TRANSIENT, $url, HOUR_IN_SECONDS );

		/**
		 * Filter the resolved support portal page URL.
		 *
		 * @param string $url Portal page permalink (may be empty).
		 */
		return (string) apply_filters( 'doublescale_support_portal_page_url', $url );
	}

	/**
	 * Customer portal URL for a ticket (portal page + ticket query arg).
	 *
	 * @param TicketModel $ticket Ticket model.
	 * @return string Empty when the portal page cannot be resolved.
	 */
	public static function get_ticket_url( TicketModel $ticket ): string {
		$base = self::get_portal_page_url();
		if ( '' === $base ) {
			return '';
		}

		$url = add_query_arg( self::TICKET_QUERY_ARG, (int) $ticket->id, $base );

		/**
		 * Filter the customer portal URL for a support ticket.
		 *
		 * @param string      $url    Ticket portal URL.
		 * @param TicketModel $ticket Ticket model.
		 */
		return (string) apply_filters( 'doublescale_support_ticket_portal_url', $url, $ticket );
	}

	/**
	 * Clear the cached portal page URL (call when portal page content changes).
	 *
	 * @return void
	 */
	public static function flush_cache(): void {
		delete_transient( self::PAGE_URL_TRANSIENT );
	}

	/**
	 * Find a published page that embeds the portal shortcode.
	 *
	 * @return int Page ID, or 0.
	 */
	private static function locate_portal_page_id(): int {
		global $wpdb;

		$shortcode = '[' . PortalFrontendHandler::SHORTCODE_NAME . ']';
		$like      = '%' . $wpdb->esc_like( $shortcode ) . '%';

		$page_id = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts}
				WHERE post_type = 'page'
				AND post_status = 'publish'
				AND post_content LIKE %s
				ORDER BY ID ASC
				LIMIT 1",
				$like
			)
		);

		return $page_id > 0 ? $page_id : 0;
	}
}
