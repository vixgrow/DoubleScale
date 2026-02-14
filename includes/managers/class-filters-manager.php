<?php

/**
 * Class Filters_Manager
 *
 * This class is responsible for handling the filters
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Abstracts\Filter;

/**
 * Filters class
 */
final class Filters_Manager {


	/**
	 * Registed filters
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $filters = array();

	/**
	 * Groups
	 *
	 * @var array
	 */
	protected $groups = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Filters_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Filters_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		 $this->set_groups();
	}

	/**
	 * Set groups
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function set_groups() {
		$this->groups = array(
			'contact'        => array(
				'name'    => __( 'Contact', 'quill-crm' ),
				'filters' => array(),
			),
			'lead_scoring'   => array(
				'name'    => __( 'Lead Scoring', 'quill-crm' ),
				'filters' => array(),
			),
			'contact_fields' => array(
				'name'    => __( 'Contact Fields', 'quill-crm' ),
				'filters' => array(),
			),
			'segments'       => array(
				'name'    => __( 'Segments', 'quill-crm' ),
				'filters' => array(),
			),
			'user'           => array(
				'name'    => __( 'User', 'quill-crm' ),
				'filters' => array(),
			),
			'activity'       => array(
				'name'    => __( 'Activity', 'quill-crm' ),
				'filters' => array(),
			),
		);
	}

	/**
	 * Register filter
	 *
	 * @since 1.0.0
	 *
	 * @param Filter $filter
	 *
	 * @throws Exception If trigger is not an instance of Trigger
	 * @return void
	 */
	public function register( Filter $filter ) {
		if ( ! $filter instanceof Filter ) {
			throw new Exception( 'Filter must be an instance of Filter' );
		}

		if ( isset( $this->filters[ $filter->slug ] ) ) {
			throw new Exception( 'Filter already exists' );
		}

		$this->filters[ $filter->slug ]                             = $filter;
		$this->groups[ $filter->group ]['filters'][ $filter->slug ] = array(
			'name'         => $filter->name,
			'type'         => $filter->type,
			'operators'    => $filter->get_operators(),
			'options'      => $filter->get_options(),
			'is_dynamic'   => $filter->is_dynamic,
			'dynamic_args' => $filter->dynamic_args,
		);
	}

	/**
	 * Get filters
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_filters() {
		 return $this->filters;
	}

	/**
	 * Get filter
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 *
	 * @return Filter
	 */
	public function get_filter( $slug ) {
		if ( isset( $this->filters[ $slug ] ) ) {
			return $this->filters[ $slug ];
		}

		return null;
	}

	/**
	 * Get groups
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_groups() {
		return $this->groups;
	}

	/**
	 * Get groups by slugs
	 *
	 * @since 1.0.0
	 *
	 * @param array $slugs
	 *
	 * @return array
	 */
	public function get_groups_by_slugs( $slugs ) {
		$groups = array();

		foreach ( $slugs as $slug ) {
			if ( isset( $this->groups[ $slug ] ) ) {
				$groups[ $slug ] = $this->groups[ $slug ];
			}
		}

		return $groups;
	}
}
