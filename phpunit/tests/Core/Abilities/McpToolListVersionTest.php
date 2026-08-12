<?php
/**
 * Tool-list fingerprinting.
 *
 * MCP clients fetch tools/list once and cache it. When the published set later
 * changes — a module toggled, a plugin update — the cached list goes stale and
 * the failure is silent: the client reports the tool as non-existent WITHOUT
 * sending a request, so nothing appears in server logs.
 *
 * This happened in practice: a session connected at 13 tools, 21 more were
 * added, and the session reported all 21 as unavailable and concluded the
 * owning modules were disabled. They were not.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\Mcp\ToolListVersion;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class McpToolListVersionTest extends TestCase {

	/**
	 * An empty presented version means "client never recorded one" — that is
	 * not evidence of staleness and must not be reported as such.
	 */
	public function test_absent_version_is_not_stale(): void {
		$this->assertFalse( ToolListVersion::is_stale( '' ) );
		$this->assertFalse( ToolListVersion::is_stale( '   ' ) );
	}

	public function test_current_version_is_not_stale(): void {
		$this->assertFalse( ToolListVersion::is_stale( ToolListVersion::current() ) );
	}

	public function test_a_different_version_is_stale(): void {
		$this->assertTrue( ToolListVersion::is_stale( 'deadbeef0000' ) );
	}

	/**
	 * The fingerprint has to be stable across calls, or every response would
	 * look like a change and a client would refetch forever.
	 */
	public function test_version_is_stable_between_calls(): void {
		$this->assertSame( ToolListVersion::current(), ToolListVersion::current() );
	}

	public function test_version_is_a_short_hex_fingerprint(): void {
		$this->assertMatchesRegularExpression( '/^[a-f0-9]{12}$/', ToolListVersion::current() );
	}

	/**
	 * Header names are the contract with the client; a rename silently breaks
	 * staleness detection on both sides.
	 */
	public function test_header_names_are_pinned(): void {
		$this->assertSame( 'X-DoubleScale-Tools-Version', ToolListVersion::RESPONSE_HEADER );
		$this->assertSame( 'x_doublescale_tools_version', ToolListVersion::REQUEST_HEADER );
	}
}
