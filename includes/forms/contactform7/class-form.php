<?php
/**
 * Contact Form 7 Forms Form
 * This class is used to handle Contact Form 7 form integration
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\ContactForm7;

use WPCF7_ContactForm;
use QuillCRM\Abstracts\Form as Abstracts_Form;
use QuillCRM\Managers\Forms_Manager;

/**
 * ContactForm7 class
 */
class Form extends Abstracts_Form {

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'contactform7';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Contact Form 7';

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
		add_action( 'wpcf7_submit', array( $this, 'process' ), 10, 2 );
		// Ajax Get Fields
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_fields", array( $this, 'ajax_get_fields' ) );
		// Ajax Get Form Select Options
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_form_select_options", array( $this, 'ajax_get_form_select_options' ) );
	}

	/**
	 * Set is_enabled
	 *
	 * @since 1.0.0
	 */
	public function is_enabled() {
		return quillcrm_is_plugin_active( 'contact-form-7/wp-contact-form-7.php' );
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
		$form   = WPCF7_ContactForm::get_instance( $form_id );
		$fields = array();

		if ( empty( $form ) ) {
			return $fields;
		}

		$form_fields = $form->scan_form_tags();
		foreach ( $form_fields as $field ) {
			$fields[ $field->name ] = $field->name;
		}

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
		$forms   = \WPCF7_ContactForm::find();
		$options = array();

		if ( empty( $forms ) ) {
			wp_send_json_error( array( 'message' => __( 'No forms found', 'quillcrm' ) ) );
		}

		foreach ( $forms as $form ) {
			$options[ $form->id() ] = $form->title();
		}

		wp_send_json_success( $options );
	}

	/**
	 * Process
	 *
	 * @since 1.0.0
	 *
	 * @param object $contact_form Contact Form 7 form object.
	 * @param array  $result       Contact Form 7 form result.
	 *
	 * @return void
	 */
	public function process( $contact_form, $result ) {
		$data               = $this->get_default_data();
		$data['form_id']    = $contact_form->id();
		$data['fields']     = $this->get_fields( $contact_form->id() );
		$data['form_title'] = $contact_form->title();
		$data['entry']      = array(
			'fields' => $this->get_form_entry_fields( $contact_form ),
		);

		if ( $this->is_form_active( $contact_form->id() ) ) {
			$this->process_form( $data );
		}

		$this->process_automations( $data );
	}

	/**
	 * Get form entry fields
	 *
	 * @param object $contact_form Contact Form 7 form object.
	 *
	 * @return array
	 */
	public function get_form_entry_fields( $contact_form ) {
		$fields      = array();
		$form_fields = $contact_form->scan_form_tags();
		foreach ( $form_fields as $field ) {
			if ( empty( $field->name ) || false !== strpos( $field->type, 'file' ) || $field->type === 'submit' ) {
				continue;
			}

			$pipes = $field->pipes;

			$value = ( ! empty( $_POST[ $field->name ] ) ) ? $_POST[ $field->name ] : '';
			if ( ! WPCF7_USE_PIPE || ! $pipes instanceof \WPCF7_Pipes || $pipes->zero() ) {
				$data[ $field->name ] = $value;
			}

			// Select field pipes
			if ( is_array( $value ) ) {
				$new_value = array();

				foreach ( $value as $v ) {
					$new_value[] = $pipes->do_pipe( wp_unslash( $v ) );
				}

				$value = $new_value;
			} else {
				$value = $pipes->do_pipe( wp_unslash( $value ) );
			}

			$fields[ $field->name ] = $value;
		}

		return $fields;
	}
}

Forms_Manager::instance()->register( new Form() );
