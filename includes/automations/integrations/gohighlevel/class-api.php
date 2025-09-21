<?php
/**
 * Class GoHighLevel API
 *
 * This class is responsible for handling the GoHighLevel API
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\GoHighLevel;

use QuillCRM\Abstracts\Integration_API;

/**
 * GoHighLevel API class
 */
class API extends Integration_API
{

	/**
	 * API Token (Location API Key)
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $api_token;

	/**
	 * Location ID extracted from JWT token
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $location_id;

	/**
	 * Constructor
	 *
	 * @param string $api_token   GoHighLevel API Token
	 *
	 * @since 1.0.0
	 */
	public function __construct($api_token)
	{
		$this->endpoint = 'https://services.leadconnectorhq.com';
		$this->api_token = $api_token;
		$this->location_id = $this->extract_location_id_from_token($api_token);
	}

	/**
	 * Extract location ID from JWT token
	 *
	 * @param string $token JWT token
	 * @return string|null
	 */
	private function extract_location_id_from_token($token)
	{
		try {
			// JWT tokens have 3 parts separated by dots
			$parts = explode('.', $token);
			if (count($parts) !== 3) {
				return null;
			}

			// Decode the payload (second part)
			$payload = json_decode(base64_decode($parts[1]), true);
			
			// Extract authClassId which is the location ID
			return $payload['authClassId'] ?? null;
		} catch (\Exception $e) {
			error_log("GoHighLevel: Could not extract location ID from token: " . $e->getMessage());
			return null;
		}
	}

	/**
	 * Get all contacts from GoHighLevel with pagination
	 *
	 * @param int $limit       Number of contacts per page (max 100).
	 * @param string $startAfter   Timestamp for pagination.
	 * @param string $startAfterId Contact ID for pagination.
	 *
	 * @return array
	 */
	public function get_contacts_by_cursor($limit = 100, $startAfter = null, $startAfterId = null)
	{
		$params = array(
			'locationId' => $this->location_id,
			'limit' => min($limit, 100), // GoHighLevel max is 100
		);
		
		if ($startAfter && $startAfterId) {
			$params['startAfter'] = $startAfter;
			$params['startAfterId'] = $startAfterId;
		}
		
		return $this->get('contacts', $params);
	}

	/**
	 * Get contacts count
	 *
	 * @return array
	 */
	public function get_contacts_count()
	{
		// Get first page to determine total count
		return $this->get('contacts', array(
			'locationId' => $this->location_id,
			'limit' => 1,
		));
	}


	/**
	 * Get contact by email
	 *
	 * @param string $email Email address.
	 *
	 * @return array
	 */
	public function get_contact_by_email($email)
	{
		return $this->get('contacts/search', array(
			'locationId' => $this->location_id,
			'email' => $email,
		));
	}

	/**
	 * Create or update contact
	 *
	 * @param array $data Contact data.
	 *
	 * @return array
	 */
	public function create_or_update_contact($data)
	{
		$data['locationId'] = $this->location_id;
		return $this->post('contacts', $data);
	}

	/**
	 * Get accessible locations for debugging
	 *
	 * @return array
	 */
	public function get_locations()
	{
		return $this->get('locations');
	}

	/**
	 * Get user info to determine accessible locations
	 *
	 * @return array
	 */
	public function get_user_info()
	{
		return $this->get('users/me');
	}


	/**
	 * Send request to the GoHighLevel API
	 *
	 * @param string      $method HTTP method.
	 * @param string      $path   API path.
	 * @param string|null $body   Request body.
	 *
	 * @return array|WP_Error
	 */
	public function request_remote($method, $path, $body = null)
	{
		// GoHighLevel doesn't use version in URL, but in headers
		$url = "{$this->endpoint}/$path";
		
		// Debug log the request
		error_log("GoHighLevel API Request: $method $url");
		error_log("GoHighLevel API Token: " . substr($this->api_token, 0, 10) . "...");

		$response = wp_remote_request(
			$url,
			array(
				'method'  => $method,
				'body'    => $body,
				'headers' => array(
					'Accept'        => 'application/json',
					'Content-Type'  => 'application/json; charset=' . get_option('blog_charset'),
					'Authorization' => 'Bearer ' . $this->api_token,
					'Version'       => '2021-07-28',
					'Cache-Control' => 'no-cache',
				),
				'timeout' => 30,
			)
		);

		// Debug log the response
		if (is_wp_error($response)) {
			error_log("GoHighLevel API WP Error: " . $response->get_error_message());
		} else {
			$status_code = wp_remote_retrieve_response_code($response);
			$body = wp_remote_retrieve_body($response);
			error_log("GoHighLevel API Response Status: $status_code");
			if ($status_code !== 200) {
				error_log("GoHighLevel API Error Response: $body");
			}
		}

		return $response;
	}
}
