<?php
/**
 * Class Address_1
 *
 * This class is responsible for handling the contact address 1 rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\Contact;

use QuillCRM\Abstracts\Filter;
use QuillCRM\Managers\Filters_Manager;

/**
 * Address_1 class
 */
class Address_1 extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Address 1';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'contact_address_1';

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

Filters_Manager::instance()->register( new Address_1() );
