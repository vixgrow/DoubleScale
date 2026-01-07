<?php

/**
 * Class Lead_Score_Level
 *
 * This class is responsible for handling the contact lead score level filter
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\Lead_Scoring;

use QuillCRM\Abstracts\Filter;
use Illuminate\Database\Eloquent\Builder;
use QuillCRM\Managers\Filters_Manager;
use QuillCRM\Models\Lead_Scoring_Rule_Level_Model;

/**
 * Lead_Score_Level class
 */
class Lead_Score_Level extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Level';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'lead_score_level';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'lead_scoring';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'select';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'     => __( 'Is', 'quillcrm' ),
			'is_not' => __( 'Is not', 'quillcrm' ),
		);
	}

	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		 $options = array();
		$levels   = Lead_Scoring_Rule_Level_Model::get_ordered_by_points();

		foreach ( $levels as $level ) {
			$options[ $level->slug ] = $level->name . ' (' . $level->points . ' points)';
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
		$operator = isset( $filter['operator'] ) ? $filter['operator'] : 'is';
		$value    = isset( $filter['value'] ) ? $filter['value'] : '';

		// Handle empty operators
		if ( 'is_empty' === $operator ) {
			return $query->whereDoesntHave(
				'meta',
				function ( $q ) {
					$q->where( 'meta_key', 'lead_score_level_id' );
				}
			);
		}

		if ( 'is_not_empty' === $operator ) {
			return $query->whereHas(
				'meta',
				function ( $q ) {
					$q->where( 'meta_key', 'lead_score_level_id' )
						->where( 'meta_value', '!=', '' );
				}
			);
		}

		// Other operators require a value
		if ( empty( $value ) ) {
			return $query;
		}

		// Ensure value is an array
		if ( ! is_array( $value ) ) {
			$value = array( $value );
		}

		// Add where clause based on operator
		switch ( $operator ) {
			case 'is':
				$query->whereHas(
					'meta',
					function ( $q ) use ( $value ) {
						$q->where( 'meta_key', 'lead_score_level_id' )
							->whereIn( 'meta_value', $value );
					}
				);
				break;

			case 'is_not':
				$query->where(
					function ( $q ) use ( $value ) {
						// Either doesn't have the meta or has different value
						$q->whereDoesntHave(
							'meta',
							function ( $subq ) {
								$subq->where( 'meta_key', 'lead_score_level_id' );
							}
						)->orWhereHas(
							'meta',
							function ( $subq ) use ( $value ) {
								$subq->where( 'meta_key', 'lead_score_level_id' )
									->whereNotIn( 'meta_value', $value );
							}
						);
					}
				);
				break;
		}

		return $query;
	}
}

Filters_Manager::instance()->register( new Lead_Score_Level() );
