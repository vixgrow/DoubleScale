<?php

namespace DoubleScale\Modules\Booking\Models;

use WPEloquent\Eloquent\Model;

class BookedSlotModel extends Model {

	protected $table = 'doublescale_booking_booked_slots';

	protected $primary_key = 'id';

	public $timestamps = false;

	protected $fillable = array(
		'calendar_id',
		'event_id',
		'booking_id',
		'slot_start',
		'slot_end',
		'status',
	);

	protected $casts = array(
		'calendar_id' => 'integer',
		'event_id'    => 'integer',
		'booking_id'  => 'integer',
	);

	public function booking() {
		return $this->belongsTo( BookingModel::class, 'booking_id', 'id' );
	}

	public function calendar() {
		return $this->belongsTo( CalendarModel::class, 'calendar_id', 'id' );
	}

	public static function acquire( $calendar_id, $slot_start, $slot_end, $booking_id, $event_id = null ) {
		try {
			return static::create(
				array(
					'calendar_id' => $calendar_id,
					'slot_start'  => $slot_start,
					'slot_end'    => $slot_end,
					'booking_id'  => $booking_id,
					'event_id'    => $event_id,
					'status'      => 'booked',
				)
			);
		} catch ( \Exception $e ) {
			if ( self::is_duplicate_entry_error( $e ) ) {
				throw new \Exception(
					__( 'This time slot has just been booked. Please choose another.', 'doublescale' )
				);
			}
			throw $e;
		}
	}

	public static function release( $booking_id ) {
		return static::where( 'booking_id', $booking_id )->delete();
	}

	public static function has_overlap( $calendar_id, $start, $end ) {
		global $wpdb;

		$table = $wpdb->prefix . 'doublescale_booking_booked_slots';

		$count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table}
				WHERE calendar_id = %d
				  AND status = 'booked'
				  AND slot_start < %s
				  AND slot_end > %s
				FOR UPDATE",
				$calendar_id,
				$end,
				$start
			)
		);

		return $count > 0;
	}

	public static function count_overlaps( $calendar_id, $start, $end ) {
		global $wpdb;

		$table = $wpdb->prefix . 'doublescale_booking_booked_slots';

		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table}
				WHERE calendar_id = %d
				  AND status = 'booked'
				  AND slot_start < %s
				  AND slot_end > %s
				FOR UPDATE",
				$calendar_id,
				$end,
				$start
			)
		);
	}

	private static function is_duplicate_entry_error( $e ) {
		$message = $e->getMessage();
		return (
			stripos( $message, 'Duplicate entry' ) !== false ||
			stripos( $message, '1062' ) !== false
		);
	}
}
