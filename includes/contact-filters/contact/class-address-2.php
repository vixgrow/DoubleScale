<?php
/**
 * Class Address_2
 *
 * This class is responsible for handling the contact address 2 rule
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
 * Address_2 class
 */
class Address_2 extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Address 2';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'contact_address_2';

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
	public $type = 'text';
}

Filters_Manager::instance()->register( new Address_2() );
