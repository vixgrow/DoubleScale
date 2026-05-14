<?php

/**
 * Class WasActiveInactive
 *
 * This class is responsible for handling the was active inactive filter
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\Filters\Activity;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Contacts\Abstracts\Filter;
use DoubleScale\Modules\Contacts\Filters\FiltersManager;
use DoubleScale\Modules\Contacts\Filters\Traits\TimeframeContactFilter;
use Illuminate\Database\Eloquent\Builder;

/**
 * WasActiveInactive class
 */
class WasActiveInactive extends Filter {

	use TimeframeContactFilter;

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = '';

	/**
	 * Activity type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $activity_type = '';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = '';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'activity';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'was_active_inactive';

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param string $name          Filter name.
	 * @param string $activity_type Activity type.
	 * @param string $slug          Filter slug.
	 */
	public function __construct( $name, $activity_type, $slug ) {
		$this->name          = $name;
		$this->activity_type = $activity_type;
		$this->slug          = $slug;
	}

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array();
	}

	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		return array();
	}

	/**
	 * Apply filter
	 *
	 * @since 1.0.0
	 *
	 * @param Builder $query Query.
	 * @param array   $filter Filter.
	 *
	 * @return Builder
	 */
	public function apply( Builder $query, $filter = array() ) {
		global $wpdb;

		$value = $filter['value'] ?? array();

		$timeframe_data = $value['timeframe'] ?? array( 'type' => 'at_any_time' );

		$table_activities       = $wpdb->prefix . 'doublescale_activities';
		$table_form_submissions = $wpdb->prefix . 'doublescale_form_submissions';
		$table_page_visits      = $wpdb->prefix . 'doublescale_page_visits';
		$table_contacts         = $wpdb->prefix . 'doublescale_contacts';

		$sql_timeframe = $this->build_timeframe_sql( $timeframe_data );
		$time_bindings = $this->get_timeframe_bindings( $timeframe_data );

		// Determine operator based on slug (was_active = count > 0, was_not_active = count = 0)
		if ( 'activity_was_not_active' === $this->slug ) {
			$operator       = '<=';
			$expected_count = 0;
		} else {
			$operator       = '>';
			$expected_count = 0;
		}

		// Count total activities across all three tables
		$query->whereRaw(
			"(
				(SELECT COUNT(*) FROM {$table_activities} WHERE {$table_activities}.contact_id = {$table_contacts}.id {$sql_timeframe})
				+
				(SELECT COUNT(*) FROM {$table_form_submissions} WHERE {$table_form_submissions}.contact_id = {$table_contacts}.id {$sql_timeframe})
				+
				(SELECT COUNT(*) FROM {$table_page_visits} WHERE {$table_page_visits}.contact_id = {$table_contacts}.id {$sql_timeframe})
			) {$operator} ?",
			array_merge(
				$time_bindings,
				$time_bindings,
				$time_bindings,
				array( $expected_count )
			)
		);

		return $query;
	}
}

FiltersManager::instance()->register( new WasActiveInactive( 'Was Active', 'was_active', 'activity_was_active' ) );
FiltersManager::instance()->register( new WasActiveInactive( 'Was Not Active', 'was_not_active', 'activity_was_not_active' ) );
