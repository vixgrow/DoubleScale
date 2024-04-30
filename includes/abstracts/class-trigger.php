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
use QuillCRM\Automations\Process_Automation;

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
				QuillCRM::instance()->automations_tasks->enqueue_async( 'process_automations', $automation, $args );
			}
		} catch ( Exception $e ) {
			// Log error
		}
	}
}
