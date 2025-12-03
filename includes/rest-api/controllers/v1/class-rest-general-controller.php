<?php

/**
 * REST API: General Controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use QuillCRM\User_Roles\Permissions;
use WP_Error;
use Exception;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Tag_Model;
use QuillCRM\Models\List_Model;
// use QuillCRM\Models\Deal_Model; // Moved to Pro
use QuillCRM\Models\Template_Model;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Constants\Campaign_Channel;

/**
 * REST_General_Controller is REST api controller class for log
 *
 * @since 1.0.0
 */
class REST_General_Controller extends REST_Controller {



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
		$total_contacts        = Contact_Model::count();
		$total_sent_emails     = Communication_Tracking_Model::emails()->where( 'status', Tracking_Status::SENT )->count();
		$total_tags            = Tag_Model::count();
		$total_lists           = List_Model::count();
		$total_automations     = Automation_Model::where( 'status', 'active' )->count();
		$total_email_templates = Template_Model::where( 'type', Campaign_Channel::CHANNEL_EMAIL )->count();

		// Deal statistics - only if PRO plugin is active
		if ( class_exists( 'QuillCRM_Pro\Models\Deal_Model' ) ) {
			$deals            = \QuillCRM_Pro\Models\Deal_Model::count();
			$deals_closed_won = \QuillCRM_Pro\Models\Deal_Model::where( 'status', 'won' )->count();
			$deals_won_value  = (float) \QuillCRM_Pro\Models\Deal_Model::where( 'status', 'won' )->sum( 'value' );
		} else {
			$deals            = 0;
			$deals_closed_won = 0;
			$deals_won_value  = 0;
		}

		$recent_contacts              = Contact_Model::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$recent_unsubscribed_contacts = Contact_Model::where( 'email_status', 'unsubscribed' )->orderBy( 'id', 'desc' )->limit( 5 )->get();
		$top_campaigns                = Campaign_Model::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$top_automations              = Automation_Model::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$recent_emails                = Communication_Tracking_Model::emails()->with( 'template' )->orderBy( 'id', 'desc' )->limit( 5 )->get();

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

		if ( quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
			$total_orders           = Abandoned_Cart_Model::where( 'order_id', '>', 0 )->count();
			$total_revenue          = Abandoned_Cart_Model::where( 'order_id', '>', 0 )->sum( 'total' );
			$recent_abandoned_carts = Abandoned_Cart_Model::orderBy( 'id', 'desc' )->limit( 5 )->get();
			$recent_recoverd_carts  = Abandoned_Cart_Model::where( 'status', 'recovered' )->orderBy( 'id', 'desc' )->limit( 5 )->get();

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
