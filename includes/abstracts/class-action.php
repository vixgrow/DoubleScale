<?php
/**
 * Abstract Action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Abstracts;

use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Contact_Model;

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
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model      $automation Automation Model.
	 * @param Automation_Step_Model $step Automation Step Model.
	 * @param Contact_Model         $contact Contact Model.
	 *
	 * @return bool
	 */
	abstract public function process_action( Automation_Model $automation, Automation_Step_Model $step, Contact_Model $contact );
}
