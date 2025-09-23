<?php
/**
 * Class Rest_Campaign_Controller
 * This class is responsible for handling the campaign rest api
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\REST_API\Controllers\V1;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use QuillCRM\Utils;
use QuillCRM\Abstracts\REST_Controller;
use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;

use QuillCRM\Managers\Campaign_Status_Manager;

/**
 * Rest_Campaign_Controller class
 */
class REST_Campaign_Controller extends REST_Controller
{

	/**
	 * REST Base
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $rest_base = 'campaigns';

	/**
	 * Register the routes for the controller.
	 *
	 * @since 1.0.0
	 */
	public function register_routes()
	{
		// Cross-type operations only - no individual campaign CRUD
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_items'),
					'permission_callback' => array($this, 'get_items_permissions_check'),
					'args' => array(
						'keyword' => array(
							'description' => __('The keyword to search for.', 'quillcrm'),
							'type' => 'string',
						),
						'type' => array(
							'description' => __('Filter by campaign type.', 'quillcrm'),
							'type' => 'string',
							'enum' => array('email', 'sms', 'whatsapp'),
							'required' => false,
						),
						'per_page' => array(
							'description' => __('The number of items to return per page.', 'quillcrm'),
							'type' => 'integer',
							'default' => 10,
						),
						'page' => array(
							'description' => __('The page number.', 'quillcrm'),
							'type' => 'integer',
							'default' => 1,
						),
						'from' => array(
							'description' => __('Start date filter.', 'quillcrm'),
							'type' => 'string',
							'format' => 'date',
						),
						'to' => array(
							'description' => __('End date filter.', 'quillcrm'),
							'type' => 'string',
							'format' => 'date',
						),
					),
				),
			)
		);

		// Analytics route (cross-type)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/analytics',
			array(
				array(
					'methods' => WP_REST_Server::READABLE,
					'callback' => array($this, 'get_analytics'),
					'permission_callback' => array($this, 'get_analytics_permissions_check'),
					'args' => array(
						'interval' => array(
							'description' => __('Interval for the analytics.', 'quillcrm'),
							'type' => 'string',
							'enum' => array('custom', 'today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'this_year', 'last_year'),
							'required' => false,
						),
						'start_date' => array(
							'description' => __('Start date for the analytics.', 'quillcrm'),
							'type' => 'string',
							'format' => 'date',
							'required' => false,
						),
						'end_date' => array(
							'description' => __('End date for the analytics.', 'quillcrm'),
							'type' => 'string',
							'format' => 'date',
							'required' => false,
						),
					),
				),
			)
		);

		// Bulk operations route (cross-type)
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/bulk',
			array(
				array(
					'methods' => WP_REST_Server::CREATABLE,
					'callback' => array($this, 'bulk_operations'),
					'permission_callback' => array($this, 'bulk_operations_permissions_check'),
					'args' => array(
						'operation' => array(
							'description' => __('The bulk operation to perform.', 'quillcrm'),
							'type' => 'string',
							'enum' => array('delete', 'status_change'),
							'required' => true,
						),
						'campaign_ids' => array(
							'description' => __('Array of campaign IDs to operate on.', 'quillcrm'),
							'type' => 'array',
							'items' => array('type' => 'integer'),
							'required' => true,
						),
						'status' => array(
							'description' => __('New status for status_change operation.', 'quillcrm'),
							'type' => 'string',
							'required' => false,
						),
					),
				),
			)
		);

		// Note: Individual campaign CRUD operations moved to type-specific endpoints:
		// - /email-campaigns/* for email campaign management
		// - /sms-campaigns/* for SMS campaign management  
		// - /whatsapp-campaigns/* for WhatsApp campaign management
	}

	/**
	 * Schema for the campaign
	 *
	 * @since 1.0.0
	 *
	 * @return array $schema The campaign schema
	 */
	public function get_item_schema()
	{
		$status_manager = Campaign_Status_Manager::instance();

		return array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title' => 'campaign',
			'type' => 'object',
			'properties' => array(
				'id' => array(
					'description' => __('Unique identifier for the object.', 'quillcrm'),
					'type' => 'integer',
					'readonly' => true,
				),
				'name' => array(
					'description' => __('The name of the campaign.', 'quillcrm'),
					'type' => 'string',
					'required' => true,
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'description' => array(
					'description' => __('The description of the campaign.', 'quillcrm'),
					'type' => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'status' => array(
					'description' => __('The status of the campaign.', 'quillcrm'),
					'type' => 'string',
					'enum' => $status_manager->get_all_statuses(),
					'default' => Campaign_Status_Manager::DRAFT,
					'validate_callback' => array($this, 'validate_campaign_status'),
				),
				'settings' => array(
					'description' => __('The settings of the campaign.', 'quillcrm'),
					'type' => 'object',
				),
				'parent_id' => array(
					'description' => __('The parent id of the campaign.', 'quillcrm'),
					'type' => 'integer',
				),
				'count' => array(
					'description' => __('The count of the campaign.', 'quillcrm'),
					'type' => 'integer',
					'arg_options' => array(
						'sanitize_callback' => 'absint',
					),
				),
				'execute_at' => array(
					'description' => __('The execute at of the campaign.', 'quillcrm'),
					'type' => 'string',
					'arg_options' => array(
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
				'created_at' => array(
					'description' => __('The created at of the campaign.', 'quillcrm'),
					'type' => 'string',
					'readonly' => true,
				),
				'updated_at' => array(
					'description' => __('The updated at of the campaign.', 'quillcrm'),
					'type' => 'string',
					'readonly' => true,
				),
			),
		);
	}

	/**
	 * Get all campaigns
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function get_items($request)
	{
		try {
			$keywords = $request->get_param('keyword') ?? null;
			$type = $request->get_param('type') ?? null;
			$per_page = $request->get_param('per_page') ?? 10;
			$page = $request->get_param('page') ?? 1;
			$from = $request->get_param('from') ?? null;
			$to = $request->get_param('to') ?? null;

			$query = Campaign_Model::query();

			// Get total count before applying filters
			$total_count = $query->count();

			// Apply type filter if specified
			if ($type) {
				if (!in_array($type, ['email', 'sms', 'whatsapp'])) {
					return new WP_Error('invalid_type', __('Invalid campaign type. Must be email, sms, or whatsapp.', 'quillcrm'), array('status' => 400));
				}
				$query->whereRaw("JSON_EXTRACT(settings, '$.type') = ?", [$type]);
			}

			// Apply keywords filter
			if ($keywords) {
				$query->where('name', 'like', '%' . $keywords . '%');
			}

			// Apply date range filter
			if ($from) {
				$query->where('created_at', '>=', $from);
			}
			if ($to) {
				$query->where('created_at', '<=', $to);
			}

			$campaigns = $query->orderBy('created_at', 'desc')
				->paginate($per_page, array('*'), 'page', $page);

			return new WP_REST_Response(
				$campaigns->toArray() + ['total_count' => $total_count],
				200
			);
		} catch (\Exception $e) {
			return new WP_Error('error', $e->getMessage(), array('status' => 500));
		}
	}



	/**
	 * Bulk operations on campaigns (cross-type)
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response $response The response object
	 */
	public function bulk_operations($request)
	{
		try {
			$operation = $request->get_param('operation');
			$campaign_ids = $request->get_param('campaign_ids');
			$status = $request->get_param('status');

			if (empty($campaign_ids) || !is_array($campaign_ids)) {
				return new WP_Error('invalid_campaign_ids', __('Campaign IDs must be a non-empty array.', 'quillcrm'), array('status' => 400));
			}

			// Validate campaigns exist
			$campaigns = Campaign_Model::whereIn('id', $campaign_ids)->get();
			if ($campaigns->isEmpty()) {
				return new WP_Error('campaigns_not_found', __('No campaigns found with the provided IDs.', 'quillcrm'), array('status' => 404));
			}

			$affected_count = 0;
			$errors = array();

			switch ($operation) {
				case 'delete':
					try {
						$affected_count = Campaign_Model::destroy($campaign_ids);
					} catch (\Exception $e) {
						$errors[] = sprintf(__('Failed to delete campaigns: %s', 'quillcrm'), $e->getMessage());
					}
					break;

				case 'status_change':
					if (empty($status)) {
						return new WP_Error('missing_status', __('Status parameter is required for status_change operation.', 'quillcrm'), array('status' => 400));
					}

					// Validate status
					$status_manager = Campaign_Status_Manager::instance();
					if (!$status_manager->is_valid_status($status)) {
						return new WP_Error('invalid_status', sprintf(__('Invalid status: %s', 'quillcrm'), $status), array('status' => 400));
					}

					try {
						$affected_count = Campaign_Model::whereIn('id', $campaign_ids)->update(['status' => $status]);
					} catch (\Exception $e) {
						$errors[] = sprintf(__('Failed to update campaign status: %s', 'quillcrm'), $e->getMessage());
					}
					break;

				default:
					return new WP_Error('invalid_operation', __('Invalid operation. Must be delete or status_change.', 'quillcrm'), array('status' => 400));
			}

			$response_data = array(
				'operation' => $operation,
				'affected_count' => $affected_count,
				'requested_count' => count($campaign_ids),
			);

			if (!empty($errors)) {
				$response_data['errors'] = $errors;
			}

			return new WP_REST_Response($response_data, 200);

		} catch (\Exception $e) {
			return new WP_Error('bulk_operation_error', $e->getMessage(), array('status' => 500));
		}
	}




	/**
	 * Check if a given request has access to get items
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function get_items_permissions_check($request)
	{
		return current_user_can('manage_options');
	}

	/**
	 * Check if a given request has access to bulk operations
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return bool $permission The permission
	 */
	public function bulk_operations_permissions_check($request)
	{
		return current_user_can('manage_options');
	}

	/**
	 * Get generic campaign analytics (all types)
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response
	 */
	public function get_analytics($request)
	{
		try {
			$interval = $request->get_param('interval') ?: 'last_30_days';
			$start_date = $request->get_param('start_date') ?: '';
			$end_date = $request->get_param('end_date') ?: '';

			if ('custom' !== $interval) {
				$start_date = Utils::get_start_date($interval, $start_date);
				$end_date = Utils::get_end_date($interval, $end_date);
			}

			$dates = Utils::get_dates_between_dates($start_date, $end_date);
			$type = $dates['type'] ?? 'hour';
			$campaigns = array();

			foreach ($dates['dates'] as $date) {
				switch ($type) {
					case 'hour':
						$end_hour = date('Y-m-d H:i:s', strtotime($date . ' +1 hour'));
						$campaigns[$date] = Campaign_Model::whereBetween('created_at', array($date, $end_hour))->count();
						break;
					case 'day':
						$start_of_day = $date . ' 00:00:00';
						$end_of_day = $date . ' 23:59:59';
						$campaigns[$date] = Campaign_Model::whereBetween('created_at', array($start_of_day, $end_of_day))->count();
						break;
					case 'month':
						$start_of_month = date('Y-m-01 00:00:00', strtotime($date));
						$end_of_month = date('Y-m-t 23:59:59', strtotime($date));
						$campaigns[$date] = Campaign_Model::whereBetween('created_at', array($start_of_month, $end_of_month))->count();
						break;
					case 'year':
						$start_of_year = date('Y-01-01 00:00:00', strtotime($date));
						$end_of_year = date('Y-12-31 23:59:59', strtotime($date));
						$campaigns[$date] = Campaign_Model::whereBetween('created_at', array($start_of_year, $end_of_year))->count();
						break;
				}
			}

			// Get totals by campaign type within the date range
			$total_campaigns = Campaign_Model::whereBetween('created_at', [$start_date . ' 00:00:00', $end_date . ' 23:59:59'])->count();
			$email_campaigns = Campaign_Model::whereBetween('created_at', [$start_date . ' 00:00:00', $end_date . ' 23:59:59'])
				->whereRaw("JSON_EXTRACT(settings, '$.type') = ?", ['email'])->count();
			$sms_campaigns = Campaign_Model::whereBetween('created_at', [$start_date . ' 00:00:00', $end_date . ' 23:59:59'])
				->whereRaw("JSON_EXTRACT(settings, '$.type') = ?", ['sms'])->count();

			$analytics = array(
				'campaigns' => $campaigns,
				'data' => $dates,
				'total' => $total_campaigns,
				'by_type' => array(
					'email' => $email_campaigns,
					'sms' => $sms_campaigns,
				),
			);
			return new WP_REST_Response($analytics, 200);
		} catch (\Exception $e) {
			return new WP_Error('error', $e->getMessage(), array('status' => 500));
		}
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
	public function get_analytics_permissions_check($request)
	{
		return current_user_can('manage_options');
	}

	/**
	 * Validate campaign status
	 *
	 * @param string $status The status to validate
	 * @param WP_REST_Request $request The request object
	 * @param string $param The parameter name
	 * @return bool|WP_Error
	 */
	public function validate_campaign_status($status, $request, $param)
	{
		$status_manager = Campaign_Status_Manager::instance();

		if (!$status_manager->is_valid_status($status)) {
			return new WP_Error(
				'invalid_campaign_status',
				sprintf(__('Invalid campaign status: %s', 'quillcrm'), $status),
				array('status' => 400)
			);
		}

		return true;
	}
}
