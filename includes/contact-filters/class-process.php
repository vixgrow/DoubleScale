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
	 * @return Builder Query builder (never null)
	 */
	public function add_filter( $filter ) {
		// Validate filter structure
		if ( ! isset( $filter['filter'] ) ) {
			quillcrm_get_logger()->warning(
				'Invalid filter structure - missing filter key',
				array(
					'filter'  => $filter,
					'context' => 'contact_filters_process',
				)
			);
			return $this->query;
		}

		$filter_class = Filters_Manager::instance()->get_filter( $filter['filter'] );

		if ( ! $filter_class ) {
			quillcrm_get_logger()->warning(
				'Filter class not found',
				array(
					'filter_type' => $filter['filter'],
					'context'     => 'contact_filters_process',
				)
			);
			return $this->query;
		}

		$query = $filter_class->apply( $this->query, $filter );

		// Safety check: ensure apply() returned a valid query
		if ( ! $query instanceof Builder ) {
			quillcrm_get_logger()->error(
				'Filter apply() did not return a valid query builder',
				array(
					'filter_type' => $filter['filter'],
					'context'     => 'contact_filters_process',
				)
			);
			return $this->query;
		}

		return $query;
	}
}
