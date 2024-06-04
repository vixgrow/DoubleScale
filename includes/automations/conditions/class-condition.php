<?php
/**
 * Class Condition
 *
 * This class is responsible for handling the condition
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Conditions;

use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Condition class
 */
class Condition {

	/**
	 * Rules
	 *
	 * @var array
	 */
	protected $rules = array();

	/**
	 * Automation contact
	 *
	 * @var Automation_Contact_Model
	 */
	protected $automation_contact;

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Automation contact
	 * @param array                    $rules Rules
	 *
	 * @return void
	 */
	public function __construct( $automation_contact, $rules = array() ) {
		$this->rules              = $rules;
		$this->automation_contact = $automation_contact;
	}

	/**
	 * Check
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_condition_fulfilled() {
		$result = true;
		foreach ( $this->rules as $rule ) {
			$rule_manager = Rules_Manager::instance()->get_rule( $rule['rule'] );
			if ( ! $rule_manager ) {
				continue;
			}
			$rule_result = $rule_manager->is_met( $this->automation_contact, $rule );
			if ( ! $rule_result ) {
				$result = false;
				break;
			}
		}
		return $result;
	}
}
