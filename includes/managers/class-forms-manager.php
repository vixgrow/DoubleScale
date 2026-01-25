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
use QuillCRM\QuillCRM;

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
		/** @var Form[] $forms */
		$forms = apply_filters( 'quillcrm_forms', $this->forms );

		// Re-register forms after filter to allow Pro versions to replace free versions
		foreach ( $forms as $slug => $form ) {
			// Update the form in the internal array
			$this->forms[ $slug ] = $form;

			// Update the options array with the (potentially updated) form's data
			$this->options[ $slug ] = array(
				'label'           => $form->name,
				'description'     => $form->description,
				'options'         => $form->get_form_options(),
				'fields_settings' => $form->get_form_fields_settings(),
				'is_enabled'      => $form->is_enabled(),
				'is_pro'          => $form->is_pro,
			);

			// Load the form's hooks
			$form->load_hooks();
		}

		// Register async form processing callback
		QuillCRM::instance()->forms_tasks->register_callback(
			'process_form',
			array( $this, 'handle_async_form_processing' )
		);
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

	/**
	 * Handle async form processing
	 *
	 * Callback for the Action Scheduler task that processes form submissions
	 * in the background.
	 *
	 * @since 1.0.0
	 *
	 * @param array $args Task arguments containing meta_id
	 *
	 * @return void
	 */
	public function handle_async_form_processing( $args ) {
		$meta_id = $args['meta_id'] ?? null;

		if ( ! $meta_id ) {
			quillcrm_get_logger()->error(
				__( 'Async form processing failed: missing meta_id', 'quillcrm' ),
				array( 'code' => 'async_form_missing_meta_id' )
			);
			return;
		}

		// Retrieve data from task meta
		global $wpdb;
		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT value FROM {$wpdb->prefix}quillcrm_task_meta WHERE ID = %d",
				$meta_id
			)
		);

		if ( ! $meta ) {
			quillcrm_get_logger()->error(
				__( 'Async form processing failed: meta not found', 'quillcrm' ),
				array(
					'code'    => 'async_form_meta_not_found',
					'meta_id' => $meta_id,
				)
			);
			return;
		}

		$data      = maybe_unserialize( $meta->value );
		$form_data = $data[0] ?? array();

		if ( empty( $form_data ) ) {
			quillcrm_get_logger()->error(
				__( 'Async form processing failed: empty form data', 'quillcrm' ),
				array(
					'code'    => 'async_form_empty_data',
					'meta_id' => $meta_id,
				)
			);
			return;
		}

		$form_slug = $form_data['_form_slug'] ?? '';

		if ( empty( $form_slug ) ) {
			quillcrm_get_logger()->error(
				__( 'Async form processing failed: missing form slug', 'quillcrm' ),
				array(
					'code'    => 'async_form_missing_slug',
					'meta_id' => $meta_id,
				)
			);
			return;
		}

		$form = $this->get_form( $form_slug );

		if ( ! $form ) {
			quillcrm_get_logger()->error(
				__( 'Async form processing failed: form not found', 'quillcrm' ),
				array(
					'code'      => 'async_form_not_found',
					'form_slug' => $form_slug,
					'meta_id'   => $meta_id,
				)
			);
			return;
		}

		// Restore form settings and process synchronously
		$form->restore_form_data( $form_data['_form_settings'] ?? array() );
		$form->process_form_sync( $form_data );
	}
}
