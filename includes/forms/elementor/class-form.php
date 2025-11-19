<?php

/**
 * Class ElementorForms Form
 * This class is responsible for handling the integration of elementor forms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\Elementor;

use QuillCRM\Abstracts\Form_Pro;
use QuillCRM\Managers\Forms_Manager;


/**
 * ElementorForms class
 */
class Form extends Form_Pro {


	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'elementor';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Elementor';

	/**
	 * Post ID
	 *
	 * @var int
	 */
	public $post_id;

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
		return quillcrm_is_plugin_active( 'elementor-pro/elementor-pro.php' );
	}
}


Forms_Manager::instance()->register( new Form() );
