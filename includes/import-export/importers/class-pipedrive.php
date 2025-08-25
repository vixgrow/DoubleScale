<?php
/**
 * Pipedrive Importer
 *
 * This class is responsible for handling the Pipedrive importer
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export\Importers;

use QuillCRM\Abstracts\Importer;
use QuillCRM\Automations\Integrations\Pipedrive\API;

/**
 * Pipedrive Importer class
 */
class Pipedrive extends Importer
{

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Pipedrive';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'pipedrive';

	/**
	 * Is Integration
	 *
	 * @var bool
	 */
	protected $is_integration = true;

	/**
	 * Mapping
	 *
	 * @var array
	 */
	protected $mapping;

	/**
	 * Cached person fields
	 *
	 * @var array|null
	 */
	private $cached_person_fields = null;

	/**
	 * Cached pipelines
	 *
	 * @var array|null
	 */
	private $cached_pipelines = null;

	/**
	 * Cached stages
	 *
	 * @var array|null
	 */
	private $cached_stages = null;

	/**
	 * Constructor
	 *
	 * @param array $args args
	 */
	public function __construct($args = array())
	{
		parent::__construct($args);
		$this->mapping = $args['mapping'] ?? array();
	}

	/**
	 * Run importer using cursor-based pagination for v2 API
	 */
	public function run()
	{
		$api = $this->get_api();

		// Cache metadata once at start to avoid repeated API calls
		$this->cache_metadata($api);

		if (empty($this->mapping)) {
			$this->mapping = $this->get_field_mapping();
		}
		$mapping = array_flip($this->mapping);

		$first_page_response = $api->get_persons_first_page();
				
		if (!$first_page_response['success']) {
			$error_message = __('Pipedrive: Error fetching persons', 'quillcrm');
			$error_details = array(
				'code' => 'pipedrive_get_persons_first_page',
				'response' => $first_page_response,
			);

			quillcrm_get_logger()->error($error_message, $error_details);
			throw new \Exception($error_message);
		}

		$total = 0;
		$cursor = null;
		
		do {
			$response = $api->get_persons_by_cursor($cursor, 500); // Use max limit for efficiency
			if (!$response['success']) {
				break;
			}
			
			$items = $response['data']['data'] ?? array();
			$total += count($items);
			
			$cursor = $response['data']['additional_data']['next_cursor'] ?? null;
			
		} while ($cursor && $total < 10000); // Safety limit


		if ($total === 0) {
			return array(
				'total' => 0,
				'status' => 'completed',
				'offset' => 0,
			);
		}

		// Use cursor-based pagination 
		$result = $this->import_with_cursor(
			$total,
			$this->offset ?? 0,  // Pass offset as expected by the method signature
			function ($cursor) use ($api) {
				return $this->fetch_persons_batch_cursor($api, $cursor);
			},
			$mapping
		);

		return $result;
	}

	/**
	 * Cache metadata once per import session
	 *
	 * @param API $api Pipedrive API instance.
	 *
	 * @return void
	 */
	private function cache_metadata($api)
	{
		if ($this->cached_person_fields === null) {
			$fields_response = $api->get_person_fields();
			if ($fields_response['success']) {
				$this->cached_person_fields = $fields_response['data']['data'] ?? array();
			} else {
				$this->cached_person_fields = array();
				quillcrm_get_logger()->warning(
					__('Pipedrive: Could not fetch person fields', 'quillcrm'),
					array(
						'code' => 'pipedrive_get_person_fields',
						'response' => $fields_response,
					)
				);
			}
		}

		if ($this->cached_pipelines === null) {
			$pipelines_response = $api->get_pipelines();
			if ($pipelines_response['success']) {
				$this->cached_pipelines = $pipelines_response['data']['data'] ?? array();
			} else {
				$this->cached_pipelines = array();
			}
		}

		if ($this->cached_stages === null) {
			$stages_response = $api->get_stages();
			if ($stages_response['success']) {
				$this->cached_stages = $stages_response['data']['data'] ?? array();
			} else {
				$this->cached_stages = array();
			}
		}
	}

	/**
	 * Fetch persons batch from Pipedrive using cursor-based pagination (v2 API)
	 *
	 * @param API $api    Pipedrive API instance.
	 * @param string|null $cursor Current cursor.
	 *
	 * @return array
	 */
	private function fetch_persons_batch_cursor($api, $cursor)
	{
		$response = $api->get_persons_by_cursor($cursor, 100);

		if (!$response['success'] || empty($response['data']['data'])) {
			return array(
				'contacts' => array(),
				'next_cursor' => null,
			);
		}

		$persons = array();
		foreach ($response['data']['data'] as $person) {
			$processed_person = $this->process_pipedrive_person($person);
			$persons[] = $processed_person;
		}

		// Return in the format expected by import_with_cursor method
		return array(
			'contacts' => $persons,
			'next_cursor' => $response['data']['additional_data']['next_cursor'] ?? null,
		);
	}


	/**
	 * Process individual Pipedrive person
	 *
	 * @param array $person Raw Pipedrive person data.
	 *
	 * @return array
	 */
	private function process_pipedrive_person($person)
	{
		$processed = array();

		// Map standard properties
		$processed['email'] = $this->get_primary_email($person);
		$processed['first_name'] = $person['first_name'] ?? '';
		$processed['last_name'] = $person['last_name'] ?? '';
		$processed['phone'] = $this->get_primary_phone($person);

		$is_active = $person['active_flag'] ?? true;
		if (is_bool($is_active)) {
			$processed['status'] = $is_active ? 'subscribed' : 'unsubscribed';
		} else {
			// Fallback for any legacy data
			$processed['status'] = ($is_active == true || $is_active === 1 || $is_active === '1') ? 'subscribed' : 'unsubscribed';
		}

		// Process organization/company info
		$processed['company'] = '';

		if (!empty($person['org_id']) && is_array($person['org_id']) && !empty($person['org_id']['name'])) {
			$processed['company'] = $person['org_id']['name'];
		}

		// Process custom fields
		foreach ($this->cached_person_fields as $field) {
			$field_key = $field['key'];
			if (isset($person[$field_key]) && !in_array($field_key, array('name', 'first_name', 'last_name', 'email', 'emails', 'phone', 'phones', 'active_flag'))) {
				$processed[$field_key] = $person[$field_key];
			}
		}

		$processed['lists'] = $this->get_person_labels($person);
		$processed['tags'] = $this->get_person_stage_tags($person);

		return $processed;
	}

	/**
	 * Get primary email from Pipedrive person
	 *
	 * @param array $person Pipedrive person data.
	 *
	 * @return string
	 */
	private function get_primary_email($person)
	{
		if (!empty($person['emails']) && is_array($person['emails'])) {
			return $person['emails'][0]['value'] ?? '';
		}
		// Fallback for legacy 'email' field
		if (!empty($person['email'])) {
			if (is_array($person['email'])) {
				return $person['email'][0]['value'] ?? '';
			}
			return $person['email'];
		}
		return '';
	}

	/**
	 * Get primary phone from Pipedrive person
	 *
	 * @param array $person Pipedrive person data.
	 *
	 * @return string
	 */
	private function get_primary_phone($person)
	{
		$phone = '';
		
		if (!empty($person['phones']) && is_array($person['phones'])) {
			$phone = $person['phones'][0]['value'] ?? '';
		}
		// Fallback for legacy 'phone' field
		elseif (!empty($person['phone'])) {
			if (is_array($person['phone'])) {
				$phone = $person['phone'][0]['value'] ?? '';
			} else {
				$phone = $person['phone'];
			}
		}
		
		if (!empty($phone)) {
			$phone = preg_replace('/[^\d+]/', '', $phone);
		}
		
		return $phone;
	}

	/**
	 * Get person labels as lists
	 *
	 * @param array $person Pipedrive person data.
	 *
	 * @return string
	 */
	private function get_person_labels($person)
	{
		$labels = array();
		
		// Pipedrive has labels for persons
		if (!empty($person['label'])) {
			$labels[] = $person['label'];
		}

		return implode(',', $labels);
	}

	/**
	 * Get person stage information as tags
	 *
	 * @param array $person Pipedrive person data.
	 *
	 * @return string
	 */
	private function get_person_stage_tags($person)
	{
		$tags = array();

		if (!empty($person['owner_id'])) {
			if (is_array($person['owner_id']) && !empty($person['owner_id']['name'])) {
				$tags[] = 'Owner: ' . $person['owner_id']['name'];
			} else {
				$tags[] = 'Owner ID: ' . $person['owner_id'];
			}
		}

		return implode(',', $tags);
	}

	/**
	 * Get field mapping for import
	 *
	 * @return array
	 */
	private function get_field_mapping()
	{
		return array(
			'first_name' => 'first_name',
			'last_name' => 'last_name',
			'email' => 'email',
			'phone' => 'phone',
			'status' => 'status',
		);
	}

	/**
	 * Get credentials configuration
	 *
	 * @return array
	 */
	public function get_credentials()
	{
		return array(
			'api_domain' => array(
				'label' => __('API Domain', 'quillcrm'),
				'type' => 'text',
				'description' => __('Your Pipedrive company domain (e.g., yourcompany.pipedrive.com)', 'quillcrm'),
				'placeholder' => 'yourcompany.pipedrive.com',
			),
			'api_token' => array(
				'label' => __('API Token', 'quillcrm'),
				'type' => 'text',
				'description' => __('Your Pipedrive API token from Settings > Personal preferences > API', 'quillcrm'),
			),
		);
	}

	/**
	 * Get Pipedrive API instance
	 *
	 * @throws Exception If API credentials are missing or invalid.
	 *
	 * @return API
	 */
	public function get_api()
	{
		if (empty($this->credentials['api_domain']) || empty($this->credentials['api_token'])) {
			throw new \Exception(__('Pipedrive API Domain and API Token are required.', 'quillcrm'));
		}

		$api_domain = trim($this->credentials['api_domain']);
		$api_token = trim($this->credentials['api_token']);

		// Clean up the domain - remove protocol and trailing slash
		$api_domain = preg_replace('/^https?:\/\//', '', $api_domain);
		$api_domain = rtrim($api_domain, '/');

		// Basic validation for domain format
		if (!preg_match('/^[a-zA-Z0-9.-]+\.(pipedrive\.com|pipedrivecdn\.com)$/', $api_domain)) {
			throw new \Exception(__('Pipedrive API Domain format appears to be invalid. Please use format: yourcompany.pipedrive.com', 'quillcrm'));
		}

		// Basic validation for API token
		if (strlen($api_token) < 30) {
			throw new \Exception(__('Pipedrive API Token appears to be invalid. Please verify your token.', 'quillcrm'));
		}

		return new API($api_domain, $api_token);
	}

	/**
	 * Get Pipedrive pipelines for mapping
	 *
	 * @return array
	 */
	public function get_pipelines()
	{
		try {
			$api = $this->get_api();
			$response = $api->get_pipelines();

			if (!$response['success']) {
				quillcrm_get_logger()->error(
					__('Pipedrive: Error fetching pipelines', 'quillcrm'),
					array(
						'code' => 'pipedrive_get_pipelines',
						'response' => $response,
					)
				);
				return array();
			}

			$options = array();
			foreach ($response['data']['data'] ?? array() as $pipeline) {
				$options[] = array(
					'key' => $pipeline['id'],
					'label' => $pipeline['name'],
				);
			}

			return $options;
		} catch (\Exception $e) {
			quillcrm_get_logger()->error(
				__('Pipedrive: Exception fetching pipelines', 'quillcrm'),
				array(
					'code' => 'pipedrive_get_pipelines_exception',
					'error' => $e->getMessage(),
				)
			);
			return array();
		}
	}

	/**
	 * Get Pipedrive stages for mapping
	 *
	 * @return array
	 */
	public function get_stages()
	{
		try {
			$api = $this->get_api();
			$response = $api->get_stages();

			if (!$response['success']) {
				quillcrm_get_logger()->error(
					__('Pipedrive: Error fetching stages', 'quillcrm'),
					array(
						'code' => 'pipedrive_get_stages',
						'response' => $response,
					)
				);
				return array();
			}

			$options = array();
			foreach ($response['data']['data'] ?? array() as $stage) {
				$options[] = array(
					'key' => $stage['id'],
					'label' => $stage['name'],
				);
			}

			return $options;
		} catch (\Exception $e) {
			quillcrm_get_logger()->error(
				__('Pipedrive: Exception fetching stages', 'quillcrm'),
				array(
					'code' => 'pipedrive_get_stages_exception',
					'error' => $e->getMessage(),
				)
			);
			return array();
		}
	}

	/**
	 * Get fields configuration for the importer
	 *
	 * @return array
	 */
	public function get_fields()
	{
		return array(
			'lists_mapping' => array(
				'type' => 'lists_mapping',
				'label' => __('Lists', 'quillcrm'),
				'description' => __('Map Pipedrive pipelines to QuillCRM lists', 'quillcrm'),
				'options' => $this->get_pipelines(),
			),
			'tags_mapping' => array(
				'type' => 'tags_mapping',
				'label' => __('Tags', 'quillcrm'),
				'description' => __('Map Pipedrive stages to QuillCRM tags', 'quillcrm'),
				'options' => $this->get_stages(),
			),
		);
	}
}
