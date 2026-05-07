<?php

/**
 * REST Api: General Controller
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 * @subpackage Api
 */

namespace DoubleScale\Core\Rest\Controllers;

use DoubleScale\UserRoles\Permissions;
use WP_Error;
use Exception;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use DoubleScale\Core\Abstracts\RestController;
use DoubleScale\Core\Rest\Concerns\RegistersLegacyQcV1Routes;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Tracking\Models\CommunicationTrackingModel;
use DoubleScale\Modules\Automations\Models\AbandonedCartModel;
use DoubleScale\Modules\Automations\Models\AutomationModel;
use DoubleScale\Modules\Contacts\Models\TagModel;
use DoubleScale\Modules\Contacts\Models\ListModel;
use DoubleScale\Constants\TrackingStatus;
use DoubleScale\Constants\CampaignChannel;

/**
 * RestGeneralController is REST api controller class for log
 *
 * @since 1.0.0
 */
class RestGeneralController extends RestController {

	use RegistersLegacyQcV1Routes;

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'general';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/dashboard',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_dashboard' ),
					'permission_callback' => array( $this, 'get_dashboard_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Get dashboard
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_dashboard( WP_REST_Request $request ) {
		$total_contacts        = ContactModel::count();
		$total_sent_emails     = CommunicationTrackingModel::emails()->where( 'status', TrackingStatus::SENT )->count();
		$total_tags            = TagModel::count();
		$total_lists           = ListModel::count();
		$total_automations     = AutomationModel::where( 'status', 'active' )->count();
		$total_email_templates = \DoubleScale\Modules\Tracking\Models\TrackingTemplateModel::where( 'type', CampaignChannel::CHANNEL_EMAIL )->count();

		// Deal statistics - only if PRO plugin is active
		if ( class_exists( 'DoubleScale\Modules\Deals\Models\DealModel' ) ) {
			$deals            = \DoubleScale\Modules\Deals\Models\DealModel::count();
			$deals_closed_won = \DoubleScale\Modules\Deals\Models\DealModel::where( 'status', 'won' )->count();
			$deals_won_value  = (float) \DoubleScale\Modules\Deals\Models\DealModel::where( 'status', 'won' )->sum( 'value' );
		} else {
			$deals            = 0;
			$deals_closed_won = 0;
			$deals_won_value  = 0;
		}

		$recent_contacts              = ContactModel::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$recent_unsubscribed_contacts = ContactModel::where( 'email_status', 'unsubscribed' )->orderBy( 'id', 'desc' )->limit( 5 )->get();
		$top_campaigns                = \DoubleScale\Modules\Tracking\Models\TrackingCampaignModel::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$top_automations              = AutomationModel::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$recent_emails                = CommunicationTrackingModel::emails()->with( 'template' )->orderBy( 'id', 'desc' )->limit( 5 )->get();

		$response = array(
			'total_contacts'               => $total_contacts,
			'total_sent_emails'            => $total_sent_emails,
			'total_tags'                   => $total_tags,
			'total_lists'                  => $total_lists,
			'total_automations'            => $total_automations,
			'total_email_templates'        => $total_email_templates,
			'deals'                        => $deals,
			'deals_closed_won'             => $deals_closed_won,
			'deals_won_value'              => $deals_won_value,
			'recent_contacts'              => $recent_contacts,
			'recent_unsubscribed_contacts' => $recent_unsubscribed_contacts,
			'top_campaigns'                => $top_campaigns,
			'top_automations'              => $top_automations,
			'recent_emails'                => $recent_emails,
		);

		if ( doublescale_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			$total_orders           = AbandonedCartModel::where( 'order_id', '>', 0 )->count();
			$total_revenue          = AbandonedCartModel::where( 'order_id', '>', 0 )->sum( 'total' );
			$recent_abandoned_carts = AbandonedCartModel::orderBy( 'id', 'desc' )->limit( 5 )->get();
			$recent_recoverd_carts  = AbandonedCartModel::where( 'status', 'recovered' )->orderBy( 'id', 'desc' )->limit( 5 )->get();

			$response['total_orders']           = $total_orders;
			$response['total_revenue']          = $total_revenue;
			$response['recent_abandoned_carts'] = $recent_abandoned_carts;
			$response['recent_recoverd_carts']  = $recent_recoverd_carts;
		}

		return new WP_REST_Response( $response, 200 );
	}

	/**
	 * Get dashboard permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return bool|WP_Error
	 */
	public function get_dashboard_permissions_check( WP_REST_Request $request ) {
		return Permissions::has_sales_rep_access();
	}
}
