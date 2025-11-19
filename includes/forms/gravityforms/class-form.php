<?php

/**
 * Class GravityForms Form
 * This class is responsible for handling the integration of gravityforms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\GravityForms;


use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * GravityForms class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'gravityforms';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'GravityForms';

	/**
	 * Description
	 *
	 * @var string
	 */
	public $description = 'This will trigger when a form is submitted';

	/**
	 * Is Enabled
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_enabled() {
		return quillcrm_is_plugin_active( 'gravityforms/gravityforms.php' );
	}
}

// Register form
Forms_Manager::instance()->register( new Form() );
