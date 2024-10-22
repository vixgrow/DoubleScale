<?php
/**
 * Class Slack Remote Data
 *
 * This class is responsible for handling the Slack Remote Data
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Integrations\Slack;

use QuillCRM\Abstracts\Integration_Remote_Data;

/**
 * Slack Remote Data class
 */
class Remote_Data extends Integration_Remote_Data {

	/**
	 * Entities.
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $entities = array(
		'user'          => array(
			'callback' => 'fetch_user',
		),
		'conversations' => array(
			'callback' => 'fetch_conversations',
		),
	);

	/**
	 * Fetch user.
	 *
	 * @param string $user_id User ID.
	 * @return array
	 */
	public function fetch_user( $user_id ) {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}
		$response = $api->get_user( $user_id );

		return $response;
	}

	/**
	 * Fetch conversations.
	 *
	 * @return array
	 */
	public function fetch_conversations() {
		/** @var API $api */
		$api = $this->integration->connect();
		if ( ! $api ) {
			return array();
		}

		$cursor = null;

		$response = $api->get_conversations(
			array(
				'cursor' => $cursor,
				'limit'  => 200,
				'types'  => 'public_channel,private_channel,mpim,im',
			)
		);
		$result   = array();

		if ( ! $response['success'] ) {
			return $result;
		}

		foreach ( $response['data']['channels'] as $channel ) {
			if ( ! isset( $channel['name'] ) ) {
				continue;
			}

			$result[] = array(
				'value' => $channel['id'],
				'label' => $channel['name'],
			);
		}

		return $result;
	}
}
