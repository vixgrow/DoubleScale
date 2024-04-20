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

use QuillCRM\Abstracts\Form as Abstracts_Form;
use QuillCRM\Managers\Forms_Manager;

/**
 * FluentForms class
 */
class Form extends Abstracts_Form {

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
	 * Load Hooks
	 */
	public function load_hooks() {
		add_action( 'fluentform_submission_inserted', array( $this, 'process' ), 10, 3 );
		// Ajax Get Fields
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_fields", array( $this, 'ajax_get_fields' ) );
		// Ajax Get Form Select Options
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_form_select_options", array( $this, 'ajax_get_form_select_options' ) );
	}

	/**
	 * Get Fields
	 *
	 * @since 1.0.0
	 *
	 * @param string $form_id
	 *
	 * @return void
	 */
	public function get_fields( $form_id ) {
		$form   = wpFluent()->table( 'fluentform_forms' )->find( $form_id );
		$fields = array();

		if ( empty( $form ) ) {
			return;
		}

		$form_fields = json_decode( $form->form_fields );
		$fields      = $this->get_fields_recursive( $form_fields->fields );

		return $fields;
	}

	/**
	 * Get Fields Recursive
	 *
	 * @since 1.0.0
	 *
	 * @param array $fields
	 *
	 * @return void
	 */
	public function get_fields_recursive( $fields ) {
		$result = array();

		foreach ( $fields as $key => $field ) {
			if ( ( isset( $field->settings->visible ) && false === $field->settings->visible ) ) {
				continue;
			}

			if ( isset( $field->fields ) && ! empty( $field->fields ) ) {
				$result = array_merge( $result, $this->get_fields_recursive( $field->fields ) );
				continue;
			}

			if ( isset( $field->columns ) && ! empty( $field->columns ) ) {
				$result = array_merge( $result, $this->get_fields_recursive( $field->columns ) );
				continue;
			}

			if ( isset( $field->attributes->name ) && isset( $field->settings->label ) ) {
				$result[ $field->attributes->name ] = $field->settings->label;
			}
		}

		return $result;
	}

	/**
	 * Get Form Select Options
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function ajax_get_form_select_options() {
		$forms   = wpFluent()->table( 'fluentform_forms' )->get();
		$options = array();

		foreach ( $forms as $form ) {
			$options[ $form->id ] = $form->title;
		}

		wp_send_json_success( $options );
	}

	/**
	 * Ajax Get Fields
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function ajax_get_fields() {
		$form_id = isset( $_POST['form_id'] ) ? sanitize_text_field( $_POST['form_id'] ) : '';

		if ( empty( $form_id ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid form ID', 'quillcrm' ) ) );
		}

		$fields = $this->get_fields( $form_id );

		wp_send_json_success( $fields );
	}

	/**
	 * Process
	 *
	 * @since 1.0.0
	 *
	 * @param int   $submission_id Submission ID.
	 * @param array $form_data Data.
	 * @param array $form Form.
	 *
	 * @return void
	 */
	public function process( $submission_id, $form_data, $form ) {
		if ( ! $this->is_form_active( $form['id'] ) ) {
			return;
		}
		$data               = $this->get_default_data();
		$data['form_id']    = $form['id'];
		$data['form_title'] = $form['title'];
		$fields             = json_decode( $form['form_fields'] );
		$data['fields']     = $this->get_fields_recursive( $fields->fields );
		$data['entry']      = array(
			'fields' => $this->prepare_form_fields_recursive( $form_data ),
		);

		$this->process_form( $data );
	}

	/**
	 * Prepare Form Fields Recursive
	 *
	 * @since 1.0.0
	 *
	 * @param array $fields Fields.
	 *
	 * @return void
	 */
	public function prepare_form_fields_recursive( $fields ) {
		$result = array();

		foreach ( $fields as $key => $field ) {
			if ( is_array( $field ) ) {
				$result = array_merge( $result, $this->prepare_form_fields_recursive( $field ) );
				continue;
			}

			if ( is_object( $field ) ) {
				$result = array_merge( $result, $this->prepare_form_fields_recursive( (array) $field ) );
				continue;
			}

			$result[ $key ] = $field;
		}

		return $result;
	}
}

if ( quillcrm_is_plugin_active( 'fluentform/fluentform.php' ) ) {
	Forms_Manager::instance()->register( new Form() );
}
