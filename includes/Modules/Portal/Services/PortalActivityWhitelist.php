<?php
/**
 * Customer-safe activity whitelist + shaper for the portal timeline.
 *
 * `doublescale_activities` is one table mixing customer-safe rows with
 * internal-only rows (agent notes, call logs, deal internals, logins that carry
 * IPs). The portal timeline MUST whitelist by `activity_type` before exposing
 * anything.
 *
 * NOTE (audited 2026-06-14): the `booking_*` activity types defined in
 * {@see \DoubleScale\Core\Constants\ActivityTypes} are never written to this
 * table — booking lifecycle is projected directly from BookingModel by the
 * timeline controller. The only customer-safe row actually written here (with a
 * `contact_id`) is `support_reply`. This whitelist therefore exists to *drop*
 * the internal rows, not to surface booking data.
 *
 * @package DoubleScale\Modules\Portal
 */

namespace DoubleScale\Modules\Portal\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Modules\Activities\Models\ActivityModel;

/**
 * PortalActivityWhitelist helper.
 */
final class PortalActivityWhitelist {

	/**
	 * Activity types from `doublescale_activities` that are safe to expose to
	 * the owning contact. Keep this list tight — everything else is internal.
	 *
	 * @return array<int, string>
	 */
	public static function allowed_types(): array {
		/**
		 * Filter the customer-safe activity types shown in the portal timeline.
		 *
		 * Operators can opt-in extra types (e.g. `email_sent`) but the default
		 * is intentionally minimal.
		 *
		 * @param array<int, string> $types Allowed activity_type strings.
		 */
		return (array) apply_filters(
			'doublescale_portal_timeline_activity_types',
			array( ActivityTypes::SUPPORT_REPLY )
		);
	}

	/**
	 * Whether an activity type is safe to surface in the portal.
	 *
	 * @param string $type Activity type slug.
	 * @return bool
	 */
	public static function is_allowed( string $type ): bool {
		return in_array( $type, self::allowed_types(), true );
	}

	/**
	 * Shape a whitelisted activity row into a safe timeline item.
	 *
	 * Emits only safe fields and a generic author label — never the agent's
	 * user id / name. Returns null for any row whose type is not whitelisted
	 * (defence-in-depth: the query already filters, this is a second gate).
	 *
	 * @param ActivityModel $activity Activity row (already scoped to the contact).
	 * @return array<string, mixed>|null
	 */
	public static function shape( ActivityModel $activity ): ?array {
		$type = (string) $activity->activity_type;
		if ( ! self::is_allowed( $type ) ) {
			return null;
		}

		$data    = is_array( $activity->data ) ? $activity->data : array();
		$is_self = empty( $activity->user_id );

		$item = array(
			'id'      => (int) $activity->id,
			'kind'    => 'activity',
			'type'    => $type,
			'date'    => self::row_date( $activity ),
			'is_self' => $is_self,
			'author'  => $is_self ? __( 'You', 'doublescale' ) : __( 'Support team', 'doublescale' ),
		);

		if ( ActivityTypes::SUPPORT_REPLY === $type ) {
			$item['title']     = __( 'Support reply', 'doublescale' );
			$item['ticket_id'] = isset( $data['ticket_id'] ) ? (int) $data['ticket_id'] : 0;
		} else {
			$item['title'] = ucwords( str_replace( '_', ' ', $type ) );
		}

		return $item;
	}

	/**
	 * Best-effort timestamp for an activity row.
	 *
	 * @param ActivityModel $activity Activity row.
	 * @return string|null
	 */
	private static function row_date( ActivityModel $activity ): ?string {
		if ( ! empty( $activity->activity_date ) ) {
			return (string) $activity->activity_date;
		}
		if ( ! empty( $activity->created_at ) ) {
			return (string) $activity->created_at;
		}

		return null;
	}
}
