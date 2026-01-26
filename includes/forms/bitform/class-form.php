<?php

/**
 * Class Bit Form
 * This class is responsible for handling the integration of Bit Form
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\BitForm;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * BitForm class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'bitform';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Bit Form';

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
		return quillcrm_is_plugin_active( 'bit-form/bitforms.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
