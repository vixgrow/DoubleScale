<?php

/**
 * Abstract Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Managers\Actions_Manager;

/**
 * Action class
 */
abstract class Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description;

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Auto enqueue step
	 *
	 * @var bool
	 */
	public $auto_enqueue = true;

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source;

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group;


	/**
	 * Is PRO only
	 *
	 * @var bool
	 */
	public $is_pro = false;

	/**
	 * Merge Tags Manager
	 *
	 * @var Merge_Tags_Manager
	 */
	public $merge_tags_manager;

	/**
	 * Is integration
	 *
	 * @var bool
	 */
	public $is_integration = false;

	/**
	 * Instances
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	private static $instances = array();

	/**
	 * Required Triggers
	 *
	 * @var array
	 */
	public $required_triggers = array();

	/**
	 * Get Instance
	 *
	 * @since 1.0.0
	 *
	 * @return Action
	 */
	public static function instance() {
		 $class = get_called_class();
		if ( ! isset( self::$instances[ $class ] ) ) {
			self::$instances[ $class ] = new static();
		}
		return self::$instances[ $class ];
	}


	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->attributes         = $this->get_attributes_schema();
		$this->merge_tags_manager = Merge_Tags_Manager::instance();
		add_action( 'init', array( $this, 'register' ) );
	}

	/**
	 * Register
	 *
	 * @since 1.0.0
	 */
	public function register() {
		Actions_Manager::instance()->register( $this );
	}

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 *
	 * @return bool
	 */
	abstract public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact);

	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array();
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}
}
