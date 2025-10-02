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
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\List_Model;
use QuillCRM\Models\Tag_Model;
use QuillCRM\Models\Custom_Field_Model;
use QuillCRM\Managers\Filters_Manager;
use QuillCRM\Contact_Filters\Process as Contact_Filters_Process;
use QuillCRM\Settings;
use QuillCRM\Emails\Emails;
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
						'keyword'    => array(
							'description' => __( 'Keyword to search.', 'quillcrm' ),
							'type'        => 'string',
						),
						'per_page'   => array(
							'description' => __( 'Number of items to fetch.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'page'       => array(
							'description' => __( 'Page number.', 'quillcrm' ),
							'type'        => 'integer',
						),
						'filters'    => array(
							'description' => __( 'Filters to apply.', 'quillcrm' ),
							'type'        => 'array',
						),
						'subscribed' => array(
							'description' => __( 'Subscribed contacts.', 'quillcrm' ),
							'type'        => 'boolean',
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

		// Get automation contacts
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/automation-contacts',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_automation_contacts' ),
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

		// Get email campaigns
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>\d+)/email-campaigns',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_email_campaigns' ),
					'permission_callback' => array( $this, 'get_email_campaigns_permissions_check' ),
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
				 'id'         => array(
					 'description' => __( 'Unique identifier for the object.', 'quillcrm' ),
					 'type'        => 'integer',
					 'readonly'    => true,
				 ),
				 'first_name' => array(
					 'description'  => __( 'First name of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'last_name'  => array(
					 'description'  => __( 'Last name of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'email'      => array(
					 'description'  => __( 'Email of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'required'     => true,
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_email',
					 ),
				 ),
				 'phone'      => array(
					 'description'  => __( 'Phone number of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'address_1'  => array(
					 'description'  => __( 'Address line 1 of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'address_2'  => array(
					 'description'  => __( 'Address line 2 of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'city'       => array(
					 'description'  => __( 'City of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'state'      => array(
					 'description'  => __( 'State of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'country'    => array(
					 'description'  => __( 'Country of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'zip'        => array(
					 'description'  => __( 'Zip code of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'status'     => array(
					 'description'  => __( 'Status of the contact.', 'quillcrm' ),
					 'type'         => 'string',
					 'enum'         => array( 'subscribed', 'unsubscribed', 'bounced', 'unverified' ),
					 'args_options' => array(
						 'sanitize_callback' => 'sanitize_text_field',
					 ),
				 ),
				 'created_at' => array(
					 'type'        => 'string',
					 'description' => 'Created at',
					 'context'     => array( 'view', 'edit', 'embed' ),
					 'readonly'    => true,
				 ),
				 'updated_at' => array(
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
		return current_user_can( 'manage_options' );
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
	 * Get Email Campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return WP_REST_Response
	 */
	public function get_email_campaigns( $request ) {
		try {
			$contact_id = $request->get_param( 'id' );
			$per_page   = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page       = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;

			$contact = Contact_Model::find( $contact_id );
			if ( ! $contact ) {
				return new WP_Error( 'not_found', 'Contact not found', array( 'status' => 404 ) );
			}

			$campaigns     = $contact->campaign_emails()->with(
				array(
					'campaign' => function ( $query ) {
						$query->select( 'id', 'name' );
					},
					'template',
				)
			)->paginate( $per_page, array( '*' ), 'page', $page );
			$total_sent    = $contact->campaign_emails()->where( 'status', 'sent' )->count();
			$total_opened  = $contact->campaign_emails()->where( 'opened', 1 )->count();
			$total_clicked = $contact->campaign_emails()->where( 'clicked', 1 )->count();

			$result = array(
				'emails'        => $campaigns,
				'total_sent'    => $total_sent,
				'total_opened'  => $total_opened,
				'total_clicked' => $total_clicked,
			);

			return new WP_REST_Response( $result, 200 );
		} catch ( Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 400 ) );
		}
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
			$per_page   = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page       = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$keywords   = $request->get_param( 'keywords' ) ?? '';
			$filters    = $request->get_param( 'filters' );
			$subscribed = $request->get_param( 'subscribed' ) ?? false;
			$from       = $request->get_param( 'from' ) ?? null;
			$to         = $request->get_param( 'to' ) ?? null;
			$query      = Contact_Model::query();

			$total_count = $query->count();
			if ( '' !== $keywords ) {
				$contacts = $query->with( 'lists', 'tags', 'custom_fields', 'notes' )
					->where( 'first_name', 'like', '%' . $keywords . '%' )
					->orWhere( 'last_name', 'like', '%' . $keywords . '%' )
					->orWhere( 'email', 'like', '%' . $keywords . '%' )
					->orWhere( 'phone', 'like', '%' . $keywords . '%' );
			} else {
				$contacts = $query->with( 'lists', 'tags', 'custom_fields', 'notes' );
			}

			if ( $from ) {
				$query->where( 'created_at', '>=', $from );
			}
			if ( $to ) {
				$query->where( 'created_at', '<=', $to );
			}

			if ( $filters ) {
				$filters_process = new Contact_Filters_Process( $contacts, $filters );
				$contacts        = $filters_process->filter();
			}

			if ( $subscribed ) {
				$contacts = $contacts->where( 'status', 'subscribed' );
			}

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

			$contact->load( 'lists', 'tags', 'custom_fields' );

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

			$contact->load( 'lists', 'tags', 'custom_fields' );

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

			$per_page = $request->get_param( 'per_page' ) ? $request->get_param( 'per_page' ) : 10;
			$page     = $request->get_param( 'page' ) ? $request->get_param( 'page' ) : 1;
			$notes    = $contact->notes()->orderBy( 'created_at', 'desc' )->paginate( $per_page, array( '*' ), 'page', $page );

			return new WP_REST_Response( $notes, 200 );
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
			$contacts->load( 'automation' );

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
			'first_name' => $request->get_param( 'first_name' ),
			'last_name'  => $request->get_param( 'last_name' ),
			'email'      => $request->get_param( 'email' ),
			'phone'      => $request->get_param( 'phone' ),
			'address_1'  => $request->get_param( 'address_1' ),
			'address_2'  => $request->get_param( 'address_2' ),
			'city'       => $request->get_param( 'city' ),
			'state'      => $request->get_param( 'state' ),
			'country'    => $request->get_param( 'country' ),
			'zip'        => $request->get_param( 'zip' ),
			'status'     => $request->get_param( 'status' ),
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
					$contact->lists()->detach();
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
					$contact->tags()->detach();
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
			$custom_fields = $request->get_param( 'custom_fields' );
			if ( $custom_fields ) {
				$custom_fields_arr = array();

				foreach ( $custom_fields as $custom_field ) {
					// Check if custom field exists
					$custom_field_model = Custom_Field_Model::find( $custom_field['id'] );
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
				$notes     = $notes;
				$notes_arr = array();

				foreach ( $notes as $note ) {
					$notes_arr[] = array(
						'note' => sanitize_text_field( $note['text'] ),
					);
				}

				$contact->notes()->createMany( $notes_arr );
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
			$total_subscribed   = Contact_Model::where( 'status', 'subscribed' )->count();
			$total_unsubscribed = Contact_Model::where( 'status', 'unsubscribed' )->count();
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
			$body         = $double_optin['email_body'] ?? $this->default_opt_in_email_body();
			$body         = Merge_Tags_Manager::instance()->process_merge_tags( $body, $contact );

			$emails = new Emails();
			$result = $emails->send(
				$contact->email,
				$subject,
				$body,
			);

			return new WP_REST_Response( array( 'success' => $result ), 200 );
		} catch ( \Exception $e ) {
			return new WP_Error( 'error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	/**
	 * Default Opt In Email Body
	 *
	 * @return string
	 */
	public function default_opt_in_email_body() {
		$body = sprintf(
			'<p>' . __( 'Please confirm your subscription by clicking the link below:', 'quillcrm' ) . '</p>
            <p><a href="{{contact:subscribe_link}}">' . __( 'Confirm Subscription', 'quillcrm' ) . '</a></p>',
			'{{contact:subscribe_link}}'
		);
		return $body;
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
		return Permissions::has_deal_owner_access();
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
		return Permissions::has_deal_owner_access();
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
	 * Check if a given request has access to get email campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request
	 *
	 * @return bool
	 */
	public function get_email_campaigns_permissions_check( $request ) {
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
