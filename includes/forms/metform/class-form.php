<?php

/**
 * MetForm Form Class
 * This class is responsible for handling the integration of MetForm forms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\MetForm;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * MetForm class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'metform';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'MetForm';

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
		return quillcrm_is_plugin_active( 'metform/metform.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
