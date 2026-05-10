<?php
/**
 * AI Provider
 *
 * Unified interface for AI provider communication. Extracted from
 * RestAiEmailBuilderController to support both the existing email builder
 * and the new AI Assistant with function calling.
 *
 * @since 1.5.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Campaigns\Ai;

use DoubleScale\Core\Settings\Settings;
use DoubleScale\Managers\MergeTagsManager;
use WP_Error;

/**
 * AiProvider class.
 *
 * @since 1.5.0
 */
class AiProvider {

	/**
	 * Provider name.
	 *
	 * @var string
	 */
	private string $provider;

	/**
	 * Model identifier.
	 *
	 * @var string
	 */
	private string $model;

	/**
	 * Api key.
	 *
	 * @var string
	 */
	private string $api_key;

	/**
	 * Base URL for custom providers.
	 *
	 * @var string
	 */
	private string $base_url;

	/**
	 * Constructor.
	 *
	 * @param string $provider Provider name.
	 * @param string $model    Model identifier.
	 * @param string $api_key  Api key (decrypted).
	 * @param string $base_url Base URL for custom providers.
	 */
	public function __construct( string $provider, string $model, string $api_key, string $base_url = '' ) {
		$this->provider = $provider;
		$this->model    = $model;
		$this->api_key  = $api_key;
		$this->base_url = $base_url;
	}

	/**
	 * Factory: create an AiProvider from the current plugin settings.
	 *
	 * @return self
	 */
	public static function from_settings(): self {
		$ai = Settings::get( 'ai', array() );

		$provider = sanitize_text_field( $ai['provider'] ?? '' );
		$model    = sanitize_text_field( $ai['model'] ?? '' );
		$api_key  = Settings::decrypt_value( $ai['api_key'] ?? '' );
		$base_url = sanitize_url( $ai['base_url'] ?? '' );

		if ( empty( $model ) ) {
			$model = self::get_default_model( $provider );
		}

		return new self( $provider, $model, $api_key, $base_url );
	}

	/**
	 * Get the provider name.
	 *
	 * @return string
	 */
	public function get_provider(): string {
		return $this->provider;
	}

	/**
	 * Get the model name.
	 *
	 * @return string
	 */
	public function get_model(): string {
		return $this->model;
	}

	/**
	 * Simple single-turn call (backward-compatible convenience wrapper).
	 *
	 * Used by RestAiEmailBuilderController after refactoring.
	 *
	 * @param string $system  System prompt.
	 * @param string $user    User prompt.
	 * @param array  $options Optional settings (json_mode, max_tokens, timeout).
	 * @return string|WP_Error Response text or error.
	 */
	public function call( string $system, string $user, array $options = [] ) {
		$messages = array(
			array( 'role' => 'system', 'content' => $system ),
			array( 'role' => 'user', 'content' => $user ),
		);

		return $this->chat( $messages, $options );
	}

	/**
	 * Multi-turn chat method. Used by the AI Assistant orchestration loop.
	 *
	 * @param array $messages Full message history (system/user/assistant/tool messages).
	 * @param array $options  {
	 *     @type array  $tools       Tool definitions (provider-specific format).
	 *     @type string $tool_choice 'auto' | 'none' | specific tool name.
	 *     @type bool   $json_mode   Request JSON response format.
	 *     @type int    $max_tokens  Max tokens for response.
	 *     @type int    $timeout     Request timeout in seconds.
	 * }
	 * @return array|string|WP_Error Full response array (when tools present) or text string.
	 */
	public function chat( array $messages, array $options = [] ) {
		$json_mode  = $options['json_mode'] ?? false;
		$max_tokens = $options['max_tokens'] ?? 4096;
		$timeout    = $options['timeout'] ?? 120;
		$tools      = $options['tools'] ?? array();
		$tool_choice = $options['tool_choice'] ?? 'auto';

		switch ( $this->provider ) {
			case 'openai':
				return $this->call_openai( $messages, $json_mode, $max_tokens, $timeout, $tools, $tool_choice );
			case 'anthropic':
				return $this->call_anthropic( $messages, $max_tokens, $timeout, $tools, $tool_choice );
			case 'gemini':
				return $this->call_gemini( $messages, $max_tokens, $timeout, $tools, $tool_choice );
			case 'custom':
				if ( empty( $this->base_url ) ) {
					return new WP_Error(
						'missing_base_url',
						__( 'A Base URL is required for custom/compatible providers.', 'doublescale'),
						array( 'status' => 400 )
					);
				}
				return $this->call_openai_compatible( $messages, $json_mode, $max_tokens, $timeout, $tools, $tool_choice );
			default:
				return new WP_Error(
					'invalid_provider',
					__( 'Invalid AI provider configured.', 'doublescale'),
					array( 'status' => 400 )
				);
		}
	}

	/**
	 * Call OpenAI Api.
	 *
	 * @param array  $messages   Message history.
	 * @param bool   $json_mode  Whether to request JSON response format.
	 * @param int    $max_tokens Max tokens.
	 * @param int    $timeout    Request timeout.
	 * @param array  $tools      Tool definitions.
	 * @param string $tool_choice Tool choice mode.
	 * @return array|string|WP_Error
	 */
	private function call_openai( array $messages, bool $json_mode = false, int $max_tokens = 4096, int $timeout = 120, array $tools = array(), string $tool_choice = 'auto' ) {
		// Reasoning models (gpt-5, o1, o3) use max_completion_tokens which covers
		// both internal reasoning AND visible output. Non-reasoning models use
		// max_tokens which only counts output.
		$is_reasoning = (bool) preg_match( '/^(gpt-5|o[1-9])/', $this->model );
		$token_key    = $is_reasoning ? 'max_completion_tokens' : 'max_tokens';
		$token_budget = $is_reasoning ? max( $max_tokens * 4, 32768 ) : $max_tokens;

		$body = array(
			'model'    => $this->model,
			'messages' => $messages,
			$token_key => $token_budget,
		);

		if ( $json_mode ) {
			$body['response_format'] = array( 'type' => 'json_object' );
		}

		if ( ! empty( $tools ) ) {
			$body['tools'] = $tools;
			if ( 'none' === $tool_choice ) {
				$body['tool_choice'] = 'none';
			}
		}

		$response = wp_remote_post(
			'https://api.openai.com/v1/chat/completions',
			array(
				'timeout' => $timeout,
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $this->api_key,
				),
				'body'    => wp_json_encode( $body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'ai_request_failed',
				sprintf( __( 'AI request failed: %s', 'doublescale'), $response->get_error_message() ),
				array( 'status' => 502 )
			);
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			$error_msg = $body['error']['message'] ?? __( 'Unknown error from OpenAI', 'doublescale');
			return new WP_Error(
				'ai_api_error',
				sprintf( __( 'OpenAI Api error: %s', 'doublescale'), $error_msg ),
				array( 'status' => $code )
			);
		}

		// When tools are present, return the full response for tool call inspection.
		if ( ! empty( $tools ) ) {
			return $body;
		}

		return $body['choices'][0]['message']['content'] ?? '';
	}

	/**
	 * Call any OpenAI-compatible Api (OpenRouter, Ollama, LM Studio, Groq, etc.).
	 *
	 * @param array  $messages   Message history.
	 * @param bool   $json_mode  Whether to request JSON response format.
	 * @param int    $max_tokens Max tokens.
	 * @param int    $timeout    Request timeout.
	 * @param array  $tools      Tool definitions.
	 * @param string $tool_choice Tool choice mode.
	 * @return array|string|WP_Error
	 */
	private function call_openai_compatible( array $messages, bool $json_mode = false, int $max_tokens = 4096, int $timeout = 120, array $tools = array(), string $tool_choice = 'auto' ) {
		$base_url = rtrim( $this->base_url, '/' );
		$endpoint = $base_url . '/chat/completions';

		$headers = array(
			'Content-Type' => 'application/json',
		);

		if ( ! empty( $this->api_key ) ) {
			$headers['Authorization'] = 'Bearer ' . $this->api_key;
		}

		// OpenRouter requires HTTP-Referer and X-Title headers.
		if ( strpos( $base_url, 'openrouter.ai' ) !== false ) {
			$headers['HTTP-Referer'] = home_url();
			$headers['X-Title']      = get_bloginfo( 'name' );
		}

		$body = array(
			'model'      => $this->model,
			'messages'   => $messages,
			'max_tokens' => $max_tokens,
		);

		if ( $json_mode ) {
			$body['response_format'] = array( 'type' => 'json_object' );
		}

		if ( ! empty( $tools ) ) {
			$body['tools'] = $tools;
			if ( 'none' === $tool_choice ) {
				$body['tool_choice'] = 'none';
			}
		}

		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => $timeout,
				'headers' => $headers,
				'body'    => wp_json_encode( $body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'ai_request_failed',
				sprintf( __( 'AI request failed: %s', 'doublescale'), $response->get_error_message() ),
				array( 'status' => 502 )
			);
		}

		$code   = wp_remote_retrieve_response_code( $response );
		$parsed = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			$error_msg = $parsed['error']['message'] ?? __( 'Unknown error from AI provider', 'doublescale');
			return new WP_Error(
				'ai_api_error',
				sprintf( __( 'AI provider error: %s', 'doublescale'), $error_msg ),
				array( 'status' => $code )
			);
		}

		if ( ! empty( $tools ) ) {
			return $parsed;
		}

		return $parsed['choices'][0]['message']['content'] ?? '';
	}

	/**
	 * Call Anthropic (Claude) Api.
	 *
	 * @param array  $messages   Message history.
	 * @param int    $max_tokens Max tokens.
	 * @param int    $timeout    Request timeout.
	 * @param array  $tools      Tool definitions.
	 * @param string $tool_choice Tool choice mode.
	 * @return array|string|WP_Error
	 */
	private function call_anthropic( array $messages, int $max_tokens = 4096, int $timeout = 120, array $tools = array(), string $tool_choice = 'auto' ) {
		// Anthropic separates system from messages. Extract system messages.
		$system_parts    = array();
		$anthropic_msgs  = array();

		foreach ( $messages as $msg ) {
			if ( 'system' === $msg['role'] ) {
				$system_parts[] = $msg['content'];
			} elseif ( 'tool' === $msg['role'] ) {
				// Anthropic uses tool_result content blocks inside the user turn.
				$anthropic_msgs[] = array(
					'role'    => 'user',
					'content' => array(
						array(
							'type'        => 'tool_result',
							'tool_use_id' => $msg['tool_call_id'] ?? '',
							'content'     => is_string( $msg['content'] ) ? $msg['content'] : wp_json_encode( $msg['content'] ),
						),
					),
				);
			} elseif ( 'assistant' === $msg['role'] && isset( $msg['tool_calls'] ) ) {
				// Convert OpenAI-style tool_calls to Anthropic content blocks.
				$content_blocks = array();
				if ( ! empty( $msg['content'] ) ) {
					$content_blocks[] = array(
						'type' => 'text',
						'text' => $msg['content'],
					);
				}
				foreach ( $msg['tool_calls'] as $tc ) {
					$content_blocks[] = array(
						'type'  => 'tool_use',
						'id'    => $tc['id'],
						'name'  => $tc['function']['name'],
						'input' => json_decode( $tc['function']['arguments'], true ) ?? array(),
					);
				}
				$anthropic_msgs[] = array(
					'role'    => 'assistant',
					'content' => $content_blocks,
				);
			} else {
				$anthropic_msgs[] = array(
					'role'    => $msg['role'],
					'content' => $msg['content'],
				);
			}
		}

		$system = implode( "\n\n", $system_parts );

		$request_body = array(
			'model'      => $this->model,
			'max_tokens' => $max_tokens,
			'messages'   => $anthropic_msgs,
		);

		if ( ! empty( $system ) ) {
			$request_body['system'] = $system;
		}

		if ( ! empty( $tools ) ) {
			$request_body['tools'] = $tools;
			if ( 'none' === $tool_choice ) {
				$request_body['tool_choice'] = array( 'type' => 'none' );
			} else {
				$request_body['tool_choice'] = array( 'type' => 'auto' );
			}
		}

		$response = wp_remote_post(
			'https://api.anthropic.com/v1/messages',
			array(
				'timeout' => $timeout,
				'headers' => array(
					'Content-Type'      => 'application/json',
					'x-api-key'         => $this->api_key,
					'anthropic-version' => '2023-06-01',
				),
				'body'    => wp_json_encode( $request_body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'ai_request_failed',
				sprintf( __( 'AI request failed: %s', 'doublescale'), $response->get_error_message() ),
				array( 'status' => 502 )
			);
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			$error_msg = $body['error']['message'] ?? __( 'Unknown error from Anthropic', 'doublescale');
			return new WP_Error(
				'ai_api_error',
				sprintf( __( 'Anthropic Api error: %s', 'doublescale'), $error_msg ),
				array( 'status' => $code )
			);
		}

		if ( ! empty( $tools ) ) {
			return $body;
		}

		return $body['content'][0]['text'] ?? '';
	}

	/**
	 * Call Google Gemini Api.
	 *
	 * @param array  $messages   Message history.
	 * @param int    $max_tokens Max tokens.
	 * @param int    $timeout    Request timeout.
	 * @param array  $tools      Tool definitions.
	 * @param string $tool_choice Tool choice mode.
	 * @return array|string|WP_Error
	 */
	private function call_gemini( array $messages, int $max_tokens = 4096, int $timeout = 120, array $tools = array(), string $tool_choice = 'auto' ) {
		$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $this->model . ':generateContent?key=' . $this->api_key;

		// Build Gemini-format messages.
		$system_instruction = '';
		$contents           = array();

		foreach ( $messages as $msg ) {
			if ( 'system' === $msg['role'] ) {
				$system_instruction .= $msg['content'] . "\n";
			} elseif ( 'assistant' === $msg['role'] ) {
				if ( isset( $msg['tool_calls'] ) ) {
					$parts = array();
					foreach ( $msg['tool_calls'] as $tc ) {
						$parts[] = array(
							'functionCall' => array(
								'name' => $tc['function']['name'],
								'args' => json_decode( $tc['function']['arguments'], true ) ?? array(),
							),
						);
					}
					$contents[] = array( 'role' => 'model', 'parts' => $parts );
				} else {
					$contents[] = array(
						'role'  => 'model',
						'parts' => array( array( 'text' => $msg['content'] ) ),
					);
				}
			} elseif ( 'tool' === $msg['role'] ) {
				$contents[] = array(
					'role'  => 'function',
					'parts' => array(
						array(
							'functionResponse' => array(
								'name'     => $msg['name'] ?? '',
								'response' => json_decode( $msg['content'], true ) ?? array( 'result' => $msg['content'] ),
							),
						),
					),
				);
			} else {
				$contents[] = array(
					'role'  => 'user',
					'parts' => array( array( 'text' => $msg['content'] ) ),
				);
			}
		}

		$request_body = array(
			'contents'         => $contents,
			'generationConfig' => array(
				'maxOutputTokens' => $max_tokens,
			),
		);

		if ( ! empty( trim( $system_instruction ) ) ) {
			$request_body['system_instruction'] = array(
				'parts' => array( array( 'text' => trim( $system_instruction ) ) ),
			);
		}

		if ( ! empty( $tools ) ) {
			$request_body['tools'] = $tools;
			if ( 'none' === $tool_choice ) {
				$request_body['tool_config'] = array(
					'function_calling_config' => array( 'mode' => 'NONE' ),
				);
			} else {
				$request_body['tool_config'] = array(
					'function_calling_config' => array( 'mode' => 'AUTO' ),
				);
			}
		}

		$response = wp_remote_post(
			$url,
			array(
				'timeout' => $timeout,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode( $request_body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'ai_request_failed',
				sprintf( __( 'AI request failed: %s', 'doublescale'), $response->get_error_message() ),
				array( 'status' => 502 )
			);
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			$error_msg = $body['error']['message'] ?? __( 'Unknown error from Gemini', 'doublescale');
			return new WP_Error(
				'ai_api_error',
				sprintf( __( 'Gemini Api error: %s', 'doublescale'), $error_msg ),
				array( 'status' => $code )
			);
		}

		if ( ! empty( $tools ) ) {
			return $body;
		}

		return $body['candidates'][0]['content']['parts'][0]['text'] ?? '';
	}

	/**
	 * Fetch available models from the provider's Api.
	 *
	 * @param string $provider Provider name (use override instead of $this->provider for settings preview).
	 * @param string $api_key  Api key (use override for settings preview).
	 * @param string $base_url Base URL override.
	 * @return array|WP_Error List of { value, label } model objects.
	 */
	public static function fetch_models( string $provider, string $api_key, string $base_url = '' ) {
		switch ( $provider ) {
			case 'openai':
				return self::fetch_openai_models( $api_key );
			case 'anthropic':
				return self::fetch_anthropic_models( $api_key );
			case 'gemini':
				return self::fetch_gemini_models( $api_key );
			case 'custom':
				return self::fetch_custom_models( $api_key, $base_url );
			default:
				return new WP_Error( 'invalid_provider', __( 'Invalid provider.', 'doublescale'), array( 'status' => 400 ) );
		}
	}

	/**
	 * Fetch available GPT models from OpenAI.
	 *
	 * @param string $api_key Api key.
	 * @return array|WP_Error
	 */
	private static function fetch_openai_models( string $api_key ) {
		$response = wp_remote_get(
			'https://api.openai.com/v1/models',
			array(
				'timeout' => 15,
				'headers' => array( 'Authorization' => 'Bearer ' . $api_key ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'fetch_failed', $response->get_error_message(), array( 'status' => 502 ) );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			return new WP_Error(
				'openai_error',
				$body['error']['message'] ?? __( 'Failed to fetch OpenAI models.', 'doublescale'),
				array( 'status' => $code )
			);
		}

		$models = array();
		foreach ( $body['data'] ?? array() as $model ) {
			$id = $model['id'] ?? '';
			if ( ! preg_match( '/^gpt-(4o(-mini)?|4\.1(-mini|-nano)?|5(\.\d+)?(-mini)?)$/', $id ) ) {
				continue;
			}
			$models[] = array(
				'value' => $id,
				'label' => $id,
			);
		}

		usort(
			$models,
			function ( $a, $b ) {
				return strcmp( $b['value'], $a['value'] );
			}
		);

		return $models;
	}

	/**
	 * Return Anthropic Claude models.
	 *
	 * @param string $api_key Api key.
	 * @return array|WP_Error
	 */
	private static function fetch_anthropic_models( string $api_key ) {
		$response = wp_remote_get(
			'https://api.anthropic.com/v1/models',
			array(
				'timeout' => 15,
				'headers' => array(
					'x-api-key'         => $api_key,
					'anthropic-version' => '2023-06-01',
					'anthropic-beta'    => 'models-list-2025-02-19',
				),
			)
		);

		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$body   = json_decode( wp_remote_retrieve_body( $response ), true );
			$models = array();
			foreach ( $body['data'] ?? array() as $model ) {
				$id = $model['id'] ?? '';
				if ( strpos( $id, 'claude' ) === 0 ) {
					$models[] = array(
						'value' => $id,
						'label' => $model['display_name'] ?? $id,
					);
				}
			}
			if ( ! empty( $models ) ) {
				return $models;
			}
		}

		// Fallback to well-known current models.
		return array(
			array( 'value' => 'claude-opus-4-6', 'label' => 'Claude Opus 4.6' ),
			array( 'value' => 'claude-sonnet-4-6', 'label' => 'Claude Sonnet 4.6' ),
			array( 'value' => 'claude-haiku-4-5-20251001', 'label' => 'Claude Haiku 4.5' ),
		);
	}

	/**
	 * Fetch available Gemini models from Google.
	 *
	 * @param string $api_key Api key.
	 * @return array|WP_Error
	 */
	private static function fetch_gemini_models( string $api_key ) {
		$url = add_query_arg( 'key', $api_key, 'https://generativelanguage.googleapis.com/v1beta/models' );

		$response = wp_remote_get( $url, array( 'timeout' => 15 ) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'fetch_failed', $response->get_error_message(), array( 'status' => 502 ) );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			return new WP_Error(
				'gemini_error',
				$body['error']['message'] ?? __( 'Failed to fetch Gemini models.', 'doublescale'),
				array( 'status' => $code )
			);
		}

		$models = array();
		foreach ( $body['models'] ?? array() as $model ) {
			if ( ! in_array( 'generateContent', $model['supportedGenerationMethods'] ?? array(), true ) ) {
				continue;
			}

			$id = str_replace( 'models/', '', $model['name'] ?? '' );

			if ( preg_match( '/tts|image|robotics|computer.use|research|banana|nano/', $id ) ) {
				continue;
			}
			if ( strpos( $id, 'gemma' ) === 0 ) {
				continue;
			}

			$models[] = array(
				'value' => $id,
				'label' => $model['displayName'] ?? $id,
			);
		}

		return $models;
	}

	/**
	 * Fetch models from any OpenAI-compatible /v1/models endpoint.
	 *
	 * @param string $api_key  Api key.
	 * @param string $base_url Base URL.
	 * @return array|WP_Error
	 */
	private static function fetch_custom_models( string $api_key, string $base_url ) {
		$base_url = rtrim( $base_url, '/' );
		$endpoint = $base_url . '/models';

		$headers = array();
		if ( ! empty( $api_key ) ) {
			$headers['Authorization'] = 'Bearer ' . $api_key;
		}

		$response = wp_remote_get(
			$endpoint,
			array(
				'timeout' => 15,
				'headers' => $headers,
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'fetch_failed',
				sprintf( __( 'Could not reach %s. Is the server running?', 'doublescale'), $base_url ),
				array( 'status' => 502 )
			);
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code ) {
			return new WP_Error(
				'provider_error',
				$body['error']['message'] ?? __( 'Failed to fetch models from the provider.', 'doublescale'),
				array( 'status' => $code )
			);
		}

		$models = array();
		foreach ( $body['data'] ?? array() as $model ) {
			$id = $model['id'] ?? '';
			if ( empty( $id ) ) {
				continue;
			}
			$models[] = array(
				'value' => $id,
				'label' => $model['name'] ?? $id,
			);
		}

		usort(
			$models,
			function ( $a, $b ) {
				return strcmp( $a['value'], $b['value'] );
			}
		);

		return $models;
	}

	/**
	 * Get default model for a provider.
	 *
	 * @param string $provider Provider name.
	 * @return string
	 */
	public static function get_default_model( string $provider ): string {
		$defaults = array(
			'openai'    => 'gpt-4.1-mini',
			'anthropic' => 'claude-haiku-4-5-20251001',
			'gemini'    => 'gemini-2.5-flash-lite',
		);

		return $defaults[ $provider ] ?? 'gpt-4.1-mini';
	}

	/**
	 * Build merge tag instructions for AI prompts.
	 *
	 * @return string
	 */
	public static function get_merge_tags_for_prompt(): string {
		$manager = MergeTagsManager::instance();
		$groups  = $manager->get_groups();

		$allowed_groups = array( 'contact', 'general' );

		$lines = array();
		foreach ( $allowed_groups as $group_key ) {
			if ( ! isset( $groups[ $group_key ] ) ) {
				continue;
			}
			$group = $groups[ $group_key ];
			if ( ! empty( $group['is_disabled'] ) ) {
				continue;
			}
			if ( empty( $group['mergeTags'] ) ) {
				continue;
			}
			foreach ( $group['mergeTags'] as $tag ) {
				if ( ! empty( $tag['required_triggers'] ) ) {
					continue;
				}
				$lines[] = "  {$tag['value']} - {$tag['name']}";
			}
		}

		if ( empty( $lines ) ) {
			return '';
		}

		return "\n\nAvailable merge tags for personalization (use exactly as shown):\n" . implode( "\n", $lines );
	}
}
