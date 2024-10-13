<?php
/**
 * Class Utils
 * This class contains functions that are used in multiple places
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM;

use QuillCRM\Models\Custom_Fields_Group_Model;
use QuillCRM\Models\Custom_Field_Model;
use DateInterval;
use DatePeriod;
use DateTime;

/**
 * Utils class
 */
class Utils {

	/**
	 * Get max execution time
	 *
	 * @return int
	 */
	public static function get_max_execution_time() {
		$max_execution_time = 30;

		if ( function_exists( 'ini_get' ) ) {
			$max_execution_time = ini_get( 'max_execution_time' );

			if ( ! $max_execution_time ) {
				$max_execution_time = 30;
			}
		}

		$adjusted_execution_time = $max_execution_time * 0.75;

		return apply_filters( 'quillcrm_max_execution_time', $adjusted_execution_time );
	}

	/**
	 * Is memory limit reached
	 *
	 * @return bool
	 */
	public static function is_memory_limit_reached() {
		$memory_limit = self::get_memory_limit();
		$memory_usage = memory_get_usage( true );
		$memory_limit = self::convert_to_bytes( $memory_limit );
		$memory_limit = $memory_limit * 0.75;

		return $memory_usage >= $memory_limit;
	}

	/**
	 * Get memory limit
	 *
	 * @return string
	 */
	public static function get_memory_limit() {
		$memory_limit = '128M';

		if ( function_exists( 'ini_get' ) ) {
			$memory_limit = ini_get( 'memory_limit' );

			if ( ! $memory_limit ) {
				$memory_limit = '128M';
			}
		}

		return apply_filters( 'quillcrm_memory_limit', $memory_limit );
	}

	/**
	 * Convert to bytes
	 *
	 * @param string $value
	 *
	 * @return int
	 */
	public static function convert_to_bytes( $value ) {
		$value     = trim( $value );
		$last      = strtolower( $value[ strlen( $value ) - 1 ] );
		$new_value = intval( $value );

		switch ( $last ) {
			case 'g':
				$new_value *= GB_IN_BYTES;
				break;
			case 'm':
				$new_value *= MB_IN_BYTES;
				break;
			case 'k':
				$new_value *= KB_IN_BYTES;
				break;
		}

		return $new_value;
	}

	/**
	 * Generate hash key
	 *
	 * @return string
	 */
	public static function generate_hash_key() {
		return md5( uniqid( rand(), true ) );
	}

	/**
	 * Get contact fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_contact_fields() {
		$fields = array(
			0 => array(
				'label'  => __( 'Default Fields', 'quillcrm' ),
				'fields' => array(
					'first_name' => array(
						'label' => __( 'First Name', 'quillcrm' ),
						'type'  => 'text',
					),
					'last_name'  => array(
						'label' => __( 'Last Name', 'quillcrm' ),
						'type'  => 'text',
					),
					'email'      => array(
						'label' => __( 'Email', 'quillcrm' ),
						'type'  => 'email',
					),
					'phone'      => array(
						'label' => __( 'Phone', 'quillcrm' ),
						'type'  => 'phone',
					),
					'address_1'  => array(
						'label' => __( 'Address 1', 'quillcrm' ),
						'type'  => 'text',
					),
					'address_2'  => array(
						'label' => __( 'Address 2', 'quillcrm' ),
						'type'  => 'text',
					),
					'city'       => array(
						'label' => __( 'City', 'quillcrm' ),
						'type'  => 'text',
					),
					'state'      => array(
						'label' => __( 'State', 'quillcrm' ),
						'type'  => 'text',
					),
					'country'    => array(
						'label' => __( 'Country', 'quillcrm' ),
						'type'  => 'text',
					),
					'zip'        => array(
						'label' => __( 'Zip', 'quillcrm' ),
						'type'  => 'text',
					),
				),
			),
		);

		$custom_fields = self::get_custom_fields();

		$fields = array_merge( $fields, $custom_fields );

		return $fields;
	}

	/**
	 * Get custom fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public static function get_custom_fields() {
		$groups = Custom_Fields_Group_Model::with( 'custom_fields' )->get();

		$fields = array();

		foreach ( $groups as $group ) {
			if ( empty( $group->custom_fields ) ) {
				continue;
			}

			/** @var Custom_Fields_Group_Model $group */
			$fields[ $group->id ] = array(
				'label'  => $group->name,
				'fields' => array(),
			);

			foreach ( $group->custom_fields as $field ) {
				/** @var Custom_Field_Model $field */
				$fields[ $group->id ]['fields'][ $field->id ] = array(
					'label' => $field->name,
					'type'  => $field->type,
				);
			}
		}

		return $fields;
	}

	/**
	 * Get days/months between two dates
	 *
	 * @since 1.0.0
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 *
	 * @return array
	 */
	public static function get_dates_between_dates( $start_date, $end_date ) {
		// First check if days > 30 return months.
		$days  = self::get_days_count_between_dates( $start_date, $end_date );
		$dates = array(
			'dates' => array(),
			'type'  => 'day',
		);

		if ( $days > 30 ) {
			$dates = array(
				'dates' => self::get_months_between_dates( $start_date, $end_date ),
				'type'  => 'month',
			);
		} elseif ( $days === 0 ) {
			$dates = array(
				'dates' => self::get_day_hours_between_dates( $start_date ),
				'type'  => 'hour',
			);
		} else {
			$dates = array(
				'dates' => self::get_days_between_dates( $start_date, $end_date ),
				'type'  => 'day',
			);
		}

		return $dates;
	}

	/**
	 * Get days between two dates
	 *
	 * @since 1.0.0
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 *
	 * @return int
	 */
	public static function get_days_count_between_dates( $start_date, $end_date ) {
		$datetime1 = new DateTime( $start_date );
		$datetime2 = new DateTime( $end_date );
		$interval  = $datetime1->diff( $datetime2 );

		return $interval->days;
	}

	/**
	 * Get days between two dates
	 *
	 * @since 1.0.0
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 *
	 * @return array
	 */
	public static function get_days_between_dates( $start_date, $end_date ) {
		$dates = array();

		$start_date = new DateTime( $start_date );
		$end_date   = new DateTime( $end_date );

		$end_date->modify( '+1 day' );

		$interval  = new DateInterval( 'P1D' );
		$daterange = new DatePeriod( $start_date, $interval, $end_date );

		foreach ( $daterange as $date ) {
			$dates[] = $date->format( 'Y-m-d' );
		}

		return $dates;
	}

	/**
	 * Get months between two dates
	 *
	 * @since 1.0.0
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date End date.
	 *
	 * @return array
	 */
	public static function get_months_between_dates( $start_date, $end_date ) {
		$dates = array();

		$start_date = new DateTime( $start_date );
		$end_date   = new DateTime( $end_date );

		$end_date->modify( '+1 month' );

		$interval  = new DateInterval( 'P1M' );
		$daterange = new DatePeriod( $start_date, $interval, $end_date );

		foreach ( $daterange as $date ) {
			$dates[] = $date->format( 'Y-m-d' );
		}

		return $dates;
	}

	/**
	 * Get day hours between two dates
	 *
	 * @since 1.0.0
	 *
	 * @param string $date date.
	 *
	 * @return array
	 */
	public static function get_day_hours_between_dates( $date ) {
		$dates = array();

		// Get day hours.
		for ( $i = 0; $i < 24; $i++ ) {
			$dates[] = $date . ' ' . $i . ':00:00';
		}

		return $dates;
	}

	/**
	 * Get start date
	 *
	 * @since 1.0.0
	 *
	 * @param string $interval Interval.
	 * @param string $start_date Start date.
	 *
	 * @return string
	 */
	public static function get_start_date( $interval, $start_date ) {
		$start_date = '';
		switch ( $interval ) {
			case 'today':
				$start_date = date( 'Y-m-d' );
				break;
			case 'yesterday':
				$start_date = date( 'Y-m-d', strtotime( '-1 day' ) );
				break;
			case 'last_7_days':
				$start_date = date( 'Y-m-d', strtotime( '-7 days' ) );
				break;
			case 'last_30_days':
				$start_date = date( 'Y-m-d', strtotime( '-30 days' ) );
				break;
			case 'this_month':
				$start_date = date( 'Y-m-01' );
				break;
			case 'last_month':
				$start_date = date( 'Y-m-01', strtotime( 'first day of last month' ) );
				break;
			case 'this_year':
				$start_date = date( 'Y-01-01' );
				break;
			case 'last_year':
				$start_date = date( 'Y-01-01', strtotime( 'first day of last year' ) );
				break;
		}

		return $start_date;
	}

	/**
	 * Get end date
	 *
	 * @since 1.0.0
	 *
	 * @param string $interval Interval.
	 * @param string $end_date End date.
	 *
	 * @return string
	 */
	public static function get_end_date( $interval, $end_date ) {
		$end_date = '';
		switch ( $interval ) {
			case 'today':
				$end_date = date( 'Y-m-d' );
				break;
			case 'yesterday':
				$end_date = date( 'Y-m-d', strtotime( '-1 day' ) );
				break;
			case 'last_7_days':
				$end_date = date( 'Y-m-d' );
				break;
			case 'last_30_days':
				$end_date = date( 'Y-m-d' );
				break;
			case 'this_month':
				$end_date = date( 'Y-m-t' );
				break;
			case 'last_month':
				$end_date = date( 'Y-m-t', strtotime( 'last day of last month' ) );
				break;
			case 'this_year':
				$end_date = date( 'Y-12-31' );
				break;
			case 'last_year':
				$end_date = date( 'Y-12-31', strtotime( 'last day of last year' ) );
				break;
		}

		return $end_date;
	}
}
