<?php

/**
 * Class Lead_Score_Points
 *
 * This class is responsible for handling the contact lead score points filter
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\Lead_Scoring;

use QuillCRM\Abstracts\Filter;
use Illuminate\Database\Eloquent\Builder;
use QuillCRM\Managers\Filters_Manager;

/**
 * Lead_Score_Points class
 */
class Lead_Score_Points extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Points';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'lead_score_points';

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
	public $type = 'number';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'           => __( 'Is', 'quill-crm' ),
			'is_not'       => __( 'Is not', 'quill-crm' ),
			'greater_than' => __( 'Greater than', 'quill-crm' ),
			'lower_than'   => __( 'Lower than', 'quill-crm' ),
		);
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

		if ( '' === $value ) {
			return $query;
		}

		// Convert to integer
		$value = intval( $value );

		global $wpdb;
		$meta_table = $wpdb->prefix . 'quillcrm_contactmeta';

		// Add where clause based on operator
		switch ( $operator ) {
			case 'is':
				$query->whereHas(
					'meta',
					function ( $q ) use ( $value ) {
						$q->where( 'meta_key', 'lead_score_points' )
							->where( 'meta_value', $value );
					}
				);
				break;

			case 'is_not':
				$query->where(
					function ( $q ) use ( $value ) {
						// Either doesn't have the meta or has different value
						$q->whereDoesntHave(
							'meta',
							function ( $subq ) use ( $value ) {
								$subq->where( 'meta_key', 'lead_score_points' );
							}
						)->orWhereHas(
							'meta',
							function ( $subq ) use ( $value ) {
								$subq->where( 'meta_key', 'lead_score_points' )
									->where( 'meta_value', '!=', $value );
							}
						);
					}
				);
				break;

			case 'greater_than':
				$query->whereHas(
					'meta',
					function ( $q ) use ( $value ) {
						$q->where( 'meta_key', 'lead_score_points' )
							->whereRaw( 'CAST(meta_value AS SIGNED) > ?', array( $value ) );
					}
				);
				break;

			case 'lower_than':
				$query->where(
					function ( $q ) use ( $value ) {
						// Either doesn't have meta (treated as 0) or has value less than target
						$q->whereDoesntHave(
							'meta',
							function ( $subq ) {
								$subq->where( 'meta_key', 'lead_score_points' );
							}
						)->orWhereHas(
							'meta',
							function ( $subq ) use ( $value ) {
								$subq->where( 'meta_key', 'lead_score_points' )
									->whereRaw( 'CAST(meta_value AS SIGNED) < ?', array( $value ) );
							}
						);
					}
				);
				break;
		}

		return $query;
	}
}

Filters_Manager::instance()->register( new Lead_Score_Points() );
