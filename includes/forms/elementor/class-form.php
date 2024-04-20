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

use QuillCRM\Abstracts\Form as Abstracts_Form;
use QuillCRM\Managers\Forms_Manager;
use QuillCRM\Forms\Elementor\Utils;

/**
 * ElementorForms class
 */
class Form extends Abstracts_Form {

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
	 * Load Hooks
	 */
	public function load_hooks() {
		add_action( 'elementor_pro/forms/new_record', array( $this, 'process' ), 10, 2 );
		// Ajax Get Fields
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_fields", array( $this, 'ajax_get_fields' ) );
		// Ajax Get Form Select Options
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_form_select_options", array( $this, 'ajax_get_form_select_options' ) );
		// Ajax Get Source Select Options
		add_action( "wp_ajax_quillcrm_{$this->slug}_get_source_select_options", array( $this, 'ajax_get_source_select_options' ) );
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
		$form        = Utils::get_form( $form_id, $this->post_id );
		$form_fields = $form['settings']['form_fields'] ?? array();

		$fields = array();
		foreach ( $form_fields as $field ) {
			$fields[ $field['custom_id'] ] = $field['field_label'];
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
		$post_id = isset( $_POST['post_id'] ) ? sanitize_text_field( $_POST['post_id'] ) : '';

		if ( empty( $post_id ) ) {
			wp_send_json_error( __( 'Invalid source ID', 'quillcrm' ) );
		}

		if ( empty( $form_id ) ) {
			wp_send_json_error( __( 'Invalid form ID', 'quillcrm' ) );
		}

		$this->post_id = $post_id;
		$fields        = $this->get_fields( $form_id, $post_id );

		wp_send_json_success( $fields );
	}

	/**
	 * Ajax Get Source Select Options
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function ajax_get_source_select_options() {
		$pages = Utils::get_pages();

		wp_send_json_success( $pages );
	}

	/**
	 * Ajax Get Form Select Options
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function ajax_get_form_select_options() {
		$post_id = isset( $_POST['post_id'] ) ? sanitize_text_field( $_POST['post_id'] ) : '';

		if ( empty( $post_id ) ) {
			wp_send_json_error( __( 'Invalid source ID', 'quillcrm' ) );
		}

		$forms = Utils::get_forms_by_page_id( $post_id );

		wp_send_json_success( $forms );
	}

	/**
	 * Process
	 *
	 * @since 1.0.0
	 *
	 * @param $record
	 * @param $handler
	 *
	 * @return void
	 */
	public function process( $record, $handler ) {
		if ( ! $this->is_form_active( $record->get_form_settings( 'id' ) ) ) {
			return;
		}
		$data               = $this->get_default_data();
		$data['form_id']    = $record->get_form_settings( 'id' );
		$data['form_title'] = $record->get_form_settings( 'form_name' );
		$fields             = $record->get( 'fields' );
		$data['fields']     = $this->prepare_fields( $fields );
		$entry              = array(
			'fields' => array(),
		);

		foreach ( $fields as $field_id => $field ) {
			$entry['fields'][ $field_id ] = $field['value'] ?? '';
		}

		$data['entry'] = $entry;

		error_log( 'Form Record: ' . wp_json_encode( $data ) );

		$this->process_form( $data );
	}

	/**
	 * Prepare fields
	 *
	 * @since 1.0.0
	 *
	 * @param array $fields form fields
	 *
	 * @return array
	 */
	public function prepare_fields( $fields ) {
		$prepared_fields = array();

		foreach ( $fields as $field_id => $field ) {
			$prepared_fields[ $field_id ] = $field['title'] ?? '';
		}

		return $prepared_fields;
	}

	/**
	 * Get form options
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_form_options() {
		$options = array(
			'post_id' => array(
				'label'       => __( 'Source ID', 'quillcrm' ),
				'type'        => 'ajax_select',
				'help'        => __( 'The Post/Page or Elementor Library ID where the form is located', 'quillcrm' ),
				'ajax_action' => "quillcrm_{$this->slug}_get_source_select_options",
				'conditions'  => array(
					'relation' => 'and',
					'rules'    => array(
						array(
							'field'    => 'form_source',
							'operator' => 'not_empty',
						),
					),
				),
			),
			'form_id' => array(
				'label'       => __( 'Form ID', 'quillcrm' ),
				'type'        => 'ajax_select',
				'ajax_action' => "quillcrm_{$this->slug}_get_form_select_options",
				'conditions'  => array(
					'relation' => 'and',
					'rules'    => array(
						array(
							'field'    => 'form_source',
							'operator' => 'not_empty',
						),
						array(
							'field'    => 'form_source',
							'operator' => 'not_empty',
						),
					),
				),
			),
		);

		return $options;
	}
}


if ( quillcrm_is_plugin_active( 'elementor-pro/elementor-pro.php' ) ) {
	Forms_Manager::instance()->register( new Form() );
}
