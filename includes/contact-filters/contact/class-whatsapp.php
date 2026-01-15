<?php

/**
 * Class Whatsapp
 *
 * This class is responsible for handling the contact whatsapp rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\Contact;

use QuillCRM\Abstracts\Filter;
use QuillCRM\Managers\Filters_Manager;

/**
 * WhatsApp class
 */
class Whatsapp extends Filter {



	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'WhatsApp';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'contact_whatsapp_phone';

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

Filters_Manager::instance()->register( new Whatsapp() );
