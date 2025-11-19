<?php

/**
 * Fluent Forms Form class
 * This class is responsible for fluent forms integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\FluentForms;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;

/**
 * FluentForms class
 */
class Form extends Form_Pro {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'fluentforms';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Fluent Forms';

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
		return quillcrm_is_plugin_active( 'fluentform/fluentform.php' );
	}
}

Forms_Manager::instance()->register( new Form() );
