<?php

/**
 * Class QuillForms
 * This class is responsible for handling the integration of quillforms
 *
 * @since 1.0.0
 *
 * @package QuillForms
 */

namespace QuillCRM\Forms\QuillForms;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;


/**
 * QuillForms class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'quillforms';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'QuillForms';

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
		return quillcrm_is_plugin_active( 'quillforms/quillforms.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
