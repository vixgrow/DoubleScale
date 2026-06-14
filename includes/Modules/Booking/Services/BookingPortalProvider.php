<?php
/**
 * Booking ⇄ Client Portal bridge.
 *
 * Contributes the Bookings section, the "upcoming bookings" dashboard summary
 * card, and the booking-lifecycle timeline items to the portal. Booking
 * lifecycle is projected straight from `doublescale_bookings` here because the
 * `booking_*` activity types are never written to `doublescale_activities` (see
 * PortalActivityWhitelist).
 *
 * Resolved in {@see \DoubleScale\Modules\Booking\Module::boot()} so its filters
 * are only registered while the Booking module is enabled.
 *
 * @package DoubleScale\Modules\Booking
 */

namespace DoubleScale\Modules\Booking\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;

/**
 * BookingPortalProvider.
 */
final class BookingPortalProvider {

	public function __construct() {
		add_filter( 'doublescale_portal_sections', array( $this, 'register_section' ) );
		add_filter( 'doublescale_portal_summary_cards', array( $this, 'add_summary_card' ), 10, 2 );
		add_filter( 'doublescale_portal_timeline_items', array( $this, 'add_timeline_items' ), 10, 2 );
	}

	/**
	 * Contribute the Bookings section descriptor.
	 *
	 * @param array<int, array<string, mixed>> $sections Section descriptors.
	 * @return array<int, array<string, mixed>>
	 */
	public function register_section( array $sections ): array {
		$sections[] = array(
			'slug'         => 'bookings',
			'label'        => __( 'Bookings', 'doublescale' ),
			'icon'         => 'calendar',
			'order'        => 20,
			'is_available' => static fn() => doublescale_is_module_active( 'booking' ),
			'badge'        => static fn( $contact ) => self::count_upcoming( $contact ),
		);

		return $sections;
	}

	/**
	 * Add the "upcoming bookings" summary card.
	 *
	 * @param array<int, array<string, mixed>> $cards   Summary cards.
	 * @param ContactModel|null                $contact Resolved contact.
	 * @return array<int, array<string, mixed>>
	 */
	public function add_summary_card( array $cards, $contact ): array {
		$cards[] = array(
			'key'   => 'upcoming_bookings',
			'label' => __( 'Upcoming bookings', 'doublescale' ),
			'value' => self::count_upcoming( $contact ),
			'route' => 'bookings',
		);

		return $cards;
	}

	/**
	 * Project booking lifecycle rows into the timeline.
	 *
	 * @param array<int, array<string, mixed>> $items   Timeline items.
	 * @param ContactModel|null                $contact Resolved contact.
	 * @return array<int, array<string, mixed>>
	 */
	public function add_timeline_items( array $items, $contact ): array {
		if ( ! $contact instanceof ContactModel ) {
			return $items;
		}

		$bookings = BookingModel::with( array( 'event' ) )
			->where( 'contact_id', (int) $contact->id )
			->orderBy( 'id', 'desc' )
			->limit( 50 )
			->get();

		foreach ( $bookings as $booking ) {
			$event_name = $booking->event ? (string) $booking->event->name : __( 'Booking', 'doublescale' );

			$items[] = array(
				'id'         => 'booking-' . (int) $booking->id,
				'kind'       => 'booking',
				'type'       => self::lifecycle_type( $booking ),
				'date'       => (string) $booking->created_at,
				'title'      => $event_name,
				'status'     => (string) $booking->status,
				'start_time' => (string) $booking->start_time,
				'timezone'   => $booking->timezone ? (string) $booking->timezone : 'UTC',
				'booking_id' => (int) $booking->id,
			);
		}

		return $items;
	}

	/**
	 * Map a booking to a projected lifecycle activity-type slug.
	 *
	 * @param BookingModel $booking Booking.
	 * @return string
	 */
	private static function lifecycle_type( BookingModel $booking ): string {
		if ( $booking->isCancelled() ) {
			return 'booking_cancelled';
		}
		if ( $booking->isCompleted() ) {
			return 'booking_completed';
		}
		if ( 'pending' === $booking->status ) {
			return 'booking_pending';
		}

		return 'booking_scheduled';
	}

	/**
	 * Count a contact's upcoming (active, not-yet-ended) bookings.
	 *
	 * @param ContactModel|null $contact Resolved contact.
	 * @return int
	 */
	private static function count_upcoming( $contact ): int {
		if ( ! $contact instanceof ContactModel ) {
			return 0;
		}

		return (int) BookingModel::where( 'contact_id', (int) $contact->id )
			->active()
			->where( 'end_time', '>=', gmdate( 'Y-m-d H:i:s' ) )
			->count();
	}
}
