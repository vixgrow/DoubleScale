<?php
/**
 * JSON-RPC envelope shapes for the MCP endpoint.
 *
 * The wire format is fixed by the spec, and a client rejects anything that
 * deviates — these pin the shapes so a refactor cannot quietly reshape them.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\Mcp\JsonRpc;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class McpJsonRpcTest extends TestCase {

	public function test_result_echoes_the_request_id(): void {
		$out = JsonRpc::result( 7, array( 'ok' => true ) );

		$this->assertSame( '2.0', $out['jsonrpc'] );
		$this->assertSame( 7, $out['id'] );
		$this->assertSame( array( 'ok' => true ), $out['result'] );
		$this->assertArrayNotHasKey( 'error', $out );
	}

	public function test_error_carries_code_and_message(): void {
		$out = JsonRpc::error( 3, JsonRpc::METHOD_NOT_FOUND, 'Method not found: x' );

		$this->assertSame( 3, $out['id'] );
		$this->assertSame( -32601, $out['error']['code'] );
		$this->assertSame( 'Method not found: x', $out['error']['message'] );
		$this->assertArrayNotHasKey( 'result', $out );
		$this->assertArrayNotHasKey( 'data', $out['error'] );
	}

	public function test_error_codes_match_the_json_rpc_spec(): void {
		$this->assertSame( -32700, JsonRpc::PARSE_ERROR );
		$this->assertSame( -32600, JsonRpc::INVALID_REQUEST );
		$this->assertSame( -32601, JsonRpc::METHOD_NOT_FOUND );
		$this->assertSame( -32602, JsonRpc::INVALID_PARAMS );
		$this->assertSame( -32603, JsonRpc::INTERNAL_ERROR );
	}

	/**
	 * MCP requires tool output inside a content array. Structured data is
	 * additionally surfaced as structuredContent for clients that parse it.
	 */
	public function test_tool_result_wraps_arrays_as_text_and_structured(): void {
		$out = JsonRpc::tool_result( array( 'total' => 14 ) );

		$this->assertFalse( $out['isError'] );
		$this->assertSame( 'text', $out['content'][0]['type'] );
		$this->assertStringContainsString( '"total": 14', $out['content'][0]['text'] );
		$this->assertSame( array( 'total' => 14 ), $out['structuredContent'] );
	}

	public function test_tool_result_leaves_plain_strings_alone(): void {
		$out = JsonRpc::tool_result( 'hello' );

		$this->assertSame( 'hello', $out['content'][0]['text'] );
		// A bare string is not structured data.
		$this->assertArrayNotHasKey( 'structuredContent', $out );
	}

	/**
	 * A failing tool must report isError so the agent treats it as a failure
	 * rather than reading the error text as data — and it must NOT be echoed
	 * as structuredContent, which would look like a successful payload.
	 */
	public function test_tool_result_flags_errors_without_structured_content(): void {
		$out = JsonRpc::tool_result( array( 'error' => 'nope' ), true );

		$this->assertTrue( $out['isError'] );
		$this->assertArrayNotHasKey( 'structuredContent', $out );
		$this->assertStringContainsString( 'nope', $out['content'][0]['text'] );
	}
}
