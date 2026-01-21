<?php

/**
 * Class Page_Visited
 *
 * This class is responsible for handling the page visited filter
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
 * Page_Visited class
 */
class Page_Visited extends Filter {

	use Timeframe_Contact_Filter;

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Page Visited';

	/**
	 * Activity type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $activity_type = 'page_visited';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'activity_page_visited';

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
	public $type = 'page_visited';

	/**
	 * Is automation
	 *
	 * @since 1.0.0
	 */
	public $is_automation = false;

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
		$pages   = get_pages();
		$options = array();
		foreach ( $pages as $page ) {
			$options[ $page->guid ] = empty( $page->post_title ) ? '(Page)' : $page->post_title;
		}
		return $options;
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

		$page_guid      = $value['guid'] ?? '';
		$timeframe_data = $value['timeframe'] ?? array( 'type' => 'at_any_time' );

		$event_count_condition = $value['event_count_condition'] ?? array(
			'type'  => 'exactly',
			'count' => 1,
		);

		$count_type     = $event_count_condition['type'] ?? 'exactly';
		$expected_count = intval( $event_count_condition['count'] ?? 1 );

		$operator = $this->get_comparison_operator( $count_type );

		$table_activities = $wpdb->prefix . 'quillcrm_page_visits';
		$table_contacts   = $wpdb->prefix . 'quillcrm_contacts';

		$sql_timeframe = $this->build_timeframe_sql( $timeframe_data );
		$time_bindings = $this->get_timeframe_bindings( $timeframe_data );
		$sql_page_guid = $this->build_page_guid_sql( $page_guid );
		$page_bindings = $this->get_page_guid_bindings( $page_guid );

		$query->whereRaw(
			"(
			SELECT COUNT(*)
			FROM {$table_activities}
			WHERE {$table_activities}.contact_id = {$table_contacts}.id
			{$sql_page_guid}
			{$sql_timeframe}
		) {$operator} ?",
			array_merge(
				$page_bindings,
				$time_bindings,
				array( $expected_count )
			)
		);

		return $query;
	}

	/**
	 * Build page guid SQL condition
	 *
	 * @since 1.0.0
	 *
	 * @param string $page_guid Page GUID.
	 *
	 * @return string
	 */
	protected function build_page_guid_sql( $page_guid ) {
		if ( empty( $page_guid ) ) {
			return '';
		}

		$query_string = wp_parse_url( $page_guid, PHP_URL_QUERY );

		if ( ! empty( $query_string ) ) {
			return ' AND path = ? AND query = ?';
		}

		return ' AND path = ?';
	}

	/**
	 * Get page guid bindings
	 *
	 * @since 1.0.0
	 *
	 * @param string $page_guid Page GUID.
	 *
	 * @return array
	 */
	protected function get_page_guid_bindings( $page_guid ) {
		if ( empty( $page_guid ) ) {
			return array();
		}

		$path         = wp_parse_url( $page_guid, PHP_URL_PATH );
		$query_string = wp_parse_url( $page_guid, PHP_URL_QUERY );

		if ( ! empty( $query_string ) ) {
			return array( $path, $query_string );
		}

		return array( $path );
	}
}

Filters_Manager::instance()->register( new Page_Visited() );
