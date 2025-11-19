<?php

/**
 * Class Forminator Form
 * This class is responsible for handling the integration of forminator
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\Forminator;


use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * Forminator class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'forminator';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Forminator';

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
		return quillcrm_is_plugin_active( 'forminator/forminator.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
