<?php
/**
 * Class Status
 *
 * This class is responsible for handling the contact status rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\Contact;

use QuillCRM\Abstracts\Filter;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Filters_Manager;

/**
 * Status class
 */
class Status extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Status';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'contact_status';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'contact';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'select';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'is'     => 'Is',
			'is_not' => 'Is Not',
		);
	}

	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		return array(
			'subscribed'   => __( 'Subscribed', 'quillcrm' ),
			'unsubscribed' => __( 'Unsubscribed', 'quillcrm' ),
			'bounced'      => __( 'Bounced', 'quillcrm' ),
		);
	}
}

Filters_Manager::instance()->register( new Status() );
