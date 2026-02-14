<?php
/**
 * Class Add_Tags
 *
 * This class is responsible for adding tags to a contact in ActiveCampaign
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\ActiveCampaign;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Add Tags class
 */
class Add_Tags extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Tags';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'activecampaign_add_tags';

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
	public $group = 'activecampaign';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add tags to a contact in ActiveCampaign.';

	/**
	 * Is integration
	 *
	 * @var bool
	 */
	public $is_integration = true;

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
				__( 'ActiveCampaign Add Tags: Tags is empty.', 'quill-crm' ),
				array(
					'code' => 'activecampaign_add_tags',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
				)
			);
			return false;
		}

		$activecampaign = Integrations_Manager::instance()->get_integration( 'activecampaign' );
		$api            = $activecampaign->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Failed to connect to ActiveCampaign.', 'quill-crm' ),
				array(
					'code' => 'activecampaign_connect',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
				)
			);
			return false;
		}

		$result = $api->get_contact( $automation_contact->contact->email );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Failed to get contact from ActiveCampaign.', 'quill-crm' ),
				array(
					'code'     => 'activecampaign_get_contact',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
					'response' => $result,
				)
			);
			return false;
		}

		$contact_id = $result['data']['contacts'][0]['id'] ?? null;
		if ( ! $contact_id ) {
			quillcrm_get_logger()->error(
				__( 'Failed to get contact ID from ActiveCampaign.', 'quill-crm' ),
				array(
					'code'     => 'activecampaign_get_contact_id',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
					'response' => $result,
				)
			);
			return false;
		}

		foreach ( $tags as $tag ) {
			$data = array(
				'contactTag' => array(
					'contact' => $contact_id,
					'tag'     => $tag,
				),
			);

			$result = $api->add_contact_tag( $data );
			if ( ! $result['success'] ) {
				quillcrm_get_logger()->error(
					__( 'Failed to add tag to contact in ActiveCampaign.', 'quill-crm' ),
					array(
						'code'     => 'activecampaign_add_tag',
						'data'     => array(
							'automation' => array(
								'id'   => $automation->id,
								'name' => $automation->name,
							),
							'step'       => array(
								'id'   => $step->id,
								'type' => $step->type,
							),
							'tag'        => $tag,
						),
						'response' => $result,
					)
				);
				continue;
			} else {
				quillcrm_get_logger()->info(
					__( 'Tag added to contact in ActiveCampaign.', 'quill-crm' ),
					array(
						'code'     => 'activecampaign_add_tag',
						'data'     => array(
							'automation' => array(
								'id'   => $automation->id,
								'name' => $automation->name,
							),
							'step'       => array(
								'id'   => $step->id,
								'type' => $step->type,
							),
							'tag'        => $tag,
						),
						'response' => $result,
					)
				);
			}
		}

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
						'type' => 'string',
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
			'tag' => array(
				'type'     => 'api_select',
				'label'    => __( 'Tags', 'quill-crm' ),
				'endpoint' => 'activecampaign/tags',
				'multiple' => true,
			),
		);
	}
}

Add_Tags::instance();
