<?php

/**
 * Class Sure Forms
 * This class is responsible for handling the integration of SureForms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\SureForms;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * SureForms class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'sureforms';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'SureForms';

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
		return quillcrm_is_plugin_active( 'sureforms/sureforms.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
