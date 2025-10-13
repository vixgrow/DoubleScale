<?php

/**
 * MetForm Form Class
 * This class is responsible for handling the integration of MetForm forms
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Forms\MetForm;

use QuillCRM\Abstracts\Form as Abstracts_Form;
use QuillCRM\Managers\Forms_Manager;
use QuillCRM\Merge_Tags\Forms\Dynamic_Fields_Registration;

/**
 * MetForm class
 */
class Form extends Abstracts_Form {




	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'metform';

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'MetForm';

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
		add_action( 'metform_after_store_form_data', array( $this, 'process' ), 10, 2 );
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
		return quillcrm_is_plugin_active( 'metform/metform.php' );
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
		$form_fields = \MetForm\Core\Entries\Action::instance()->get_fields( $form_id );
		$fields      = array();

		if ( empty( $form_fields ) ) {
			return $fields;
		}

		foreach ( $form_fields as $field_id => $field ) {
			if ( 'mf-recaptcha' === $field->widgetType ) {
				continue;
			}
			$fields[ $field_id ] = $field->mf_input_label;
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
		 // Check nonce.
		check_ajax_referer( 'quillcrm-admin', 'nonce' );

		$form_id = isset( $_POST['form_id'] ) ? sanitize_text_field( $_POST['form_id'] ) : '';

		if ( empty( $form_id ) ) {
			wp_send_json_error( __( 'Invalid form ID', 'quillcrm' ) );
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

		$form_list = array();
		$args      = array(
			'posts_per_page' => -1,
			'post_type'      => 'metform-form',
			'post_status'    => 'publish',
		);

		$forms = get_posts( $args );

		if ( ! empty( $forms ) ) {
			foreach ( $forms as $form ) {
				$form_list[ $form->ID ] = $form->post_title;
			}
		}

		wp_send_json_success( $form_list );
	}

	/**
	 * Process
	 *
	 * @since 1.0.0
	 *
	 * @param int   $form_id Form ID
	 * @param array $form_data Form Data
	 *
	 * @return void
	 */
	public function process( $form_id, $form_data ) {
		$data               = $this->get_default_data();
		$data['form_id']    = $form_id;
		$data['fields']     = $this->get_fields( $form_id );
		$data['form_title'] = get_the_title( $form_id );
		$data['entry']      = array(
			'fields' => $form_data,
		);

		if ( $this->is_form_active( $form_id ) ) {
			$this->process_form( $data );
		}

		$this->process_automations( $data );
	}
}

Forms_Manager::instance()->register( new Form() );
