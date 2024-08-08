<?php
/**
 * Class Zip
 *
 * This class is responsible for handling the contact zip rule
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
 * Zip class
 */
class Zip extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Zip';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'contact_zip';

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

Filters_Manager::instance()->register( new Zip() );
