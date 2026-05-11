<?php

namespace DoubleScale\Modules\Booking\Services;

use DoubleScale\Modules\Booking\Models\BookingHostsModel;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Booking\Models\EventModel;
use DoubleScale\Modules\Booking\Models\CalendarModel;
use DoubleScale\Modules\Booking\Models\BookedSlotModel;
use DoubleScale\Modules\Booking\Services\BookingEvents;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use Exception;
use Illuminate\Support\Arr;

class BookingService {


	/**
	 * Book an event slot.
	 *
	 * @param EventModel $event The event being booked.
	 * @param int         $calendar_id The calendar ID.
	 * @param \DateTime   $start_date The start date/time of the booking.
	 * @param int         $duration The duration of the booking in minutes.
	 * @param string      $timezone The timezone of the booking.
	 * @param array       $invitees The invitees for the booking.
	 * @param string      $location The location of the booking.
	 * @param string      $status The status of the booking.
	 * @param array       $fields Additional fields for the booking.
	 * @param int|null    $user_id The user ID for the booking (optional).
	 *
	 * @return BookingModel
	 * @throws \Exception If booking fails.
	 */
	public function book_event_slot( $event, $calendar_id, $start_date, $duration, $timezone, $invitees, $location, $status = 'scheduled', $fields = array(), $user_id = null ) {
		$end_date = clone $start_date;
		$end_date->modify( "+{$duration} minutes" );

		$utc              = new \DateTimeZone( 'UTC' );
		$start_utc_string = ( clone $start_date )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$end_utc_string   = ( clone $end_date )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );

		$overlap_check = function () use ( $event, $user_id, $calendar_id, $start_utc_string, $end_utc_string ) {
			if ( in_array( $event->type, array( 'round-robin', 'collective' ), true ) ) {
				$host_ids_to_check = is_array( $user_id ) ? $user_id : array( $user_id );
				foreach ( $host_ids_to_check as $host_to_check ) {
					if ( self::host_has_overlap( (int) $host_to_check, $start_utc_string, $end_utc_string ) ) {
						throw new \Exception( __( 'This time slot has just been booked. Please choose another.', 'doublescale' ) );
					}
				}
			} elseif ( 'group' === $event->type ) {
				// Group events allow multiple concurrent bookings up to
				// `group_settings.max_invites` (default 2 — matches
				// EventModel::check_available_slots). Reject only once
				// capacity is reached, otherwise we silently cap at 1.
				$max_invites = (int) Arr::get( $event->group_settings, 'max_invites', 2 );
				if ( $max_invites < 1 ) {
					$max_invites = 1;
				}
				$current = BookedSlotModel::count_overlaps( $calendar_id, $start_utc_string, $end_utc_string );
				if ( $current >= $max_invites ) {
					throw new \Exception( __( 'This time slot has just been booked. Please choose another.', 'doublescale' ) );
				}
			} elseif ( BookedSlotModel::has_overlap( $calendar_id, $start_utc_string, $end_utc_string ) ) {
				throw new \Exception( __( 'This time slot has just been booked. Please choose another.', 'doublescale' ) );
			}
		};

		$host_ids = is_array( $user_id )
			? $user_id
			: array( $user_id ?? $event->user_id ?? get_current_user_id() );

		return $this->create_booking(
			array(
				'entity'          => $event,
				'calendar_id'     => $calendar_id,
				'start_date'      => $start_date,
				'end_date'        => $end_date,
				'duration'        => $duration,
				'timezone'        => $timezone,
				'invitees'        => $invitees,
				'location'        => $location,
				'status'          => $status,
				'fields'          => $fields,
				'source'          => 'event-page',
				'booking_ref'     => array( 'event_id' => $event->id ),
				'slot_acquire'    => array( $event->id ),
				'host_ids'        => $host_ids,
				'overlap_check'   => $overlap_check,
				'log_message'     => __( 'Booking created', 'doublescale' ),
				'log_details_fmt' => __( 'Booking created by %2$s', 'doublescale' ),
			)
		);
	}

	/**
	 * Core booking creation logic for event flows.
	 *
	 * @param array $args {
	 *     @type object   $entity          Event model.
	 *     @type int      $calendar_id     Calendar ID.
	 *     @type \DateTime $start_date     Start datetime.
	 *     @type \DateTime $end_date       End datetime.
	 *     @type int      $duration        Duration in minutes.
	 *     @type string   $timezone        Booking timezone.
	 *     @type array    $invitees        Validated invitees.
	 *     @type mixed    $location        Location data.
	 *     @type string   $status          Initial status.
	 *     @type array    $fields          Custom fields.
	 *     @type string   $source          Booking source identifier.
	 *     @type array    $booking_ref     Entity reference (event_id).
	 *     @type array    $slot_acquire    Extra args for BookedSlotModel::acquire.
	 *     @type array    $host_ids        Host user IDs.
	 *     @type callable $overlap_check   Overlap validation callback.
	 *     @type array    $extra_meta      Additional meta to save on the booking.
	 *     @type string   $log_message     Log message.
	 *     @type string   $log_details_fmt Log details sprintf format.
	 * }
	 *
	 * @return BookingModel
	 * @throws \Exception
	 */
	private function create_booking( $args ) {
		global $wpdb;

		$entity        = $args['entity'];
		$calendar_id   = $args['calendar_id'];
		$start_date    = $args['start_date'];
		$end_date      = $args['end_date'];
		$duration      = $args['duration'];
		$timezone      = $args['timezone'];
		$invitees      = $args['invitees'];
		$location      = $args['location'];
		$status        = $args['status'];
		$fields        = $args['fields'];
		$source        = $args['source'];
		$booking_ref   = $args['booking_ref'];
		$slot_acquire  = $args['slot_acquire'];
		$host_ids      = $args['host_ids'];
		$overlap_check = $args['overlap_check'];
		$extra_meta    = $args['extra_meta'] ?? array();

		$pending_type = null;
		if ( $entity->requireConfirmation( $start_date ) && 'scheduled' !== $status ) {
			$pending_type = 'confirmation';
			$status       = 'pending';
		}
		if ( $entity->requirePayment() && 'scheduled' !== $status ) {
			$pending_type = 'payment';
			$status       = 'pending';
		}

		$utc              = new \DateTimeZone( 'UTC' );
		$start_utc_string = ( clone $start_date )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$end_utc_string   = ( clone $end_date )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );

		$wpdb->query( 'START TRANSACTION' );
		try {
			$overlap_check();

			foreach ( $invitees as $invitee ) {
				$contact = $this->resolve_or_create_contact_for_invitee( $invitee );
				if ( ! $contact ) {
					throw new \Exception( __( 'Failed to book', 'doublescale' ) );
				}

				$booking              = new BookingModel();
				foreach ( $booking_ref as $key => $value ) {
					$booking->$key = $value;
				}
				$booking->calendar_id = $calendar_id;
				$booking->contact_id  = (int) $contact->id;
				$booking->start_time  = $start_utc_string;
				$booking->end_time    = $end_utc_string;
				$booking->status      = $status;
				$booking->event_url   = home_url();
				$booking->source      = $source;
				$booking->slot_time   = $duration;

				if ( ! $booking->save() ) {
					throw new \Exception( __( 'Failed to book', 'doublescale' ) );
				}

				$booking->location = $location;
				$booking->timezone = $timezone;
				$booking->save();

				BookedSlotModel::acquire(
					$calendar_id,
					$start_utc_string,
					$end_utc_string,
					$booking->id,
					...$slot_acquire
				);

				if ( ! empty( $fields ) ) {
					$booking->update_meta( 'fields', $fields );
				}

				foreach ( $extra_meta as $meta_key => $meta_value ) {
					$booking->update_meta( $meta_key, $meta_value );
				}

				$contact_display_name = trim( ( $contact->first_name ?? '' ) . ' ' . ( $contact->last_name ?? '' ) );
				if ( '' === $contact_display_name ) {
					$contact_display_name = $invitee['name'] ?? $contact->email;
				}

				$booking->logs()->create(
					array(
						'type'    => 'info',
						'message' => $args['log_message'],
						'details' => sprintf( $args['log_details_fmt'], $entity->name, $contact_display_name ),
					)
				);

				foreach ( $host_ids as $host_user_id ) {
					$booking_hosts             = new BookingHostsModel();
					$booking_hosts->booking_id = $booking->id;
					$booking_hosts->user_id    = $host_user_id;
					$booking_hosts->status     = $status;
					if ( ! $booking_hosts->save() ) {
						$booking->delete();
						throw new \Exception( __( 'Failed to book', 'doublescale' ) );
					}
				}

				if ( $entity->requirePayment() && 'pending' === $status ) {
					do_action( 'doublescale_booking_payment_status', $booking );
				}

				$wpdb->query( 'COMMIT' );

				if ( 'pending' === $status && 'confirmation' === $pending_type ) {
					BookingEvents::emit(
						'pending',
						(int) $booking->id,
						array(
							'actor'  => 'attendee',
							'reason' => 'confirmation',
						)
					);
				} elseif ( 'pending' !== $status ) {
					BookingEvents::emit( 'created', (int) $booking->id, array( 'actor' => 'attendee' ) );
				}

				return $booking;
			}
		} catch ( \Exception $e ) {
			$wpdb->query( 'ROLLBACK' );
			throw $e;
		}
	}

	/**
	 * Add a customer to the waiting list for an event slot.
	 *
	 * Does NOT acquire a BookedSlotModel record (waiting bookings don't
	 * consume slots) and does NOT trigger payment flow.
	 *
	 * @param EventModel $entity     Event being booked.
	 * @param int       $calendar_id Calendar ID.
	 * @param \DateTime $start_date  Start datetime.
	 * @param int       $duration    Duration in minutes.
	 * @param string    $timezone    Booking timezone.
	 * @param array     $invitees    Validated invitees.
	 * @param string    $location    Location data.
	 * @param array     $fields      Custom fields.
	 * @param array     $host_ids    Host user IDs.
	 *
	 * @return BookingModel
	 * @throws \Exception
	 */
	public function book_waiting_list_slot( $entity, $calendar_id, $start_date, $duration, $timezone, $invitees, $location, $fields = array(), $host_ids = array() ) {
		global $wpdb;

		$end_date = clone $start_date;
		$end_date->modify( "+{$duration} minutes" );

		$utc              = new \DateTimeZone( 'UTC' );
		$start_utc_string = ( clone $start_date )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );
		$end_utc_string   = ( clone $end_date )->setTimezone( $utc )->format( 'Y-m-d H:i:s' );

		$wl_settings = $entity->waiting_list_settings;
		$wl_capacity = isset( $wl_settings['capacity'] ) ? (int) $wl_settings['capacity'] : 10;

		if ( ! empty( $wl_settings['limit_additional_people'] ) ) {
			$max_people    = (int) ( $wl_settings['additional_people_limit'] ?? 0 );
			$total_allowed = $max_people + 1;
			if ( count( $invitees ) > $total_allowed ) {
				throw new \Exception(
					sprintf(
						/* translators: %d: maximum allowed additional people */
						__( 'You can bring at most %d additional people when joining the waiting list', 'doublescale' ),
						$max_people
					)
				);
			}
		}

		$wpdb->query( 'START TRANSACTION' );
		try {
			$position_query = BookingModel::where( 'status', 'waiting' )
				->where( 'start_time', $start_utc_string )
				->where( 'end_time', $end_utc_string )
				->where( 'event_id', $entity->id );

			$current_waiting = $position_query->count();

			if ( $current_waiting >= $wl_capacity ) {
				$wpdb->query( 'ROLLBACK' );
				throw new \Exception( __( 'The waiting list for this time slot is full', 'doublescale' ) );
			}

			$last_booking = null;
			foreach ( $invitees as $idx => $invitee ) {
				$contact = $this->resolve_or_create_contact_for_invitee( $invitee );
				if ( ! $contact ) {
					throw new \Exception( __( 'Failed to join waiting list', 'doublescale' ) );
				}

				$booking              = new BookingModel();
				$booking->event_id    = $entity->id;
				$booking->calendar_id = $calendar_id;
				$booking->contact_id  = (int) $contact->id;
				$booking->start_time  = $start_utc_string;
				$booking->end_time    = $end_utc_string;
				$booking->status      = 'waiting';
				$booking->event_url   = home_url();
				$booking->source      = 'event-page';
				$booking->slot_time   = $duration;

				if ( ! $booking->save() ) {
					throw new \Exception( __( 'Failed to join waiting list', 'doublescale' ) );
				}

				$booking->location = $location;
				$booking->timezone = $timezone;
				$booking->save();

				if ( ! empty( $fields ) ) {
					$booking->update_meta( 'fields', $fields );
				}

				$booking->update_meta( 'waiting_list_position', $current_waiting + $idx + 1 );

				$contact_display_name = trim( ( $contact->first_name ?? '' ) . ' ' . ( $contact->last_name ?? '' ) );
				if ( '' === $contact_display_name ) {
					$contact_display_name = $invitee['name'] ?? $contact->email;
				}

				$booking->logs()->create(
					array(
						'type'    => 'info',
						'message' => __( 'Joined waiting list', 'doublescale' ),
						'details' => sprintf( __( '%s joined the waiting list at position #%d', 'doublescale' ), $contact_display_name, $current_waiting + $idx + 1 ),
					)
				);

				foreach ( $host_ids as $host_user_id ) {
					$booking_hosts             = new BookingHostsModel();
					$booking_hosts->booking_id = $booking->id;
					$booking_hosts->user_id    = $host_user_id;
					$booking_hosts->status     = 'waiting';
					if ( ! $booking_hosts->save() ) {
						$booking->delete();
						throw new \Exception( __( 'Failed to join waiting list', 'doublescale' ) );
					}
				}

				$last_booking = $booking;
			}

			$wpdb->query( 'COMMIT' );

			if ( $last_booking ) {
				BookingEvents::emit( 'waiting_list_joined', (int) $last_booking->id );
			}

			return $last_booking;
		} catch ( \Exception $e ) {
			$wpdb->query( 'ROLLBACK' );
			throw $e;
		}
	}

	/**
	 * Sanitize and validate an invitee list.
	 *
	 * @param array $invitee    Raw invitee array of {name, email}.
	 * @param bool  $allow_many Whether multiple invitees are allowed.
	 * @param string $multi_error Error message when multiple invitees are not allowed.
	 *
	 * @throws \Exception
	 * @return array Sanitized invitee list.
	 */
	public function validate_invitee_list( $invitee, $allow_many = false, $multi_error = '' ) {
		$invitee = array_map(
			function ( $item ) {
				$name  = sanitize_text_field( Arr::get( $item, 'name', null ) );
				$email = sanitize_email( Arr::get( $item, 'email', null ) );

				if ( ! $name || ! $email ) {
					throw new \Exception( __( 'Invalid invitee', 'doublescale' ) );
				}

				$guest = array(
					'name'  => $name,
					'email' => $email,
				);

				if ( $user = get_user_by( 'email', $email ) ) {
					$guest['user_id'] = $user->ID;
				}

				return $guest;
			},
			$invitee
		);

		if ( ! $allow_many && count( $invitee ) > 1 ) {
			throw new \Exception( $multi_error ?: __( 'Multiple invitees are not allowed', 'doublescale' ) );
		}

		return $invitee;
	}

	/**
	 * Validate invitee for event bookings.
	 *
	 * @param EventModel $event
	 * @param array       $invitee
	 *
	 * @throws \Exception
	 * @return array
	 */
	public function validate_invitee( $event, $invitee ) {
		return $this->validate_invitee_list(
			$invitee,
			'group' === $event->type,
			__( 'Invalid event type', 'doublescale' )
		);
	}

	/**
	 * Check if a specific host (user) has any non-cancelled booking that
	 * overlaps the given UTC time range. Used for round-robin / collective
	 * events where the overlap must be checked per-host, not per-calendar.
	 *
	 * @param int    $host_user_id WordPress user ID of the host.
	 * @param string $start        UTC datetime string.
	 * @param string $end          UTC datetime string.
	 *
	 * @return bool True if the host already has a conflicting booking.
	 */
	public static function host_has_overlap( $host_user_id, $start, $end ) {
		$count = BookingModel::query()
			->whereHas(
				'hosts',
				function ( $q ) use ( $host_user_id ) {
					$q->where( 'user_id', $host_user_id );
				}
			)
			->whereNotIn( 'status', BookingModel::NON_ACTIVE_STATUSES )
			->where( 'start_time', '<', $end )
			->where( 'end_time', '>', $start )
			->count();

		return $count > 0;
	}

	/**
	 * Resolve a CRM contact for a booking invitee, creating one if needed.
	 *
	 * Every booker becomes a CRM contact (HubSpot-style). Lookup is by email
	 * via firstOrCreate, which is atomic against the contacts.email UNIQUE KEY
	 * so two parallel bookings can't double-insert. Name policy is latest-write-wins:
	 * each booking overwrites first_name/last_name with the invitee-supplied values
	 * (only when non-empty, so a blank submission doesn't blank a stored name).
	 *
	 * @param array $invitee Invitee payload — expects `email` and `name` keys.
	 * @return ContactModel|null Resolved contact, or null when email is invalid.
	 */
	private function resolve_or_create_contact_for_invitee( array $invitee ): ?ContactModel {
		$email = sanitize_email( $invitee['email'] ?? '' );
		if ( empty( $email ) || ! is_email( $email ) ) {
			return null;
		}

		$name_parts = explode( ' ', trim( $invitee['name'] ?? '' ), 2 );
		$first_name = isset( $name_parts[0] ) ? sanitize_text_field( $name_parts[0] ) : '';
		$last_name  = isset( $name_parts[1] ) ? sanitize_text_field( $name_parts[1] ) : '';

		$contact = ContactModel::firstOrCreate(
			array( 'email' => $email ),
			array(
				'first_name' => $first_name,
				'last_name'  => $last_name,
				'source'     => 'booking',
			)
		);

		if ( ! $contact ) {
			return null;
		}

		$dirty = false;
		if ( '' !== $first_name && $contact->first_name !== $first_name ) {
			$contact->first_name = $first_name;
			$dirty               = true;
		}
		if ( '' !== $last_name && $contact->last_name !== $last_name ) {
			$contact->last_name = $last_name;
			$dirty              = true;
		}
		if ( $dirty ) {
			$contact->save();
		}

		return $contact;
	}
}
