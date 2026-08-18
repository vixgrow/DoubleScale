<?php
/**
 * Shared harness for the hosted-checkout (redirect) gateways.
 *
 * Covers the chain the unit tests cannot reach: init → confirm → record_paid
 * and the webhook handlers, against a real database.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Modules\Documents\Constants\InvoiceStatus;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

/**
 * Base class for redirect gateway integration tests.
 */
abstract class RedirectGatewayTestCase extends IntegrationTestCase {

	/**
	 * Queued HTTP responses for the gateway API host.
	 *
	 * @var array<int, array{code?:int,body:mixed}>
	 */
	private $http_queue = array();

	/**
	 * Requests captured by the HTTP stub.
	 *
	 * @var array<int, array{url:string,args:array}>
	 */
	private $http_requests = array();

	/**
	 * @var callable|null
	 */
	private $http_filter = null;

	/**
	 * Class that must exist for the Pro gateway to be testable.
	 *
	 * @return string
	 */
	abstract protected function gateway_class(): string;

	/**
	 * Substring identifying this gateway's API host.
	 *
	 * @return string
	 */
	abstract protected function api_host(): string;

	/**
	 * Persist credentials so is_configured() returns true.
	 *
	 * @return void
	 */
	abstract protected function configure_gateway(): void;

	/**
	 * Option name holding this integration's settings.
	 *
	 * @return string
	 */
	abstract protected function settings_option(): string;

	protected function setUp(): void {
		parent::setUp();

		if ( ! $this->ensure_pro_loaded() ) {
			$this->markTestSkipped( 'Requires doublescale-pro.' );
		}

		$this->ensure_sales_module();
		\DoubleScale\Pro\Modules\Sales\PaymentGateways\Loader::register();

		$this->configure_gateway();
		$this->reset_integration_api_cache();
	}

	protected function tearDown(): void {
		$this->stop_http_stub();
		delete_option( $this->settings_option() );
		parent::tearDown();
	}

	/**
	 * The Integration singletons memoise their Api client, which would leak a
	 * stale client (and stale credentials) across tests.
	 *
	 * @return void
	 */
	protected function reset_integration_api_cache(): void {
		$integration = $this->integration_instance();
		if ( ! $integration ) {
			return;
		}

		$reflection = new \ReflectionObject( $integration );
		if ( $reflection->hasProperty( 'api' ) ) {
			$property = $reflection->getProperty( 'api' );
			$property->setAccessible( true );
			$property->setValue( $integration, null );
		}
	}

	/**
	 * @return object|null
	 */
	protected function integration_instance() {
		return null;
	}

	/**
	 * Queue HTTP responses for this gateway's API host.
	 *
	 * @param array<int, array{code?:int,body:mixed}> $responses Responses.
	 * @return void
	 */
	protected function queue_http( array $responses ): void {
		$this->http_queue = $responses;

		if ( null !== $this->http_filter ) {
			return;
		}

		$host = $this->api_host();

		$this->http_filter = function ( $pre, $args, $url ) use ( $host ) {
			if ( false === strpos( (string) $url, $host ) ) {
				return $pre;
			}

			$this->http_requests[] = array(
				'url'  => (string) $url,
				'args' => is_array( $args ) ? $args : array(),
			);

			$next = array_shift( $this->http_queue );
			if ( null === $next ) {
				return new \WP_Error( 'http_mock_exhausted', 'Unexpected HTTP request: ' . $url );
			}

			$body = $next['body'];
			if ( ! is_string( $body ) ) {
				$body = wp_json_encode( $body );
			}
			if ( ! empty( $next['bom'] ) ) {
				$body = "\xEF\xBB\xBF" . $body;
			}

			return array(
				'headers'  => array(),
				'body'     => $body,
				'response' => array(
					'code'    => (int) ( $next['code'] ?? 200 ),
					'message' => 'OK',
				),
			);
		};

		add_filter( 'pre_http_request', $this->http_filter, 10, 3 );
	}

	/**
	 * @return array<int, array{url:string,args:array}>
	 */
	protected function http_requests(): array {
		return $this->http_requests;
	}

	/**
	 * @param int $index Request index.
	 * @return array
	 */
	protected function http_request_body( int $index ): array {
		$request = $this->http_requests[ $index ] ?? null;
		if ( ! $request ) {
			return array();
		}
		$decoded = json_decode( (string) ( $request['args']['body'] ?? '' ), true );
		return is_array( $decoded ) ? $decoded : array();
	}

	/**
	 * @return void
	 */
	protected function stop_http_stub(): void {
		if ( null !== $this->http_filter ) {
			remove_filter( 'pre_http_request', $this->http_filter, 10 );
			$this->http_filter = null;
		}
		$this->http_queue    = array();
		$this->http_requests = array();
	}

	/**
	 * @return bool
	 */
	protected function ensure_pro_loaded(): bool {
		if ( class_exists( $this->gateway_class() ) ) {
			return true;
		}

		$pro_main = dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/doublescale-pro.php';
		if ( is_readable( $pro_main ) ) {
			require_once $pro_main;
		}

		return class_exists( $this->gateway_class() );
	}

	/**
	 * @param array<string, mixed> $overrides Invoice attributes.
	 * @return InvoiceModel
	 */
	protected function make_invoice( array $overrides = array() ): InvoiceModel {
		$contact_id = $this->make_contact();
		$defaults   = array(
			'contact_id'     => $contact_id,
			'status'         => InvoiceStatus::UNPAID,
			'currency'       => 'USD',
			'discount_type'  => 'none',
			'discount_value' => 0,
			'line_items'     => array(
				array(
					'qty'    => 1,
					'rate'   => 100,
					'amount' => 100,
				),
			),
			'invoice_date'   => current_time( 'Y-m-d' ),
			'due_date'       => gmdate( 'Y-m-d', strtotime( '+30 days' ) ),
		);

		$invoice = new InvoiceModel();
		$invoice->fill( array_merge( $defaults, $overrides ) );
		$invoice->save();

		return $invoice->fresh();
	}

	/**
	 * @return void
	 */
	protected function ensure_sales_module(): void {
		$modules = get_option( 'doublescale_enabled_modules', array() );
		if ( empty( $modules['sales'] ) ) {
			$modules['sales'] = true;
			update_option( 'doublescale_enabled_modules', $modules );
		}

		ModuleManager::activateModule( 'sales' );
	}
}
