<?php
/**
 * Class Lists
 *
 * This class is responsible for handling the contact class lists rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\Segments;

use QuillCRM\Abstracts\Filter;
use QuillCRM\Managers\Filters_Manager;
use Illuminate\Database\Eloquent\Builder;

/**
 * Lists class
 */
class Lists extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Lists';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'lists_segment';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'segments';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'select';

	/**
	 * Is dynamic
	 *
	 * @var bool
	 */
	public $is_dynamic = true;

	/**
	 * Dynamic args
	 *
	 * @var array
	 */
	public $dynamic_args = array(
		'endpoint' => '/qc/v1/lists',
		'key'      => 'id',
		'label'    => 'name',
	);

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'               => __( 'Matches', 'quill-crm' ),
			'is_not'           => __( 'Does not match', 'quill-crm' ),
			'contains'         => __( 'Has', 'quill-crm' ),
			'does_not_contain' => __( 'Does not have', 'quill-crm' ),
			'is_empty'         => __( 'Is empty', 'quill-crm' ),
			'is_not_empty'     => __( 'Is not empty', 'quill-crm' ),
		);
	}

	/**
	 * Apply filter
	 *
	 * @since 1.0.0
	 *
	 * @param Builder $query Query.
	 * @param array   $filter Rule.
	 *
	 * @return Builder
	 */
	public function apply( Builder $query, $filter = array() ) {
		$operator = isset( $filter['operator'] ) ? $filter['operator'] : 'is';
		$value    = isset( $filter['value'] ) ? $filter['value'] : array();

		if ( empty( $value ) ) {
			return $query;
		}

		if ( ! is_array( $value ) ) {
			$value = array( $value );
		}

		// Add where clause
		switch ( $operator ) {
			case 'is':
				$query->whereHas(
					'lists',
					function ( $query ) use ( $value ) {
						$query->whereIn( 'list_id', $value );
					}
				);
				break;
			case 'is_not':
				$query->whereDoesntHave(
					'lists',
					function ( $query ) use ( $value ) {
						$query->whereIn( 'list_id', $value );
					}
				);
				break;
			case 'contains':
				$query->whereHas(
					'lists',
					function ( $query ) use ( $value ) {
						$query->whereIn( 'list_id', $value );
					}
				);
				break;
			case 'does_not_contain':
				$query->whereDoesntHave(
					'lists',
					function ( $query ) use ( $value ) {
						$query->whereIn( 'list_id', $value );
					}
				);
				break;
			case 'is_empty':
				$query->whereDoesntHave( 'lists' );
				break;
			case 'is_not_empty':
				$query->whereHas( 'lists' );
				break;
		}

		return $query;
	}
}

Filters_Manager::instance()->register( new Lists() );
