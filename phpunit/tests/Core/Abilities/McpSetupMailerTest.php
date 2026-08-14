<?php
/**
 * Emailing MCP setup instructions.
 *
 * The credential rule is the point of these tests: an API key never expires, so
 * a copy sitting in an inbox stays usable for as long as the inbox does. The
 * body must therefore contain the key ONLY when a caller explicitly passed one,
 * and must say plainly what that means when it does.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\Mcp\SetupMailer;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

defined( 'ABSPATH' ) || exit;

require_once dirname( __DIR__, 3 ) . '/RestApiEndpointTestStubs.php';

final class McpSetupMailerTest extends TestCase {

	private const SECRET = 'dsmcp_0123456789abcdef0123456789abcdef';

	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/Abilities/Mcp/SetupMailer.php';
	}

	/**
	 * Render a body without sending anything.
	 *
	 * @param string $secret Plaintext key, or ''.
	 * @return string
	 */
	private function body( string $secret ): string {
		$method = new ReflectionMethod( SetupMailer::class, 'body' );
		$method->setAccessible( true );

		$user = (object) array(
			'display_name' => 'Layla',
			'user_login'   => 'layla',
			'user_email'   => 'layla@example.com',
		);

		return (string) $method->invoke(
			null,
			$user,
			'Claude Desktop',
			'Windows',
			"{\n  \"mcpServers\": {}\n}",
			'claude_desktop_config.json',
			$secret
		);
	}

	/**
	 * The default path must never carry a working credential.
	 */
	public function test_body_omits_the_key_when_none_is_passed(): void {
		$body = $this->body( '' );

		$this->assertStringNotContainsString( self::SECRET, $body );
		$this->assertStringContainsString( 'Not included here on purpose', $body );
	}

	/**
	 * ...and must carry it when one is, or the opt-in silently does nothing.
	 */
	public function test_body_includes_the_key_when_passed(): void {
		$body = $this->body( self::SECRET );

		$this->assertStringContainsString( self::SECRET, $body );
	}

	/**
	 * A reader who is handed a permanent credential has to be told it is one —
	 * otherwise the email looks like any other setup mail and is kept forever.
	 */
	public function test_body_warns_when_it_carries_the_key(): void {
		$body = $this->body( self::SECRET );

		$this->assertStringContainsString( 'This key is a password', $body );
		$this->assertStringContainsString( 'delete this message', $body );
	}

	/**
	 * The configuration is escaped, not stripped: it is JSON or TOML and would
	 * be unusable if quotes or newlines were dropped.
	 */
	public function test_configuration_survives_escaping(): void {
		$body = $this->body( '' );

		$this->assertStringContainsString( 'mcpServers', $body );
		$this->assertStringContainsString( 'claude_desktop_config.json', $body );
	}

	/**
	 * The chosen client and OS must reach the reader — they are the whole
	 * reason the email is per-client rather than generic.
	 */
	public function test_body_names_the_client_and_os(): void {
		$body = $this->body( '' );

		$this->assertStringContainsString( 'Claude Desktop', $body );
		$this->assertStringContainsString( 'Windows', $body );
	}

	/**
	 * A site with no name must not produce a literal "[] Connect …".
	 */
	public function test_subject_drops_an_empty_site_prefix(): void {
		$method = new ReflectionMethod( SetupMailer::class, 'subject' );
		$method->setAccessible( true );

		$subject = (string) $method->invoke( null, 'Cursor' );

		$this->assertStringNotContainsString( '[]', $subject );
		$this->assertStringContainsString( 'Cursor', $subject );
	}
}
