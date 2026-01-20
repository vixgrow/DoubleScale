<?php

/**
 * Class Logged_In_Out
 *
 * This class is responsible for handling the logged in out filter
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\Activity;

use QuillCRM\Abstracts\Filter;
use QuillCRM\Managers\Filters_Manager;
use QuillCRM\Contact_Filters\Traits\Timeframe_Contact_Filter;
use Illuminate\Database\Eloquent\Builder;

/**
 * Logged_In_Out class
 */
class Logged_In_Out extends Filter {

	use Timeframe_Contact_Filter;

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
	public $type = 'logged_in_out';

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

		$event_count_condition = $value['event_count_condition'] ?? array(
			'type'  => 'exactly',
			'count' => 1,
		);

		$count_type     = $event_count_condition['type'] ?? 'exactly';
		$expected_count = intval( $event_count_condition['count'] ?? 1 );

		$operator      = $this->get_comparison_operator( $count_type );
		$activity_type = $this->activity_type;

		$table_activities = $wpdb->prefix . 'quillcrm_activities';
		$table_contacts   = $wpdb->prefix . 'quillcrm_contacts';

		$sql_timeframe = $this->build_timeframe_sql( $timeframe_data );
		$time_bindings = $this->get_timeframe_bindings( $timeframe_data );

		$query->whereRaw(
			"(
			SELECT COUNT(*)
			FROM {$table_activities}
			WHERE {$table_activities}.contact_id = {$table_contacts}.id
			AND {$table_activities}.activity_type = ?
			{$sql_timeframe}
		) {$operator} ?",
			array_merge(
				array( $activity_type ),
				$time_bindings,
				array( $expected_count )
			)
		);

		return $query;
	}
}

Filters_Manager::instance()->register( new Logged_In_Out( 'Logged In', 'logged_in', 'activity_logged_in' ) );
Filters_Manager::instance()->register( new Logged_In_Out( 'Logged Out', 'logged_out', 'activity_logged_out' ) );
