<?php
/**
 * Class Remove_Tags
 *
 * This class is responsible for removing tags to a Mautic contact
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Mautic;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Remove Tags class
 */
class Remove_Tags extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove Tags';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'mautic_remove_tags';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'send_data';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'mautic';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove tags to a Mautic contact.';

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$tags = $step->get_setting( 'tags', array() );
		if ( empty( $tags ) ) {
			quillcrm_get_logger()->error(
				__( 'Mautic Remove Tags action is missing tags.', 'quillcrm' ),
				array(
					'code' => 'mautic_remove_tags',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
				)
			);
			return false;
		}

		$tags = array_map(
			function( $tag ) {
				return '-' . $tag;
			},
			$tags
		);

		$email  = $automation_contact->contact->email;
		$data   = array(
			'email'     => $email,
			'firstname' => $automation_contact->contact->first_name,
			'lastname'  => $automation_contact->contact->last_name,
			'tags'      => $tags,
		);
		$mautic = Integrations_Manager::instance()->get_integration( 'mautic' );
		$api    = $mautic->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Mautic Remove Tags: Could not connect to Mautic.', 'quillcrm' ),
				array(
					'code' => 'mautic_connect',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
				)
			);
			return false;
		}

		$result = $api->create_or_update_contact( $data );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Mautic Remove Tags: Could not create or update contact.', 'quillcrm' ),
				array(
					'code'     => 'mautic_create_or_update_contact',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
					'response' => $result,
				)
			);
			return false;
		}

		quillcrm_get_logger()->info(
			__( 'Mautic Remove Tags: Tags removed successfully.', 'quillcrm' ),
			array(
				'code'     => 'mautic_remove_tags',
				'response' => $result,
			)
		);

		return true;
	}

	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'tags' => array(
					'type'  => 'array',
					'items' => array(
						'type' => array( 'string', 'number' ),
					),
				),
			),
		);
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'tags' => array(
				'type'     => 'api_select',
				'label'    => __( 'Tags', 'quillcrm' ),
				'endpoint' => 'mautic/tags',
				'multiple' => true,
			),
		);
	}
}

Remove_Tags::instance();
