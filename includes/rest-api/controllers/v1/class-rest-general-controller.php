<?php
/**
 * REST API: General Controller
 *
 * @since 1.0.0
 * @package QuillCRM
 * @subpackage API
 */

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use Exception;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Campaign_Email_Model;
use QuillCRM\Models\Abandoned_Cart_Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Campaign_Model;

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
		$total_contacts               = Contact_Model::count();
		$total_sent_emails            = Campaign_Email_Model::where( 'status', 'sent' )->count();
		$recent_contacts              = Contact_Model::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$recent_unsubscribed_contacts = Contact_Model::where( 'status', 'unsubscribed' )->orderBy( 'id', 'desc' )->limit( 5 )->get();
		$top_campaigns                = Campaign_Model::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$top_automations              = Automation_Model::orderBy( 'id', 'desc' )->limit( 5 )->get();
		$recent_emails                = Campaign_Email_Model::with( 'template' )->orderBy( 'id', 'desc' )->limit( 5 )->get();

		$response = array(
			'total_contacts'               => $total_contacts,
			'total_sent_emails'            => $total_sent_emails,
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
		return current_user_can( 'manage_options' );
	}
}
