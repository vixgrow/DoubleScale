<?php
/**
 * Class Goals Manager
 * This class is responsible for handling the goals
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Abstracts\Goal;

/**
 * Goals class
 */
final class Goals_Manager {

	/**
	 * Registed goals
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $goals = array();

	/**
	 * Sources
	 *
	 * @var array
	 */
	protected $sources = array();


	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Goals_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Goals_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * constructor
	 */
	private function __construct() {
		$this->set_sources();
		add_action( 'quillcrm_loaded', array( $this, 'load_goals' ) );
	}

	/**
	 * Load goals
	 */
	public function load_goals() {
		/** @var Goal[] $goals */
		$goals = apply_filters( 'quillcrm_goals', $this->goals );

		foreach ( $goals as $trigger ) {
			$trigger->load_hooks();
		}
	}

	/**
	 * Register Goal
	 *
	 * @since 1.0.0
	 *
	 * @param Goal $goal
	 * @return void
	 */
	public function register( Goal $goal ) {
		if ( ! $goal instanceof Goal ) {
			throw new Exception( __( 'Invalid goal', 'quillcrm' ) );
		}

		if ( isset( $this->goals[ $goal->slug ] ) ) {
			throw new Exception( sprintf( __( 'Goal %s already registered', 'quillcrm' ), $goal->name ) );
		}

		$this->goals[ $goal->slug ] = $goal;
		$this->sources[ $goal->source ]['groups'][ $goal->group ]['goals'][ $goal->slug ] = array(
			'label'       => $goal->name,
			'description' => $goal->description,
			'fields'      => $goal->get_fields(),
		);
	}

	/**
	 * Get Goal
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 * @return Goal
	 */
	public function get_goal( $slug ) {
		if ( isset( $this->goals[ $slug ] ) ) {
			return $this->goals[ $slug ];
		}

		throw new Exception( sprintf( __( 'Goal %s not found', 'quillcrm' ), $slug ) );
	}

	/**
	 * Get Goals
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_goals() {
		return $this->goals;
	}

	/**
	 * Get sources
	 *
	 * @return array
	 */
	public function set_sources() {
		$this->sources = array(
			'automation' => array(
				'label'  => __( 'Automation', 'quillcrm' ),
				'groups' => array(
					'contact' => array(
						'label' => __( 'Contact', 'quillcrm' ),
						'goals' => array(),
					),
				),
			),
		);

		$this->sources = apply_filters( 'quillcrm_goals_sources', $this->sources );
	}

	/**
	 * Get sources
	 *
	 * @return array
	 */
	public function get_sources() {
		return $this->sources;
	}
}
