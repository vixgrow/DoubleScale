<?php
/**
 * Class Last_Email_Clicked
 *
 * This class is responsible for handling the last email clicked rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\Activity;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Campaign_Message_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Last_Email_Clicked class
 */
class Last_Email_Clicked extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Last Email Clicked';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'activity_last_email_clicked';

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
		$campaign_email = Campaign_Message_Model::emails()->where( 'contact_id', $contact->id )
			->orderBy( 'clicked_at', 'desc' )
			->first();

		if ( $campaign_email ) {
			return $campaign_email->created_at;
		}

		return null;
	}

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'before'  => __( 'Before', 'quillcrm' ),
			'after'   => __( 'After', 'quillcrm' ),
			'on'      => __( 'On', 'quillcrm' ),
			'between' => __( 'Between', 'quillcrm' ),
			'within'  => __( 'Within', 'quillcrm' ),
		);
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

Rules_Manager::instance()->register( new Last_Email_Clicked() );
