<?php
/**
 * Ability names and MCP tool names obey conflicting rules.
 *
 * WordPress core REQUIRES exactly one forward slash in an ability name; MCP
 * clients reject that character outright — Claude Desktop reported "13 tools
 * with unsupported names" and exposed none of them. These pin the translation
 * so the two namespaces cannot drift back into conflict.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityContext;
use DoubleScale\Core\Abilities\Mcp\Endpoint;
use DoubleScale\Modules\Contacts\Abilities\ContactAbilities;
use DoubleScale\Modules\Documents\Abilities\DocumentAbilities;
use DoubleScale\Modules\Support\Abilities\SupportAbilities;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class McpToolNameTest extends TestCase {

	/**
	 * The shape MCP clients accept: alphanumerics, underscore, dash. No slash.
	 */
	private const MCP_NAME_PATTERN = '#^[a-zA-Z0-9_-]{1,64}$#';

	/**
	 * @return array<string, array{0: string}>
	 */
	public function ability_name_provider(): array {
		$names = array_merge(
			array_keys( AbilityContext::definitions() ),
			array_keys( ContactAbilities::definitions() ),
			array_keys( DocumentAbilities::definitions() ),
			array_keys( SupportAbilities::definitions() )
		);

		$out = array();
		foreach ( $names as $name ) {
			$out[ $name ] = array( (string) $name );
		}
		return $out;
	}

	/**
	 * @dataProvider ability_name_provider
	 *
	 * @param string $ability_name Ability name.
	 */
	public function test_every_published_tool_name_is_client_legal( string $ability_name ): void {
		$tool_name = Endpoint::to_tool_name( $ability_name );

		$this->assertMatchesRegularExpression(
			self::MCP_NAME_PATTERN,
			$tool_name,
			$tool_name . ' contains a character MCP clients reject; the tool would be silently dropped.'
		);
		$this->assertStringNotContainsString( '/', $tool_name );
	}

	/**
	 * A client calls the dashed name it was advertised, but the WordPress
	 * registry is keyed by the slashed one — the round trip must be exact or
	 * every call 404s.
	 *
	 * @dataProvider ability_name_provider
	 *
	 * @param string $ability_name Ability name.
	 */
	public function test_tool_name_round_trips_back_to_the_ability( string $ability_name ): void {
		$this->assertSame(
			$ability_name,
			Endpoint::to_ability_name( Endpoint::to_tool_name( $ability_name ) )
		);
	}

	/**
	 * Only the first dash is the namespace separator. Restoring a later one
	 * would turn get-ticket-thread into an unresolvable name.
	 */
	public function test_only_the_namespace_dash_becomes_a_slash(): void {
		$this->assertSame(
			'doublescale/get-ticket-thread',
			Endpoint::to_ability_name( 'doublescale-get-ticket-thread' )
		);
		$this->assertSame(
			'doublescale/list-contact-segments',
			Endpoint::to_ability_name( 'doublescale-list-contact-segments' )
		);
	}

	/**
	 * A client that read the slashed name from the WP REST API should still be
	 * able to call it.
	 */
	public function test_slashed_names_are_accepted_unchanged(): void {
		$this->assertSame(
			'doublescale/get-context',
			Endpoint::to_ability_name( 'doublescale/get-context' )
		);
	}

	/**
	 * Foreign names must survive untouched so the namespace check downstream
	 * still rejects them rather than accidentally rewriting them into ours.
	 */
	public function test_foreign_names_are_left_alone(): void {
		$this->assertSame( 'core-get-site-info', Endpoint::to_ability_name( 'core-get-site-info' ) );
		$this->assertSame( 'other/thing', Endpoint::to_ability_name( 'other/thing' ) );
	}
}
