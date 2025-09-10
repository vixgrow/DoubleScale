<?php

namespace QuillCRM\Automations\Actions\Deal;

use QuillCRM\Abstracts\Action;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Models\Pipeline_Model;
use QuillCRM\Models\User_Model;

/**
 * Base utilities for Deal automation actions.
 */
abstract class Base_Deal_Action extends Action {



	/**
	 * Translate helper that is linter-safe in namespaced context.
	 *
	 * @param string $text
	 * @return string
	 */
	protected function t( $text ) {
		if ( function_exists( '\\__' ) ) {
			return call_user_func( '\\__', $text, 'quillcrm' );
		}
		return $text;
	}

	/**
	 * Build base query for targeted deals by effects and pipeline.
	 *
	 * @param array                    $settings Step settings array-like (must support array access via get_setting in caller).
	 * @param Automation_Contact_Model $automation_contact Automation contact model.
	 * @param string                   $pipelineKey Settings key for pipeline filter. Defaults to 'pipeline'.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	protected function build_target_deals_query( $settings, Automation_Contact_Model $automation_contact, $pipelineKey = 'pipeline' ) {
		$effects  = is_array( $settings ) ? ( $settings['effects'] ?? null ) : null;
		$pipeline = is_array( $settings ) ? ( $settings[ $pipelineKey ] ?? null ) : null;
		$deals    = Deal_Model::query();

		if ( $pipeline && $pipeline !== 'any-pipeline' ) {
			$deals = $deals->where( 'pipeline_id', $pipeline );
		}

		if ( $effects === 'all-deals-contact' ) {
			$deals = $deals->where( 'contact_id', $automation_contact->contact->id );
		} elseif ( $effects === 'all-open-deals-contact' ) {
			$deals = $deals->where( 'contact_id', $automation_contact->contact->id )->where( 'status', 'open' );
		} elseif ( $effects === 'all-won-deals-contact' ) {
			$deals = $deals->where( 'contact_id', $automation_contact->contact->id )->where( 'status', 'won' );
		} elseif ( $effects === 'all-lost-deals-contact' ) {
			$deals = $deals->where( 'contact_id', $automation_contact->contact->id )->where( 'status', 'lost' );
		}

		return $deals;
	}

	/**
	 * Shared pipelines select options.
	 *
	 * @return array
	 */
	public function get_pipelines_options() {
		$pipelines = Pipeline_Model::all();
		$options   = array(
			'any-pipeline' => $this->t( 'Any Pipeline' ),
		);
		foreach ( $pipelines as $pipeline ) {
			$options[ $pipeline->id ] = $pipeline->name;
		}
		return $options;
	}

	/**
	 * Shared effects select options.
	 *
	 * @return array
	 */
	public function get_effects_options() {
		return array(
			'all-deals-contact'      => $this->t( 'All deals for this contact' ),
			'all-open-deals-contact' => $this->t( 'All open deals for this contact' ),
			'all-won-deals-contact'  => $this->t( 'All won deals for this contact' ),
			'all-lost-deals-contact' => $this->t( 'All lost deals for this contact' ),
		);
	}

	/**
	 * Shared users select options.
	 *
	 * @return array
	 */
	public function get_users_options() {
		$users   = User_Model::all();
		$options = array();
		foreach ( $users as $user ) {
			$options[ $user->ID ] = $user->display_name;
		}
		return $options;
	}
}
