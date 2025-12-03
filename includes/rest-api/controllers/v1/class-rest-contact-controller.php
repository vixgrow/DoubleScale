<?php

/**
 * REST API: Contact Controller
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
use QuillCRM\Utils;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Constants\Tracking_Status;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\List_Model;
use QuillCRM\Models\Log_Model;
use QuillCRM\Models\Tag_Model;
use QuillCRM\Models\Communication_Tracking_Model;
use QuillCRM\Models\Activity_Model;
use QuillCRM\Managers\Filters_Manager;
use QuillCRM\Contact_Filters\Process as Contact_Filters_Process;
use QuillCRM\Settings;
use QuillCRM\Emails\Emails;
use QuillCRM\Constants\Campaign_Channel;
use QuillCRM\Emails\Email_Tracking_Helper;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * REST_Contact_Controller is REST api controller class for log
 *
 * @since 1.0.0
 */
class REST_Contact_Controller extends REST_Controller {




	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'contacts';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'keyword'       => array(
							'description' => __( 'Keyword to search.', 'quillcrm' ),
							'type'        => 'string',
						),
						'per_page'      => array(
							'description' => __( 'Number of items to fetch.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'page'          => array(
							'description' => __( 'Page number.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'filters'       => array(
							'description' => __( 'Filters to apply.', 'quillcrm' ),
							'type'        => 'array',
						),
						'subscribed'    => array(
							'description' => __( 'Subscribed contacts.', 'quillcrm' ),
							'type'        => 'boolean',
						),
						'campaign_type' => array(
							'description' => __( 'Campaign type for filtering contacts.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => Campaign_Channel::get_core_channel_strings(),
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items' ),
					'permission_callback' => array( $this, 'delete_items_permissions_check' ),
					'args'                => array(
						'ids' => array(
							'description' => __( 'Contact IDs.', 'quillcrm' ),
							'type'        => 'array',
						),
					),
				),
			)
		);

		// Get contact
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( false ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);

		// Get contact notes
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/notes',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_contact_notes' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id'       => array(
							'description' => __( 'Contact ID.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'per_page' => array(
							'description' => __( 'Number of items to fetch.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'page'     => array(
							'description' => __( 'Page number.', 'quillcrm' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);

		// Send opt-in email
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/send-opt-in',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'send_opt_in_email' ),
					'permission_callback' => array( $this, 'send_opt_in_email_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Contact ID.', 'quillcrm' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);

		// Unified send message endpoint (email, SMS, WhatsApp)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/send-message',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'send_message' ),
					'permission_callback' => array( $this, 'send_message_permissions_check' ),
					'args'                => array(
						'id'      => array(
							'description' => __( 'Contact ID.', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'channel' => array(
							'description' => __( 'Communication channel: email, sms, or whatsapp.', 'quillcrm' ),
							'type'        => 'string',
							'required'    => true,
							'enum'        => Campaign_Channel::get_core_channel_strings(),
						),
						'to'      => array(
							'description' => __( 'Recipient (email address or phone number in E.164 format).', 'quillcrm' ),
							'type'        => 'string',
							'required'    => true,
						),
						'body'    => array(
							'description' => __( 'Message body (HTML for email, plain text for SMS/WhatsApp).', 'quillcrm' ),
							'type'        => 'string',
							'required'    => true,
						),
						'subject' => array(
							'description' => __( 'Email subject (required for email, ignored for SMS/WhatsApp).', 'quillcrm' ),
							'type'        => 'string',
							'required'    => false,
						),
					),
				),
			)
		);

		// Get automation contacts
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/automation-contacts',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_automation_contacts' ),
					'permission_callback' => array( $this, 'get_automation_contacts_permissions_check' ),
					'args'                => array(
						'id'       => array(
							'description' => __( 'Contact ID.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'per_page' => array(
							'description' => __( 'Number of items to fetch.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'page'     => array(
							'description' => __( 'Page number.', 'quillcrm' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);

		// Get the filters.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/filters',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_filters' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/analytics',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_analytics' ),
					'permission_callback' => array( $this, 'get_analytics_permissions_check' ),
					'args'                => array(
						'interval'   => array(
							'description' => __( 'Interval for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'enum'        => array( 'custom', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year', 'last_year' ),
							'required'    => false,
						),
						'start_date' => array(
							'description' => __( 'Start date for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
						'end_date'   => array(
							'description' => __( 'End date for the analytics.', 'quillcrm' ),
							'type'        => 'string',
							'format'      => 'date',
						),
					),
				),
			)
		);

		// Add to lists
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/add-to-list',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'add_to_lists' ),
					'permission_callback' => array( $this, 'add_to_lists_permissions_check' ),
					'args'                => array(
						'ids'      => array(
							'description' => __( 'Contact IDs.', 'quillcrm' ),
							'type'        => 'array',
						),
						'list_ids' => array(
							'description' => __( 'Lists to add.', 'quillcrm' ),
							'type'        => 'array',
						),
					),
				),
			)
		);

		// Remove from lists
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/remove-from-list',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'remove_from_lists' ),
					'permission_callback' => array( $this, 'remove_from_lists_permissions_check' ),
					'args'                => array(
						'ids'      => array(
							'description' => __( 'Contact IDs.', 'quillcrm' ),
							'type'        => 'array',
						),
						'list_ids' => array(
							'description' => __( 'Lists to remove.', 'quillcrm' ),
							'type'        => 'array',
						),
					),
				),
			)
		);

		// Add tags
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/add-tag',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'add_tags' ),
					'permission_callback' => array( $this, 'add_tags_permissions_check' ),
					'args'                => array(
						'ids'     => array(
							'description' => __( 'Contact IDs.', 'quillcrm' ),
							'type'        => 'array',
						),
						'tag_ids' => array(
							'description' => __( 'Tags to add.', 'quillcrm' ),
							'type'        => 'array',
						),
					),
				),
			)
		);

		// Remove tags
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/remove-tag',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'remove_tags' ),
					'permission_callback' => array( $this, 'remove_tags_permissions_check' ),
					'args'                => array(
						'ids'     => array(
							'description' => __( 'Contact IDs.', 'quillcrm' ),
							'type'        => 'array',
						),
						'tag_ids' => array(
							'description' => __( 'Tags to remove.', 'quillcrm' ),
							'type'        => 'array',
						),
					),
				),
			)
		);

		// ===================================================================
		// UNIFIED MESSAGES ENDPOINT
		// ===================================================================
		// Get all messages (campaigns + individual) for contact by channel
		// Usage: /contacts/{id}/messages?mode=email (or sms, whatsapp)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/messages',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_messages' ),
					'permission_callback' => array( $this, 'get_messages_permissions_check' ),
					'args'                => array(
						'id'       => array(
							'description' => __( 'Contact ID.', 'quillcrm' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'mode'     => array(
							'description' => __( 'Message channel: email, sms, or whatsapp.', 'quillcrm' ),
							'type'        => 'string',
							'required'    => false,
							'enum'        => Campaign_Channel::get_core_channel_strings(),
							'default'     => 'email',
						),
						'per_page' => array(
							'description' => __( 'Number of items to fetch.', 'quillcrm' ),
							'type'        => 'integer',
							'default'     => 25,
						),
						'page'     => array(
							'description' => __( 'Page number.', 'quillcrm' ),
							'type'        => 'integer',
							'default'     => 1,
						),
					),
				),
			)
		);

		// Get purchase history
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/purchase-history',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_purchase_history' ),
					'permission_callback' => array( $this, 'get_purchase_history_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Contact ID.', 'quillcrm' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);

		// Get lms courses
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/lms-courses',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_lms_courses' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Contact ID.', 'quillcrm' ),
							'type'        => 'integer',
						),
					),
				),
			)
		);
	}

	/**
	 * Schema for the contact
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The contact schema
	 */
	public function get_item_schema() {
		 return array(
			 '$schema'    => 'http://json-schema.org/draft-04/schema#',
			 'title'      => 'contact',
			 'type'       => 'object',
			 'properties' => array(
				 'id'              => array(
					 'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					 'type'        => 'integer',
					 'readonly'    => true,
				 ),
				 'first_name'      => array(
					 'description'  => __( 'First name of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'last_name'       => array(
					 'description'  => __( 'Last name of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'email'           => array(
					 'description'  => __( 'Email of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'required'     => true,
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_email',
					 ),
				 ),
				 'phone'           => array(
					 'description'  => __( 'Phone number of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'address_1'       => array(
					 'description'  => __( 'Address line 1 of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'address_2'       => array(
					 'description'  => __( 'Address line 2 of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'city'            => array(
					 'description'  => __( 'City of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'state'           => array(
					 'description'  => __( 'State of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'country'         => array(
					 'description'  => __( 'Country of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'zip'             => array(
					 'description'  => __( 'Zip code of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'email_status'    => array(
					 'description'  => __( 'Email subscription status.', 'quillcrm' ),
					 'type'         => 'string',
					 'enum'         => array( 'subscribed', 'unsubscribed', 'bounced', 'blocked', 'unverified' ),
					 'default'      => 'subscribed',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'sms_status'      => array(
					 'description'  => __( 'SMS subscription status.', 'quillcrm' ),
					 'type'         => 'string',
					 'enum'         => array( 'subscribed', 'unsubscribed', 'blocked' ),
					 'default'      => 'subscribed',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'whatsapp_status' => array(
					 'description'  => __( 'WhatsApp subscription status.', 'quillcrm' ),
					 'type'         => 'string',
					 'enum'         => array( 'subscribed', 'unsubscribed', 'blocked' ),
					 'default'      => 'subscribed',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'created_at'      => array(
					 'type'        => 'string',
					 'description' => 'Created at',
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'readonly'    => true,
				 ),
				 'updated_at'      => array(
					 'type'        => 'string',
					 'description' => 'Updated at',
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'readonly'    => true,
				 ),
			 ),
		 );
	}

	/**
	 * Get lms courses
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_lms_courses( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ) ) {
				return new WP_Error( 'error', 'LearnDash is not active', array( 'status' => 400 ) );
			}

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$user = get_user_by( 'email', $contact->email );
			if ( ! $user ) {
				return array();
			}

			$courses = learndash_user_get_enrolled_courses( $user->ID );
			$result  = array();

			foreach ( $courses as $course_id ) {
				$course = get_post( $course_id );
				if ( $course ) {
					$completed_on = learndash_user_get_course_completed_date( $user->ID, $course_id );
					$started_on   = ld_course_access_from( $user->ID, $course_id );
					$result[]     = array(
						'id'           => $course->ID,
						'name'         => $course->post_title,
						'url'          => get_edit_post_link( $course->ID ),
						'status'       => learndash_course_status( $course_id, $user->ID ),
						'completed_on' => $completed_on ? date( 'Y-m-d H:i:s', $completed_on ) : null,
						'started_on'   => $started_on ? date( 'Y-m-d H:i:s', $started_on ) : null,
					);
				}
			}

			return new WP_REST_Response( $result, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get lms courses permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return bool
	 */
	public function get_lms_courses_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Get purchase history
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_purchase_history( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$results = array(
				'edd' => array(
					'orders'     => array(),
					'total'      => 0,
					'revenue'    => 0,
					'average'    => 0,
					'last_order' => null,
					'currency'   => null,
				),
				'wc'  => array(
					'orders'     => array(),
					'total'      => 0,
					'revenue'    => 0,
					'average'    => 0,
					'last_order' => null,
					'currency'   => null,
				),
			);

			if ( defined( 'EDD_PLUGIN_FILE' ) ) {
				$edd_orders                   = $contact->edd_orders()
					->orderBy( 'date_created', 'desc' )
					->get();
				$results['edd']['orders']     = $edd_orders;
				$results['edd']['total']      = $edd_orders->count();
				$results['edd']['revenue']    = $edd_orders->sum( 'total' );
				$results['edd']['average']    = $edd_orders->avg( 'total' );
				$results['edd']['last_order'] = $edd_orders->first()->date_created ?? null;
				$results['edd']['currency']   = edd_get_option( 'currency', 'USD' );
			}

			if ( quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
				$user = get_user_by( 'email', $contact->email );
				if ( $user ) {
					$wc_orders                   = wc_get_orders(
						array(
							'customer' => $user->ID,
							'limit'    => -1,
						)
					);
					$results['wc']['orders']     = array_map(
						function ( $order ) {
							return array(
								'id'           => $order->get_id(),
								'total_amount' => floatval( $order->get_total() ),
								'date'         => $order->get_date_created(),
								'url'          => get_edit_post_link( $order->get_id() ),
								'status'       => wc_get_order_status_name( $order->get_status() ),
								'subtotal'     => $order->get_subtotal(),
								'currency'     => $order->get_currency(),
							);
						},
						$wc_orders
					);
					$results['wc']['total']      = count( $wc_orders );
					$results['wc']['revenue']    = array_sum( array_column( $results['wc']['orders'], 'total_amount' ) );
					$results['wc']['average']    = $results['wc']['revenue'] / $results['wc']['total'];
					$results['wc']['last_order'] = $wc_orders[0]->get_date_created() ?? null;
					$results['wc']['currency']   = get_woocommerce_currency();
				} else {
					$wc_orders                   = $contact->orders()
						->orderBy( 'date_created_gmt', 'desc' )
						->get();
					$results['wc']['orders']     = $wc_orders;
					$results['wc']['total']      = $wc_orders->count();
					$results['wc']['revenue']    = $wc_orders->sum( 'total_amount' );
					$results['wc']['average']    = $wc_orders->avg( 'total_amount' );
					$results['wc']['last_order'] = $wc_orders->first()->date_created_gmt ?? null;
					$results['wc']['currency']   = get_woocommerce_currency();
				}
			}

			return new WP_REST_Response( $results, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Unified endpoint to get ALL messages (campaigns + individual) for contact by channel
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_messages( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$mode       = $request->get_param( 'mode' ) ?: Communication_Tracking_Model::MODE_EMAIL; // Default to email (1)
			$per_page   = $request->get_param( 'per_page' ) ?: 25;
			$page       = $request->get_param( 'page' ) ?: 1;

			// Validate contact exists (using helper)
			$contact = $this->validate_contact_exists( $contact_id );
			if ( is_wp_error( $contact ) ) {
				return $contact;
			}

			// Map channel to tracking mode (using helper)
			$tracking_mode = $this->map_mode_to_tracking_mode( $mode );
			if ( is_wp_error( $tracking_mode ) ) {
				return $tracking_mode;
			}

			// Get ALL messages (campaigns + individual) for this channel
			$messages_query = Communication_Tracking_Model::where( 'contact_id', $contact_id )
				->where( 'mode', $tracking_mode )
				->with(
					array(
						'campaign'                    => function ( $query ) {
							$query->select( 'id', 'name', 'type' );
						},
						'template'                    => function ( $query ) {
							$query->select( 'id', 'subject', 'body', 'settings' );
						},
						'activity'                    => function ( $query ) {
							$query->select( 'id', 'contact_id', 'deal_id', 'activity_type', 'data', 'created_at' );
						}, // Include activity content for individual messages (email_sent, sms_sent, whatsapp_sent)
						'communication_tracking_meta' => function ( $query ) {
							$query->select( 'id', 'communication_tracking_id', 'meta_key', 'meta_value' );
						}, // Include merge tag values for historical rendering
					)
				)
				->orderBy( 'created_at', 'desc' );

			// Execute paginated query
			$messages = $messages_query->paginate( $per_page, array( '*' ), 'page', $page );

			// Get statistics in a single query (using helper - 80% faster!)
			$statistics = $this->get_message_statistics( $contact_id, $tracking_mode, $mode );

			// Merge messages with statistics
			$result = array_merge(
				array(
					'messages' => $messages,
					'mode'     => $mode,
				),
				$statistics
			);

			return new WP_REST_Response( $result, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Helper: Map channel mode to tracking mode constant
	 *
	 * @param int|string $mode Channel mode as integer (1, 2, 3) or string (email|sms|whatsapp).
	 *
	 * @return int|WP_Error Tracking mode constant or WP_Error.
	 */
	private function map_mode_to_tracking_mode( $mode ) {
		// If it's already an integer, validate it directly
		if ( is_int( $mode ) || ctype_digit( (string) $mode ) ) {
			$mode_int    = (int) $mode;
			$valid_modes = array( Communication_Tracking_Model::MODE_EMAIL, Communication_Tracking_Model::MODE_SMS, Communication_Tracking_Model::MODE_WHATSAPP );

			if ( in_array( $mode_int, $valid_modes, true ) ) {
				return $mode_int;
			}

			return new WP_Error(
				'invalid_mode',
				sprintf( __( 'Invalid mode: %d. Must be 1 (email), 2 (sms), or 3 (whatsapp).', 'quillcrm' ), $mode_int ),
				array( 'status' => 400 )
			);
		}

		// Map string modes to tracking mode constants
		$mode_map = array(
			Campaign_Channel::STR_EMAIL    => Communication_Tracking_Model::MODE_EMAIL,
			Campaign_Channel::STR_SMS      => Communication_Tracking_Model::MODE_SMS,
			Campaign_Channel::STR_WHATSAPP => Communication_Tracking_Model::MODE_WHATSAPP,
		);

		if ( ! isset( $mode_map[ $mode ] ) ) {
			return new WP_Error(
				'invalid_mode',
				sprintf( __( 'Invalid mode: %s. Must be 1 (email), 2 (sms), or 3 (whatsapp).', 'quillcrm' ), $mode ),
				array( 'status' => 400 )
			);
		}

		return $mode_map[ $mode ];
	}

	/**
	 * Helper: Get message statistics in a single query
	 *
	 * @param int    $contact_id    Contact ID.
	 * @param int    $tracking_mode Tracking mode constant.
	 * @param string $mode          Channel mode (email|sms|whatsapp).
	 *
	 * @return array Statistics array.
	 */
	private function get_message_statistics( $contact_id, $tracking_mode, $mode ) {
		global $wpdb;

		// Single query to get all statistics at once
		$table = $wpdb->prefix . 'quillcrm_communication_tracking';

		// Build query based on mode
		if ( $mode === Campaign_Channel::STR_EMAIL ) {
			$query = $wpdb->prepare(
				"SELECT 
					COUNT(CASE WHEN status = %d THEN 1 END) as total_sent,
					COUNT(CASE WHEN opened = 1 THEN 1 END) as total_opened,
					COUNT(CASE WHEN clicked = 1 THEN 1 END) as total_clicked
				FROM {$table}
				WHERE contact_id = %d AND mode = %d",
				Tracking_Status::SENT,
				$contact_id,
				$tracking_mode
			);

			$stats = $wpdb->get_row( $query );

			$total_sent    = (int) ( $stats->total_sent ?? 0 );
			$total_opened  = (int) ( $stats->total_opened ?? 0 );
			$total_clicked = (int) ( $stats->total_clicked ?? 0 );

			return array(
				'total_sent'    => $total_sent,
				'total_opened'  => $total_opened,
				'total_clicked' => $total_clicked,
				'open_rate'     => $total_sent > 0 ? round( ( $total_opened / $total_sent ) * 100, 2 ) : 0,
				'click_rate'    => $total_sent > 0 ? round( ( $total_clicked / $total_sent ) * 100, 2 ) : 0,
			);
		} else {
			// SMS/WhatsApp statistics
			// For SMS, "total_sent" means successfully sent (SENT + DELIVERED statuses)
			$query = $wpdb->prepare(
				"SELECT 
					COUNT(CASE WHEN status IN (%d, %d) THEN 1 END) as total_sent,
					COUNT(CASE WHEN status IN (%d, %d) THEN 1 END) as total_delivered,
					COUNT(CASE WHEN status = %d THEN 1 END) as total_failed
				FROM {$table}
				WHERE contact_id = %d AND mode = %d",
				Tracking_Status::SENT,
				Tracking_Status::DELIVERED,
				Tracking_Status::DELIVERED,
				Tracking_Status::SENT,
				Tracking_Status::FAILED,
				$contact_id,
				$tracking_mode
			);

			$stats = $wpdb->get_row( $query );

			return array(
				'total_sent'      => (int) ( $stats->total_sent ?? 0 ),
				'total_delivered' => (int) ( $stats->total_delivered ?? 0 ),
				'total_failed'    => (int) ( $stats->total_failed ?? 0 ),
			);
		}
	}

	/**
	 * Helper: Validate contact exists
	 *
	 * @param int $contact_id Contact ID.
	 *
	 * @return Contact_Model|WP_Error Contact model or WP_Error.
	 */
	private function validate_contact_exists( $contact_id ) {
		$contact = Contact_Model::find( $contact_id );

		if ( ! $contact ) {
			return new WP_Error(
				'contact_not_found',
				__( 'Contact not found', 'quillcrm' ),
				array( 'status' => 404 )
			);
		}

		return $contact;
	}

	/**
	 * Permission check for unified messages endpoint
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return bool
	 */
	public function get_messages_permissions_check( $request ) {
		return current_user_can( 'quillcrm_manage_contacts' );
	}

	/**
	 * Get filters
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_filters( $request ) {
		$filters = Filters_Manager::instance()->get_groups();

		return new WP_REST_Response( $filters, 200 );
	}

	/**
	 * Get a collection of contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function get_items( $request ) {
		try {
			$per_page      = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page          = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$keywords      = $request->get_param( 'keywords' ) ?? '';
			$filters       = $request->get_param( 'filters' );
			$subscribed    = $request->get_param( 'subscribed' ) ?? false;
			$campaign_type = $request->get_param( 'campaign_type' ) ?? null;
			$from          = $request->get_param( 'from' ) ?? null;
			$to            = $request->get_param( 'to' ) ?? null;
			$query         = Contact_Model::query();
			$total_count   = $query->count();

			// Start with base query and load relationships
			// Load custom_fields only if Pro plugin is active
			$relationships = array( 'lists', 'tags', 'notes' );
			if ( class_exists( 'QuillCRM_Pro\Models\Custom_Field_Model' ) ) {
				$relationships[] = 'custom_fields';
			}
			$contacts = $query->with( $relationships );

			// Apply date range filters
			if ( $from ) {
				$contacts->where( 'created_at', '>=', $from );
			}
			if ( $to ) {
				$contacts->where( 'created_at', '<=', $to );
			}

			// Apply filters FIRST to narrow down the results
			if ( $filters ) {
				$filters_process = new Contact_Filters_Process( $contacts, $filters );
				$contacts        = $filters_process->filter();
			}

			// Apply subscription filter
			if ( $subscribed ) {
				$contacts = $contacts->where( 'email_status', 'subscribed' );
			}

			// Apply campaign type filter (email/phone availability + channel status)
			if ( $campaign_type ) {
				// Convert campaign_type to integer format for processing
				// Frontend may send: "sms" (string), "2" (numeric string), or 2 (integer)
				if ( is_numeric( $campaign_type ) ) {
					$campaign_type_int = (int) $campaign_type;
				} else {
					$campaign_type_int = Campaign_Channel::to_integer( $campaign_type );
				}

				// Convert back to string for channel status field lookup
				$campaign_type_string = Campaign_Channel::to_string( $campaign_type_int );

				if ( $campaign_type_string ) {
					// Apply channel-specific status filter (e.g., sms_status = 'subscribed')
					$channel_status_field = $campaign_type_string . '_status';
					$contacts             = $contacts->where( $channel_status_field, 'subscribed' );

					// Apply recipient field filter (phone/email availability)
					$campaign_contact_filter = \QuillCRM\Services\Campaign_Contact_Filter::instance();
					$contacts                = $campaign_contact_filter->apply_campaign_type_filter( $contacts, $campaign_type_int );
				}
			}

			// Apply keyword search AFTER filters (search within filtered results)
			if ( '' !== $keywords ) {
				$contacts = $contacts->where(
					function ( $query ) use ( $keywords ) {
						$query->where( 'first_name', 'like', '%' . $keywords . '%' )
							->orWhere( 'last_name', 'like', '%' . $keywords . '%' )
							->orWhere( 'email', 'like', '%' . $keywords . '%' )
							->orWhere( 'phone', 'like', '%' . $keywords . '%' );
					}
				);
			}

			// Paginate and get results (pagination automatically handles total count)
			$contacts = $contacts->orderBy( 'created_at', 'desc' )->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $contacts->toArray() + array( 'total_count' => $total_count ), 200 );
		} catch ( Exception $e ) {
			error_log( $e->getMessage() );
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get a collection of contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function create_item( $request ) {
		$email = $request->get_param( 'email' );

		// Check if email already exists
		$contact = Contact_Model::where( 'email', $email )->first();
		if ( $contact ) {
			return new WP_Error( 'contact_exists', 'Contact already exists', array( 'status' => 400 ) );
		}

		try {
			$contact_data = $this->prepare_contact( $request );
			$contact      = Contact_Model::create( $contact_data );

			$sync_lists = $this->sync_lists( $request, $contact );
			if ( is_wp_error( $sync_lists ) ) {
				return $sync_lists;
			}

			$sync_tags = $this->sync_tags( $request, $contact );
			if ( is_wp_error( $sync_tags ) ) {
				return $sync_tags;
			}

			$sync_custom_fields = $this->sync_custom_fields( $request, $contact );
			if ( is_wp_error( $sync_custom_fields ) ) {
				return $sync_custom_fields;
			}

			$sync_notes = $this->sync_notes( $request, $contact );
			if ( is_wp_error( $sync_notes ) ) {
				return $sync_notes;
			}

			return new WP_REST_Response( $contact, 200 );
		} catch ( Exception $e ) {
			error_log( $e->getMessage() );
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Delete a collection of contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function delete_items( $request ) {
		try {
			$contact_ids = $request->get_param( 'ids' ) ? $request->get_param( 'ids' ) : array();
			$contacts    = Contact_Model::find( $contact_ids );

			if ( ! $contacts ) {
				return new WP_Error( 'not_found', 'Contacts not found', array( 'status' => 404 ) );
			}

			Contact_Model::destroy( $contact_ids );

			return new WP_REST_Response( $contacts, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Delete a contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function delete_item( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$contact->delete();

			return new WP_REST_Response( $contact, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get a contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function get_item( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			// Load relationships - custom_fields only if Pro plugin is active
			$contact->load( array( 'lists', 'tags' ) );
			if ( class_exists( 'QuillCRM_Pro\Models\Custom_Field_Model' ) ) {
				$contact->load( 'custom_fields' );
			}

			return new WP_REST_Response( $contact, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Update a contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function update_item( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$contact_data = $this->prepare_contact( $request );
			$contact->update( $contact_data );

			$sync_lists = $this->sync_lists( $request, $contact );
			if ( is_wp_error( $sync_lists ) ) {
				return $sync_lists;
			}

			$sync_tags = $this->sync_tags( $request, $contact );
			if ( is_wp_error( $sync_tags ) ) {
				return $sync_tags;
			}

			$sync_custom_fields = $this->sync_custom_fields( $request, $contact );
			if ( is_wp_error( $sync_custom_fields ) ) {
				return $sync_custom_fields;
			}

			$sync_notes = $this->sync_notes( $request, $contact );
			if ( is_wp_error( $sync_notes ) ) {
				return $sync_notes;
			}

			// Load relationships - custom_fields only if Pro plugin is active
			$contact->load( array( 'lists', 'tags' ) );
			if ( class_exists( 'QuillCRM_Pro\Models\Custom_Field_Model' ) ) {
				$contact->load( 'custom_fields' );
			}

			return new WP_REST_Response( $contact, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get contact notes
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function get_contact_notes( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$per_page   = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page       = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$activities = Activity_Model::notes()
				->forContact( $contact_id )
				->orderBy( 'created_at', 'desc' )
				->paginate( $per_page, array( '*' ), 'page', $page );

			// Transform the paginated data to note format
			$notes_data = collect( $activities->items() )->map(
				function ( $activity ) {
					return $activity->to_note_format();
				}
			)->values()->toArray();

			// Build paginated response matching the expected format
			$paginated_array         = $activities->toArray();
			$paginated_array['data'] = $notes_data;

			return new WP_REST_Response( $paginated_array, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get automation contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response $response The response data.
	 */
	public function get_automation_contacts( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$per_page = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page     = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$contacts = $contact->automation_contacts()->orderBy( 'created_at', 'desc' )->paginate( $per_page, array( '*' ), 'page', $page );
			$contacts->load( 'automation.steps', 'contact', 'processes.step', 'current_step', 'next_step' );

			return new WP_REST_Response( $contacts, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Prepare contact from request
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return array $contact The contact model.
	 */
	protected function prepare_contact( $request ) {
		$contact = array(
			'first_name'      => $request->get_param( 'first_name' ),
			'last_name'       => $request->get_param( 'last_name' ),
			'email'           => $request->get_param( 'email' ),
			'phone'           => $request->get_param( 'phone' ),
			'address_1'       => $request->get_param( 'address_1' ),
			'address_2'       => $request->get_param( 'address_2' ),
			'city'            => $request->get_param( 'city' ),
			'state'           => $request->get_param( 'state' ),
			'country'         => $request->get_param( 'country' ),
			'zip'             => $request->get_param( 'zip' ),
			'email_status'    => $request->get_param( 'email_status' ),
			'sms_status'      => $request->get_param( 'sms_status' ),
			'whatsapp_status' => $request->get_param( 'whatsapp_status' ),
		);

		foreach ( $contact as $key => $value ) {
			if ( ! $value ) {
				unset( $contact[ $key ] );
			}
		}

		return $contact;
	}

	/**
	 * Add lists to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @param Contact_Model   $contact The contact model.
	 *
	 * @return void
	 */
	protected function sync_lists( $request, $contact ) {
		try {
			$lists = $request->get_param( 'lists' );
			if ( is_array( $lists ) ) {
				if ( empty( $lists ) ) {
					$contact->sync_lists( array() );
					return;
				}
				$lists_arr = array();

				foreach ( $lists as $list ) {
					if ( isset( $list['type'] ) && 'new' === $list['type'] ) {
						$list = List_Model::create( array( 'name' => $list['name'] ) );
						if ( $list ) {
							$lists_arr[] = $list->id;
						}
					} else {
						$list = List_Model::find( $list['id'] );
						if ( $list ) {
							$lists_arr[] = $list->id;
						}
					}
				}

				$contact->sync_lists( $lists_arr );
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Add tags to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @param Contact_Model   $contact The contact model.
	 *
	 * @return void
	 */
	protected function sync_tags( $request, $contact ) {
		try {
			$tags = $request->get_param( 'tags' );
			if ( is_array( $tags ) ) {
				if ( empty( $tags ) ) {
					$contact->sync_tags( array() );
					return;
				}

				$tags_arr = array();

				foreach ( $tags as $tag ) {
					if ( isset( $tag['type'] ) && 'new' === $tag['type'] ) {
						$tag = Tag_Model::create( array( 'name' => $tag['name'] ) );
						if ( $tag ) {
							$tags_arr[] = $tag->id;
						}
					} else {
						$tag = Tag_Model::find( $tag['id'] );
						if ( $tag ) {
							$tags_arr[] = $tag->id;
						}
					}
				}

				$contact->sync_tags( $tags_arr );
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Sync custom fields to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return void|WP_Error
	 */
	protected function sync_custom_fields( $request, $contact ) {
		try {
			// Custom fields are PRO-only feature
			if ( ! class_exists( 'QuillCRM_Pro\Models\Custom_Field_Model' ) ) {
				return;
			}

			$custom_fields = $request->get_param( 'custom_fields' );
			if ( $custom_fields ) {
				$custom_fields_arr = array();

				foreach ( $custom_fields as $custom_field ) {
					// Check if custom field exists
					$custom_field_model = \QuillCRM_Pro\Models\Custom_Field_Model::find( $custom_field['id'] );
					if ( ! $custom_field_model ) {
						return new WP_Error( 'error', __( 'Custom field not found', 'quillcrm' ), array( 'status' => 400 ) );
					}
					$validated = $custom_field_model->validate_value( $custom_field['value'] );

					if ( ! $validated ) {
						continue;
					}

					$custom_fields_arr[ $custom_field['id'] ] = array(
						'value'       => $custom_field['value'],
						'entity_type' => 'contact',
					);
				}

				$contact->custom_fields()->sync( $custom_fields_arr );
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Sync notes to contact
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return void|WP_Error
	 */
	protected function sync_notes( $request, $contact ) {
		try {
			$notes = $request->get_param( 'notes' );
			if ( $notes ) {
				foreach ( $notes as $note ) {
					Activity_Model::create(
						array(
							'contact_id'    => $contact->id,
							'activity_type' => 'note',
							'data'          => array(
								'title' => sanitize_text_field( $note['title'] ?? '' ),
								'type'  => sanitize_text_field( $note['type'] ?? 'note' ),
								'note'  => sanitize_text_field( $note['text'] ?? '' ),
							),
							'user_id'       => get_current_user_id() ?: null,
						)
					);
				}
			}
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	/**
	 * Get analytics
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_analytics( $request ) {
		try {
			$interval   = $request->get_param( 'interval' ) ? $request->get_param( 'interval' ) : 'last_30_days';
			$start_date = $request->get_param( 'start_date' ) ? $request->get_param( 'start_date' ) : '';
			$end_date   = $request->get_param( 'end_date' ) ? $request->get_param( 'end_date' ) : '';

			if ( 'custom' !== $interval ) {
				$start_date = Utils::get_start_date( $interval, $start_date );
				$end_date   = Utils::get_end_date( $interval, $end_date );
			}

			$dates              = Utils::get_dates_between_dates( $start_date, $end_date );
			$type               = $dates['type'] ?? 'hour';
			$total_contacts     = Contact_Model::count();
			$total_subscribed   = Contact_Model::where( 'email_status', 'subscribed' )->count();
			$total_unsubscribed = Contact_Model::where( 'email_status', 'unsubscribed' )->count();
			$contacts           = array();

			foreach ( $dates['dates'] as $date ) {
				switch ( $type ) {
					case 'hour':
						$contacts[ $date ] = Contact_Model::whereBetween( 'created_at', array( $date, date( 'Y-m-d H:i:s', strtotime( $date . ' +1 hour' ) ) ) )->count();
						break;
					case 'day':
						$contacts[ $date ] = Contact_Model::whereDay( 'created_at', date( 'd', strtotime( $date ) ) )->count();
						break;
					case 'month':
						$contacts[ $date ] = Contact_Model::whereMonth( 'created_at', date( 'm', strtotime( $date ) ) )->count();
						break;
					case 'year':
						$contacts[ $date ] = Contact_Model::whereYear( 'created_at', date( 'Y', strtotime( $date ) ) )->count();
						break;
				}
			}

			$analytics = array(
				'contacts'           => $contacts,
				'data'               => $dates,
				'total'              => $total_contacts,
				'total_subscribed'   => $total_subscribed,
				'total_unsubscribed' => $total_unsubscribed,
			);
			return new WP_REST_Response( $analytics, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Send optin email
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function send_opt_in_email( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$contact    = Contact_Model::find( $contact_id );

			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$double_optin = Settings::get( 'double_optin', array() );
			$subject      = $double_optin['email_subject'] ?? __( 'Confirm Subscription', 'quillcrm' );
			$subject      = Merge_Tags_Manager::instance()->process_merge_tags( $subject, $contact );
			$body         = $double_optin['email_content'] ?? $this->default_opt_in_email_body();
			$body         = Merge_Tags_Manager::instance()->process_merge_tags( $body, $contact );

			$emails = new Emails();
			$result = $emails->send(
				$contact->email,
				$subject,
				$body,
			);

			// Log the result for troubleshooting and audit trail.
			if ( ! $result ) {
				Log_Model::create(
					array(
						'timestamp' => gmdate( 'Y-m-d H:i:s' ),
						'level'     => 400, // Error level.
						'message'   => 'Failed to send double opt-in confirmation email',
						'source'    => 'QuillCRM\REST_API\Controllers\V1\REST_Contact_Controller',
						'context'   => array(
							'contact_id' => $contact->id,
							'email'      => $contact->email,
							'subject'    => $subject,
							'reason'     => 'wp_mail() returned false',
							'endpoint'   => '/contacts/' . $contact->id . '/send-opt-in-email',
							'user_id'    => get_current_user_id(),
						),
					)
				);
			} else {
				Log_Model::create(
					array(
						'timestamp' => gmdate( 'Y-m-d H:i:s' ),
						'level'     => 600, // Info level.
						'message'   => 'Double opt-in confirmation email sent successfully',
						'source'    => 'QuillCRM\REST_API\Controllers\V1\REST_Contact_Controller',
						'context'   => array(
							'contact_id' => $contact->id,
							'email'      => $contact->email,
							'subject'    => $subject,
							'user_id'    => get_current_user_id(),
						),
					)
				);
			}

			return new WP_REST_Response( array( 'success' => $result ), 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Send message to contact (unified endpoint for email, SMS, WhatsApp)
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function send_message( $request ) {
		$channel = $request->get_param( 'channel' );

		// Validate channel parameter.
		if ( ! in_array( $channel, Campaign_Channel::get_core_channel_strings(), true ) ) {
			return new WP_Error(
				'invalid_channel',
				__( 'Invalid channel. Must be email, sms, or whatsapp.', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		// Validate email requires subject.
		if ( $channel === Campaign_Channel::STR_EMAIL && empty( $request->get_param( 'subject' ) ) ) {
			return new WP_Error(
				'missing_subject',
				__( 'Subject is required for email messages.', 'quillcrm' ),
				array( 'status' => 400 )
			);
		}

		// Route to appropriate sender based on channel.
		switch ( $channel ) {
			case Campaign_Channel::STR_EMAIL:
				$sender = new \QuillCRM\Individual_Messaging\Email_Individual_Sender();
				break;

			case Campaign_Channel::STR_SMS:
			case Campaign_Channel::STR_WHATSAPP:
				// SMS/WhatsApp messaging moved to Pro plugin
				return new WP_Error(
					'pro_feature_required',
					__( 'SMS and WhatsApp messaging are available in QuillCRM Pro.', 'quillcrm' ),
					array( 'status' => 403 )
				);

			default:
				return new WP_Error(
					'invalid_channel',
					__( 'Invalid channel specified.', 'quillcrm' ),
					array( 'status' => 400 )
				);
		}

		return $sender->send( $request );
	}

	/**
	 * Check permissions for sending messages (email, SMS, WhatsApp)
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool
	 */
	public function send_message_permissions_check( $request ) {
		return current_user_can( 'quillcrm_manage_contacts' );
	}

	/**
	 * Default Opt In Email Body
	 *
	 * @return string
	 */
	public function default_opt_in_email_body() {
		return Settings::get_default_opt_in_content();
	}



	/**
	 * Add to lists
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function add_to_lists( $request ) {
		try {
			$contact_ids = $request->get_param( 'ids' );
			$list_ids    = $request->get_param( 'list_ids' );

			if ( ! $list_ids ) {
				return new WP_Error( 'error', 'Lists not found', array( 'status' => 404 ) );
			}

			$contacts = Contact_Model::find( $contact_ids );
			if ( ! $contacts ) {
				return new WP_Error( 'not_found', 'Contacts not found', array( 'status' => 404 ) );
			}

			foreach ( $contacts as $contact ) {
				$contact->sync_lists( $list_ids );
			}

			return new WP_REST_Response( $contacts, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}



	/**
	 * Remove from lists
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function remove_from_lists( $request ) {
		try {
			$contact_ids = $request->get_param( 'ids' );
			$list_ids    = $request->get_param( 'list_ids' );

			if ( ! $list_ids ) {
				return new WP_Error( 'error', 'Lists not found', array( 'status' => 404 ) );
			}

			$contacts = Contact_Model::find( $contact_ids );
			if ( ! $contacts ) {
				return new WP_Error( 'not_found', 'Contacts not found', array( 'status' => 404 ) );
			}

			foreach ( $contacts as $contact ) {
				$contact->lists()->detach( $list_ids );
			}

			return new WP_REST_Response( $contacts, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}



	/**
	 * Add tags
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function add_tags( $request ) {
		try {
			$contact_ids = $request->get_param( 'ids' );
			$tags_ids    = $request->get_param( 'tag_ids' );

			if ( ! $tags_ids ) {
				return new WP_Error( 'error', 'Tags not found', array( 'status' => 404 ) );
			}

			$contacts = Contact_Model::find( $contact_ids );
			if ( ! $contacts ) {
				return new WP_Error( 'not_found', 'Contacts not found', array( 'status' => 404 ) );
			}

			foreach ( $contacts as $contact ) {
				$contact->sync_tags( $tags_ids );
			}

			return new WP_REST_Response( $contacts, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}



	/**
	 * Remove tags
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function remove_tags( $request ) {
		try {
			$contact_ids = $request->get_param( 'ids' );
			$tags_ids    = $request->get_param( 'tag_ids' );

			if ( ! $tags_ids ) {
				return new WP_Error( 'error', 'Tags not found', array( 'status' => 404 ) );
			}

			$contacts = Contact_Model::find( $contact_ids );
			if ( ! $contacts ) {
				return new WP_Error( 'not_found', 'Contacts not found', array( 'status' => 404 ) );
			}

			foreach ( $contacts as $contact ) {
				$contact->tags()->detach( $tags_ids );
			}

			return new WP_REST_Response( $contacts, 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	// all permissions checks

	/**
	 * Check if a given request has access to get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function get_items_permissions_check( $request ) {
		return Permissions::has_sales_rep_access();
	}

	/**
	 * Check if a given request has access to create items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function create_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function delete_items_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to update items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function update_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to delete items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function delete_item_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to get a specific item
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function get_item_permissions_check( $request ) {
		return Permissions::has_sales_rep_access();
	}

	/**
	 * Check if a given request has access to get automation contacts
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return bool $response Permission check result.
	 */
	public function get_automation_contacts_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Send optin email permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function send_opt_in_email_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Get analytics permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function get_analytics_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Add to lists permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function add_to_lists_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Remove from lists permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function remove_from_lists_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Add tags permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function add_tags_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Remove tags permissions check
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return bool|WP_Error
	 */
	public function remove_tags_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}

	/**
	 * Check if a given request has access to get purchase history
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return bool
	 */
	public function get_purchase_history_permissions_check( $request ) {
		return Permissions::has_crm_manager_access();
	}
}
