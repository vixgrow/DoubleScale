<?php
/**
 * Process Filters
 *
 * This class is responsible for handling the process filters
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters;

use Illuminate\Database\Eloquent\Builder;
use QuillCRM\Managers\Filters_Manager;

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
	 * @param Builder $query Query
	 * @param array   $filters Filters
	 *
	 * @return void
	 */
	public function __construct( $query, $filters = array() ) {
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
		foreach ( $this->filters ?? array() as $filter ) {
			$this->query = $this->add_filter( $filter );
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
	 * @return Builder
	 */
	public function add_filter( $filter ) {
		// Check if filter key exists
		if ( ! isset( $filter['filter'] ) ) {
			return $this->query;
		}

		$filter_class = Filters_Manager::instance()->get_filter( $filter['filter'] );

		if ( ! $filter_class ) {
			return $this->query;
		}

		$query = $filter_class->apply( $this->query, $filter );

		return $query;
	}
}
