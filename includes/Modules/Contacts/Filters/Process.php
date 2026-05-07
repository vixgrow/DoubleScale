<?php
/**
 * Process Filters
 *
 * This class is responsible for handling the process filters
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\Filters;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Illuminate\Database\Eloquent\Builder;
use DoubleScale\Modules\Contacts\Filters\FiltersManager;

/**
 * Process Filters class
 */
class Process {

	/**
	 * Filters
	 *
	 * @var array
	 */
	protected $filters = array();

	/**
	 * Query
	 *
	 * @var Builder
	 */
	protected $query;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param Builder $query Query builder instance
	 * @param array   $filters Filters array
	 *
	 * @return void
	 */
	public function __construct( Builder $query, array $filters = array() ) {
		$this->filters = $filters;
		$this->query   = $query;
	}

	/**
	 * Check
	 *
	 * @since 1.0.0
	 *
	 * @return object
	 */
	public function filter() {
		if ( empty( $this->filters ) ) {
			return $this->query;
		}

		// Always treat filters as nested array:
		// Outer array = OR groups, inner arrays = AND conditions.
		return $this->filter_nested();
	}

	/**
	 * Filter nested array structure
	 * Outer array = OR groups, inner arrays = AND conditions
	 *
	 * @since 1.0.0
	 *
	 * @return Builder
	 */
	protected function filter_nested() {
		// Special handling for ListTagFilter format: [includeRows[], excludeRows[]]
		// First array is include (contains), second is exclude (does_not_contain)
		$is_list_tag_format = count( $this->filters ) === 2
			&& ! empty( $this->filters[0] )
			&& is_array( $this->filters[0] )
			&& ! empty( $this->filters[0][0] )
			&& isset( $this->filters[0][0]['list'] ) || isset( $this->filters[0][0]['tag'] );

		if ( $is_list_tag_format ) {
			return $this->filter_list_tag_format();
		}

		// Standard nested format: OR groups with AND conditions
		$or_groups = array();

		// Process each OR group (each inner array is an AND group)
		foreach ( $this->filters as $and_group ) {
			if ( ! is_array( $and_group ) || empty( $and_group ) ) {
				continue;
			}

			// Collect filters for this AND group, converting formats as needed
			$group_filters = array();
			foreach ( $and_group as $filter ) {
				if ( ! is_array( $filter ) || empty( $filter ) ) {
					continue;
				}

				// Already in Filter or RuleItem format, keep as-is
				$group_filters[] = $filter;
			}

			if ( ! empty( $group_filters ) ) {
				$or_groups[] = $group_filters;
			}
		}

		// If we have OR groups, combine them with OR logic
		if ( ! empty( $or_groups ) ) {
			$this->query->where(
				function ( $query ) use ( $or_groups ) {
					$first_group = true;
					foreach ( $or_groups as $group_filters ) {
						if ( $first_group ) {
							// First group: use where() to start the OR chain
							$query->where(
								function ( $and_query ) use ( $group_filters ) {
									// Apply all filters in this group (AND logic)
									foreach ( $group_filters as $filter ) {
										  $and_query = $this->add_filter_to_query( $and_query, $filter );
									}
								}
							);
							$first_group = false;
						} else {
							// Subsequent groups: use orWhere() to add OR conditions
							$query->orWhere(
								function ( $and_query ) use ( $group_filters ) {
									// Apply all filters in this group (AND logic)
									foreach ( $group_filters as $filter ) {
										$and_query = $this->add_filter_to_query( $and_query, $filter );
									}
								}
							);
						}
					}
				}
			);
		}

		return $this->query;
	}

	/**
	 * Filter ListTagFilter format: [includeRows[], excludeRows[]]
	 * Include rows use 'contains', exclude rows use 'does_not_contain'
	 *
	 * @since 1.0.0
	 *
	 * @return Builder
	 */
	protected function filter_list_tag_format() {
		$include_rows = isset( $this->filters[0] ) ? $this->filters[0] : array();
		$exclude_rows = isset( $this->filters[1] ) ? $this->filters[1] : array();

		// Process include rows (OR groups with AND conditions)
		if ( ! empty( $include_rows ) ) {
			// If any row uses "all" for lists or tags, treat it as
			// "no restriction" for that dimension and ignore more specific rows.
			$has_all_row = false;
			foreach ( $include_rows as $row ) {
				if ( ! is_array( $row ) ) {
					continue;
				}

				$list_is_all = isset( $row['list'] ) && 'all' === $row['list'];
				$tag_is_all  = isset( $row['tag'] ) && 'all' === $row['tag'];

				// If both list and tag are "all", we don't need any include filter at all.
				if ( $list_is_all && $tag_is_all ) {
					$has_all_row = true;
					break;
				}
			}

			// If we have a full "all/all" row, skip building include filters entirely
			// so the query returns all contacts (no include restriction).
			if ( $has_all_row ) {
				// Still apply any exclude_rows below, but no include constraints.
			} else {
				$this->query->where(
					function ( $query ) use ( $include_rows ) {
						$first_group = true;
						foreach ( $include_rows as $row ) {
							if ( ! is_array( $row ) ) {
								continue;
							}

							// Convert row to Filter format and apply
							$row_filters = array();
							if ( isset( $row['list'] ) && $row['list'] !== 'all' && is_numeric( $row['list'] ) ) {
								$row_filters[] = array(
									'group'    => 'segments',
									'filter'   => 'lists_segment',
									'operator' => 'contains',
									'value'    => array( intval( $row['list'] ) ),
								);
							}
							if ( isset( $row['tag'] ) && $row['tag'] !== 'all' && is_numeric( $row['tag'] ) ) {
								$row_filters[] = array(
									'group'    => 'segments',
									'filter'   => 'tags_segment',
									'operator' => 'contains',
									'value'    => array( intval( $row['tag'] ) ),
								);
							}

							if ( ! empty( $row_filters ) ) {
								if ( $first_group ) {
									$query->where(
										function ( $and_query ) use ( $row_filters ) {
											foreach ( $row_filters as $filter ) {
												$and_query = $this->add_filter_to_query( $and_query, $filter );
											}
										}
									);
									$first_group = false;
								} else {
									$query->orWhere(
										function ( $and_query ) use ( $row_filters ) {
											foreach ( $row_filters as $filter ) {
												$and_query = $this->add_filter_to_query( $and_query, $filter );
											}
										}
									);
								}
							}
						}
					}
				);
			}
		}

		// Process exclude rows (subtract from include results)
		// Exclude: contacts that match ANY exclude row should be excluded
		// For each exclude row, apply does_not_contain filters
		// Note: This applies exclusion at the condition level, which may need refinement
		// for complex exclude logic, but works for the common case
		if ( ! empty( $exclude_rows ) ) {
			foreach ( $exclude_rows as $row ) {
				if ( ! is_array( $row ) ) {
					continue;
				}

				// Convert row to Filter format with does_not_contain operator
				if ( isset( $row['list'] ) && $row['list'] !== 'all' && is_numeric( $row['list'] ) ) {
					$exclude_filter = array(
						'group'    => 'segments',
						'filter'   => 'lists_segment',
						'operator' => 'does_not_contain',
						'value'    => array( intval( $row['list'] ) ),
					);
					$this->query    = $this->add_filter_to_query( $this->query, $exclude_filter );
				}
				if ( isset( $row['tag'] ) && $row['tag'] !== 'all' && is_numeric( $row['tag'] ) ) {
					$exclude_filter = array(
						'group'    => 'segments',
						'filter'   => 'tags_segment',
						'operator' => 'does_not_contain',
						'value'    => array( intval( $row['tag'] ) ),
					);
					$this->query    = $this->add_filter_to_query( $this->query, $exclude_filter );
				}
			}
		}

		return $this->query;
	}

	/**
	 * Add filter
	 *
	 * @since 1.0.0
	 *
	 * @param array $filter Filter
	 *
	 * @return Builder Query builder (never null)
	 */
	public function add_filter( $filter ) {
		$this->query = $this->add_filter_to_query( $this->query, $filter );
		return $this->query;
	}

	/**
	 * Add filter to a specific query instance
	 * Helper method for nested filter processing
	 *
	 * @since 1.0.0
	 *
	 * @param Builder $query Query builder instance
	 * @param array   $filter Filter (can be Filter format, RuleItem format, or ListTagFilter format)
	 *
	 * @return Builder Query builder (never null)
	 */
	protected function add_filter_to_query( Builder $query, $filter ) {
		// Validate filter structure
		if ( ! is_array( $filter ) ) {
			doublescale_get_logger()->info(
				'Invalid filter structure - not an array',
				array(
					'filter'  => $filter,
					'context' => 'contact_filters_process',
				)
			);
			return $query;
		}

		// Handle ListTagFilter format: {id, list, tag} -> convert to Filter format
		// ListTagFilter sends plain objects with list/tag IDs
		if ( isset( $filter['list'] ) || isset( $filter['tag'] ) ) {
			// This is a ListTagFilter row object, skip it here
			// ListTagFilter format is handled separately in filter_nested()
			// by converting rows to Filter format before calling this method
			return $query;
		}

		// Handle RuleItem format (from RulesBuilder): convert to Filter format
		// RuleItem has: rule, operator, value, selectedGroup
		// Filter needs: filter, group, operator, value
		if ( isset( $filter['rule'] ) && isset( $filter['selectedGroup'] ) ) {
			$filter = array(
				'filter'   => $filter['rule'],
				'group'    => $filter['selectedGroup'],
				'operator' => isset( $filter['operator'] ) ? $filter['operator'] : 'is',
				'value'    => isset( $filter['value'] ) ? $filter['value'] : '',
			);
		}

		// Validate filter structure (Filter format)
		if ( ! isset( $filter['filter'] ) ) {
			doublescale_get_logger()->info(
				'Invalid filter structure - missing filter key',
				array(
					'filter'  => $filter,
					'context' => 'contact_filters_process',
				)
			);
			return $query;
		}

		$filter_class = FiltersManager::instance()->get_filter( $filter['filter'] );

		if ( ! $filter_class ) {
			doublescale_get_logger()->info(
				'Filter class not found',
				array(
					'filter_type' => $filter['filter'],
					'context'     => 'contact_filters_process',
				)
			);
			return $query;
		}

		$result_query = $filter_class->apply( $query, $filter );

		// Safety check: ensure apply() returned a valid query
		if ( ! $result_query instanceof Builder ) {
			doublescale_get_logger()->error(
				'Filter apply() did not return a valid query builder',
				array(
					'filter_type' => $filter['filter'],
					'context'     => 'contact_filters_process',
				)
			);
			return $query;
		}

		return $result_query;
	}
}
