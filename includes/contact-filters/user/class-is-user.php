<?php
/**
 * Class Username
 *
 * This class is responsible for handling the user username rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\User;

use QuillCRM\Abstracts\Filter;
use Illuminate\Database\Eloquent\Builder;
use QuillCRM\Managers\Filters_Manager;

/**
 * Username class
 */
class Is_User extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Is User';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'is_user';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'user';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'boolean';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'     => __( 'Yes', 'quillcrm' ),
			'is_not' => __( 'No', 'quillcrm' ),
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

		switch ( $operator ) {
			case 'is':
				$query->has( 'user' );
				break;
			case 'is_not':
				$query->doesntHave( 'user' );
				break;
		}

		return $query;
	}
}

Filters_Manager::instance()->register( new Is_User() );
