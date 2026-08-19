<?php
/**
 * Handshake honesty: instructions, MCP annotation hints, and stale-tool meta.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityContext;
use DoubleScale\Core\Abilities\Mcp\Endpoint;
use DoubleScale\Core\Abilities\Mcp\ToolListVersion;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class McpEndpointHandshakeTest extends TestCase {

	public function test_initialize_does_not_claim_read_only_access(): void {
		$method = new \ReflectionMethod( Endpoint::class, 'initialize' );
		$method->setAccessible( true );
		$payload = $method->invoke( null );

		$instructions = strtolower( (string) $payload['instructions'] );

		$this->assertStringNotContainsString(
			'read-only access',
			$instructions,
			'Writes exist; telling the client the surface is read-only sends it down the wrong path.'
		);
		$this->assertStringContainsString( 'get-context', $instructions );
		$this->assertStringContainsString( 'x-doublescale-tools-version', $instructions );
	}

	public function test_annotations_default_readonly_and_publish_optional_hints(): void {
		$reads = Endpoint::annotations_for_mcp( array(), 'List contacts' );
		$this->assertTrue( $reads['readOnlyHint'] );
		$this->assertFalse( $reads['destructiveHint'] );
		$this->assertArrayNotHasKey( 'idempotentHint', $reads );
		$this->assertArrayNotHasKey( 'openWorldHint', $reads );

		$writes = Endpoint::annotations_for_mcp(
			array(
				'readonly'      => false,
				'destructive'   => false,
				'idempotent'    => false,
				'openWorldHint' => true,
			),
			'Send invoice'
		);

		$this->assertFalse( $writes['readOnlyHint'] );
		$this->assertFalse( $writes['idempotentHint'] );
		$this->assertTrue( $writes['openWorldHint'] );
	}

	public function test_stale_presented_version_is_flagged_in_meta(): void {
		$request = new class() extends \WP_REST_Request {
			/** @var array<string, string> */
			public $headers = array();

			public function get_header( $key ) {
				$lookup = strtolower( str_replace( '-', '_', (string) $key ) );
				foreach ( $this->headers as $name => $value ) {
					if ( strtolower( str_replace( '-', '_', (string) $name ) ) === $lookup ) {
						return $value;
					}
				}
				return null;
			}
		};
		$request->headers[ ToolListVersion::REQUEST_HEADER ] = 'deadbeef0000';

		$stamped = Endpoint::stamp_tools_meta( array( 'ok' => true ), $request );

		$this->assertTrue( $stamped['_meta']['toolsStale'] );
		$this->assertSame( ToolListVersion::current(), $stamped['_meta']['toolsVersion'] );
		$this->assertArrayHasKey( 'toolsRefresh', $stamped['_meta'] );
	}

	public function test_current_presented_version_is_not_stale(): void {
		$request = new class() extends \WP_REST_Request {
			/** @var array<string, string> */
			public $headers = array();

			public function get_header( $key ) {
				$lookup = strtolower( str_replace( '-', '_', (string) $key ) );
				foreach ( $this->headers as $name => $value ) {
					if ( strtolower( str_replace( '-', '_', (string) $name ) ) === $lookup ) {
						return $value;
					}
				}
				return null;
			}
		};
		$request->headers[ ToolListVersion::REQUEST_HEADER ] = ToolListVersion::current();

		$stamped = Endpoint::stamp_tools_meta( array(), $request );

		$this->assertFalse( $stamped['_meta']['toolsStale'] );
		$this->assertArrayNotHasKey( 'toolsRefresh', $stamped['_meta'] );
	}

	public function test_get_context_declares_an_output_schema(): void {
		$schema = AbilityContext::definitions()['doublescale/get-context']['output_schema'] ?? null;

		$this->assertIsArray( $schema );
		$this->assertSame( 'object', $schema['type'] ?? null );
	}
}
