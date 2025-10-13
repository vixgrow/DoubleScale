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

use QuillCRM\Abstracts\Form as Abstracts_Form;
use QuillCRM\Managers\Forms_Manager;
use QuillCRM\Merge_Tags\Forms\Dynamic_Fields_Registration;

/**
 * NinjaForms class
 */
class Form extends Abstracts_Form {




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
	 * Load Hooks
	 */
	public function load_hooks() {
		add_action( 'ninja_forms_after_submission', array( $this, 'process' ), 10, 1 );
		// Ajax Get Fields
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_fields", array( $this, 'ajax_get_fields' ) );
		// Ajax Get Form Select Options
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_form_select_options", array( $this, 'ajax_get_form_select_options' ) );
	}



	/**
	 * Register merge tags
	 */
	public function register_merge_tags_for_form( $form_id ) {
		if ( ! $this->is_enabled() ) {
			return;
		}

		// Get fields only from forms that are selected in active automations
		$selected_forms_fields = $this->get_fields( $form_id );
		if ( ! empty( $selected_forms_fields ) ) {
			new Dynamic_Fields_Registration( $selected_forms_fields, $this->slug );
		}
	}

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

	/**
	 * Get Fields
	 *
	 * @since 1.0.0
	 *
	 * @param string $form_id
	 *
	 * @return array
	 */
	public function get_fields( $form_id ) {
		$form_fields = Ninja_Forms()->form( $form_id )->get_fields();
		$fields      = array();

		if ( empty( $form_fields ) ) {
			return $fields;
		}

		$fields = $this->prepare_form_fields( $form_fields );

		return $fields;
	}

	/**
	 * Ajax Get Fields
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function ajax_get_fields() {
		 // Check nonce.
		check_ajax_referer( 'quillcrm-admin', 'nonce' );

		$form_id = isset( $_POST['form_id'] ) ? sanitize_text_field( $_POST['form_id'] ) : '';

		if ( empty( $form_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid form ID', 'quillcrm' ) ) );
		}

		$fields = $this->get_fields( $form_id );

		wp_send_json_success( $fields );
	}

	/**
	 * Ajax Get Form Select Options
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function ajax_get_form_select_options() {
		// Check nonce.
		check_ajax_referer( 'quillcrm-admin', 'nonce' );

		$forms   = Ninja_Forms()->form()->get_forms();
		$options = array();

		if ( empty( $forms ) ) {
			wp_send_json_error( array( 'message' => 'No forms found' ) );
		}

		foreach ( $forms as $form ) {
			$options[ $form->get_id() ] = $form->get_setting( 'title' );
		}

		wp_send_json_success( $options );
	}

	/**
	 * Process
	 *
	 * @since 1.0.0
	 *
	 * @param array $form_data
	 *
	 * @return void
	 */
	public function process( $form_data ) {
		$fields_by_key      = $form_data['fields_by_key'] ?? array();
		$data               = $this->get_default_data();
		$data['form_id']    = $form_data['form_id'];
		$data['form_title'] = $form_data['settings']['title'];
		$data['fields']     = $this->prepare_form_fields( $form_data['fields'] );
		$entry              = array();

		foreach ( $fields_by_key as $field_key => $field ) {
			$entry['fields'][ $field_key ] = $field['value'] ?? '';
		}

		$data['entry'] = $entry;

		if ( ! $this->is_form_active( $form_data['form_id'] ) ) {
			$this->process_form( $data );
		}

		$this->process_automations( $data );
	}

	/**
	 * Prepare Form Fields
	 *
	 * @since 1.0.0
	 *
	 * @param array $fields
	 *
	 * @return array
	 */
	public function prepare_form_fields( $fields ) {
		$prepared_fields = array();

		foreach ( $fields as $field ) {
			if ( is_object( $field ) ) {
				$field = array(
					'id'       => $field->get_id(),
					'settings' => $field->get_settings(),
				);
			}

			if ( $field['settings']['type'] === 'submit' || false !== strpos( $field['settings']['type'], 'file' ) ) {
				continue;
			}

			$prepared_fields[ $field['settings']['key'] ] = $field['settings']['label'];
		}

		return $prepared_fields;
	}
}

Forms_Manager::instance()->register( new Form() );
