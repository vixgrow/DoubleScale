<?php
/**
 * Pro automation trigger (free plugin): definition only. Runtime hooks ship in DoubleScale Pro.
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Automations\Triggers\Link;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Automations\Abstracts\TriggerPro;
use DoubleScale\Modules\Automations\Services\TriggersManager;

/**
 * Link trigger clicked stub.
 *
 * Field definitions mirror Pro so the Trigger Settings UI can render the
 * link-trigger selector once Pro replaces this stub at runtime.
 */
class LinkTriggerClicked extends TriggerPro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Link Trigger Clicked';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'link_trigger_clicked';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger fires when a selected link trigger is clicked.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'link_triggers';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'link_triggers';

	/**
	 * Trigger configuration fields (mirrored from Pro).
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'links' => array(
				'type'        => 'api_select',
				'label'       => __( 'Link Triggers', 'doublescale' ),
				'endpoint'    => 'doublescale/v1/link-triggers',
				'placeholder' => __( 'Select link trigger(s)', 'doublescale' ),
				'multiple'    => true,
				'required'    => true,
				'helperText'  => __(
					'Only clicks on the selected link trigger(s) will start this automation.',
					'doublescale'
				),
			),
		);
	}

	/**
	 * Attributes schema.
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'links' => array(
					'type'     => 'array',
					'items'    => array(
						'type' => 'integer',
					),
					'required' => true,
				),
			),
		);
	}
}

TriggersManager::instance()->register( new LinkTriggerClicked() );
