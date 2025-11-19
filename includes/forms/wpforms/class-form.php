<?php

/**
 * Class WPForms Form
 * This class is responsible for handling the integration of wpforms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\WPForms;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * WPForms class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'wpforms';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'WPForms';

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
		return quillcrm_is_plugin_active( 'wpforms/wpforms.php' );
	}
}


Forms_Manager::instance()->register( new Form() );
