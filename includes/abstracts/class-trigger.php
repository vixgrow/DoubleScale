<?php
/**
 * Abstract Trigger
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use Exception;
use QuillCRM\Models\Automation_Model;
use QuillCRM\QuillCRM;

/**
 * Trigger class
 */
abstract class Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name;

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description;

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

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
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->attributes = $this->get_attributes_schema();
	}

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	abstract public function load_hooks();

	/**
	 * Process automations
	 *
	 * @since 1.0.0
	 *
	 * @param array $args Arguments
	 *
	 * @return void
	 */
	public function process( $args ) {
		try {
			$automations = Automation_Model::get_automations_by_trigger( $this->slug );
			foreach ( $automations as $automation ) {
				if ( ! $this->is_processable( $automation, $args ) ) {
					continue;
				}

				QuillCRM::instance()->automations_tasks->enqueue_async( 'process_automations', $automation, $args );
			}
		} catch ( Exception $e ) {
			// Log error
		}
	}

	/**
	 * Check if trigger should be processed
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation Automation Model
	 * @param array            $args Arguments
	 *
	 * @return bool
	 */
	public function is_processable( Automation_Model $automation, $args ) {
		return true;
	}

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
	 * Set automation attributes
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model $automation Automation Model
	 *
	 * @return void
	 */
	public function set_settings( Automation_Model $automation ) {}

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