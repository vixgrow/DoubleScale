<?php

/**
 * Class Formidable Form
 * This class is responsible for handling the integration of formidable forms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\Formidable;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * Formidable class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'formidable';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Formidable';

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
		return quillcrm_is_plugin_active( 'formidable/formidable.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
