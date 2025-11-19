<?php

/**
 * Class NinjaForms Form
 * This class is responsible for handling the integration of ninjaforms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\NinjaForms;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * NinjaForms class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'ninjaforms';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'NinjaForms';

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
		return quillcrm_is_plugin_active( 'ninja-forms/ninja-forms.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
