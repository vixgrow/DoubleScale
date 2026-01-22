<?php

/**
 * Class WS Form
 * This class is responsible for handling the integration of WS Form
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\WSForm;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * WSForm class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'wsform';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'WS Form';

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
		return quillcrm_is_plugin_active( 'ws-form/ws-form.php' ) || quillcrm_is_plugin_active( 'ws-form-pro/ws-form.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
