<?php

/**
 * Class Forms Manager
 * This class is responsible for handling the integration of forms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Abstracts\Form;

/**
 * Forms class
 */
final class Forms_Manager {

	/**
	 * Registed forms
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $forms = array();

	/**
	 * Options
	 *
	 * @var array
	 */
	protected $options = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Forms_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Forms_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * constructor
	 */
	private function __construct() {
		add_action( 'quillcrm_loaded', array( $this, 'load_forms' ) );
	}

	/**
	 * Register form
	 *
	 * @since 1.0.0
	 *
	 * @param Form $form
	 * @throws Exception If form is not an instance of Form
	 * @return void
	 */
	public function register( $form ) {
		if ( ! $form instanceof Form ) {
			throw new Exception(
				__( 'Form must be an instance of Form', 'quillcrm' )
			);
		}

		if ( isset( $this->forms[ $form->slug ] ) ) {
			throw new Exception(
				sprintf( __( 'Form with slug %s already exists', 'quillcrm' ), $form->slug )
			);
		}

		$this->forms[ $form->slug ]   = $form;
		$this->options[ $form->slug ] = array(
			'label'           => $form->name,
			'description'     => $form->description,
			'options'         => $form->get_form_options(),
			'fields_settings' => $form->get_form_fields_settings(),
			'is_enabled'      => $form->is_enabled(),
			'is_pro'          => $form->is_pro,
		);
	}

	/**
	 * Get form
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 *
	 * @return Form
	 */
	public function get_form( $slug ) {
		return isset( $this->forms[ $slug ] ) ? $this->forms[ $slug ] : null;
	}

	/**
	 * Get all forms
	 *
	 * @since 1.0.0
	 *
	 * @return Form[]
	 */
	public function get_all_forms() {
		return $this->forms;
	}

	/**
	 * Load forms
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_forms() {
		foreach ( $this->forms as $form ) {
			/** @var Form $form */
			$form->load_hooks();
		}
	}

	/**
	 * Get form options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_options() {
		 return $this->options;
	}
}
