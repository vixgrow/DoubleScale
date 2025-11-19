<?php

/**
 * Contact Form 7 Forms Form
 * This class is used to handle Contact Form 7 form integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\ContactForm7;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * ContactForm7 class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'contactform7';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Contact Form 7';

	/**
	 * Description
	 *
	 * @var string
	 */
	public $description = 'This will trigger when a form is submitted';
	/**
	 * Set is_enabled
	 *
	 * @since 1.0.0
	 */
	public function is_enabled() {
		return quillcrm_is_plugin_active( 'contact-form-7/wp-contact-form-7.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
