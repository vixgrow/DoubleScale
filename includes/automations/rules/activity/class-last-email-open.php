<?php
/**
 * Class Last_Email_Open
 *
 * This class is responsible for handling the last email open rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\Activity;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Campaign_Email_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Last_Email_Open class
 */
class Last_Email_Open extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Last Email Open';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'activity_last_email_open';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'activity';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'date';

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return mixed
	 */
	public function get_value( $automation_contact ) {
		$contact        = $automation_contact->contact;
		$campaign_email = Campaign_Email_Model::where( 'contact_id', $contact->id )
			->orderBy( 'opened_at', 'desc' )
			->first();

		if ( $campaign_email ) {
			return $campaign_email->created_at;
		}

		return null;
	}

	/**
	 * Is met
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 * @param array                    $rule Rule.
	 *
	 * @return bool
	 */
	public function is_met( Automation_Contact_Model $automation_contact, $rule = array() ) {
		$value      = $this->get_value( $automation_contact );
		$operator   = $rule['operator'];
		$rule_value = $rule['value'];

		switch ( $operator ) {
			case 'before':
				return ( strtotime( $value ) < strtotime( $rule_value ) );
			case 'after':
				return ( strtotime( $value ) > strtotime( $rule_value ) );
			case 'on':
				return ( strtotime( $value ) == strtotime( $rule_value ) );
			case 'between':
				return ( strtotime( $value ) > strtotime( $rule_value[0] ) && strtotime( $value ) < strtotime( $rule_value[1] ) );
			case 'within':
				return ( strtotime( $value ) > strtotime( $rule_value[0] ) && strtotime( $value ) < strtotime( $rule_value[1] ) );
			default:
				return false;
		}
	}
}

Rules_Manager::instance()->register( new Last_Email_Open() );
