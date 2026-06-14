<?php
/**
 * GET /doublescale/v1/portal/timeline
 *
 * Whitelisted activity feed for the current contact, paginated. Two sources are
 * merged (see the audit note on PortalActivityWhitelist):
 *
 *   1. `doublescale_activities` rows filtered to the customer-safe whitelist
 *      (currently `support_reply` only) and shaped to drop agent identity.
 *   2. Module-contributed items via the `doublescale_portal_timeline_items`
 *      filter — Booking projects its lifecycle straight from BookingModel here,
 *      because the `booking_*` activity types are never written to the table.
 *
 * @package DoubleScale\Modules\Portal
 */

namespace DoubleScale\Modules\Portal\Rest\Controllers;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Portal\Services\PortalActivityWhitelist;
use DoubleScale\Modules\Portal\Services\PortalIdentity;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * RestPortalTimelineController.
 */
class RestPortalTimelineController extends RestController {

	/**
	 * REST base.
	 *
	 * @var string
	 */
	protected $rest_base = 'portal';

	/**
	 * Hard cap on rows fetched from the activities table before merge/paging.
	 */
	private const MAX_ACTIVITY_ROWS = 200;

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/timeline',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_timeline' ),
					'permission_callback' => array( PortalIdentity::class, 'permission_check' ),
					'args'                => array(
						'page'     => array(
							'type'    => 'integer',
							'default' => 1,
						),
						'per_page' => array(
							'type'    => 'integer',
							'default' => 20,
						),
					),
				),
			)
		);
	}

	/**
	 * Build the merged, paginated timeline.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public function get_timeline( WP_REST_Request $request ) {
		$contact = PortalIdentity::current_contact();
		if ( ! $contact ) {
			return new WP_REST_Response(
				array(
					'data'     => array(),
					'page'     => 1,
					'per_page' => (int) $request->get_param( 'per_page' ),
					'total'    => 0,
				),
				200
			);
		}

		$page     = max( 1, (int) $request->get_param( 'page' ) );
		$per_page = min( 100, max( 1, (int) $request->get_param( 'per_page' ) ) );

		$items = $this->collect_activity_items( (int) $contact->id );

		/**
		 * Filter the merged portal timeline items before sort/paging.
		 *
		 * Booking (and other modules) push their own shaped items here:
		 * array{ id, kind, type, date(Y-m-d H:i:s|null), title, ... }.
		 *
		 * @param array<int, array<string, mixed>>                       $items   Timeline items.
		 * @param \DoubleScale\Modules\Contacts\Models\ContactModel       $contact Resolved contact.
		 */
		$items = (array) apply_filters( 'doublescale_portal_timeline_items', $items, $contact );
		$items = array_values( array_filter( $items, 'is_array' ) );

		usort(
			$items,
			static function ( $a, $b ) {
				$da = isset( $a['date'] ) ? (string) $a['date'] : '';
				$db = isset( $b['date'] ) ? (string) $b['date'] : '';
				return strcmp( $db, $da );
			}
		);

		$total  = count( $items );
		$offset = ( $page - 1 ) * $per_page;
		$paged  = array_slice( $items, $offset, $per_page );

		return new WP_REST_Response(
			array(
				'data'     => $paged,
				'page'     => $page,
				'per_page' => $per_page,
				'total'    => $total,
			),
			200
		);
	}

	/**
	 * Fetch + shape the whitelisted activity rows for a contact.
	 *
	 * @param int $contact_id Contact id.
	 * @return array<int, array<string, mixed>>
	 */
	private function collect_activity_items( int $contact_id ): array {
		$rows = ActivityModel::where( 'contact_id', $contact_id )
			->whereIn( 'activity_type', PortalActivityWhitelist::allowed_types() )
			->orderBy( 'id', 'desc' )
			->limit( self::MAX_ACTIVITY_ROWS )
			->get();

		$items = array();
		foreach ( $rows as $row ) {
			$shaped = PortalActivityWhitelist::shape( $row );
			if ( null !== $shaped ) {
				$items[] = $shaped;
			}
		}

		return $items;
	}
}
