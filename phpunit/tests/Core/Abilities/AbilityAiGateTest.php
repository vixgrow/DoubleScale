<?php
/**
 * The abilities layer must not require a configured AI provider.
 *
 * `has_ai_access()` answers two unrelated questions at once: is an AI provider
 * configured, and may this role use AI features. Outbound features need both —
 * DoubleScale is the one calling the provider. MCP needs only the second: an
 * external agent connects IN and reads CRM data, and nothing here calls a
 * provider at all.
 *
 * Merging them shipped a real outage: sites that never intended to use the
 * in-dashboard assistant published zero tools, and every client reported the
 * connection as failed rather than as unconfigured.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class AbilityAiGateTest extends TestCase {

	/**
	 * The composed permission callback is the single place every ability's
	 * gate runs, so this is the line that decides the whole layer.
	 */
	public function test_guard_uses_the_role_gate_not_the_provider_gate(): void {
		$source = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Core/Abilities/AbilityGuard.php'
		);

		$this->assertStringContainsString(
			'has_ai_role_access()',
			$source,
			'AbilityGuard must gate on the role half of AI access.'
		);

		// The negative half matters more: has_ai_access() would compile, pass
		// every other test, and silently publish nothing on an unconfigured
		// site.
		$this->assertDoesNotMatchRegularExpression(
			'/Permissions::has_ai_access\s*\(/',
			$source,
			'AbilityGuard calls has_ai_access(), which also demands a configured AI'
				. ' provider. Nothing in the abilities layer calls a provider, so this'
				. ' publishes zero tools on sites that do not use the in-dashboard'
				. ' assistant. Use has_ai_role_access().'
		);
	}

	/**
	 * The provider check must still exist for the features that genuinely make
	 * outbound calls — splitting it must not have removed it.
	 */
	public function test_provider_check_survives_for_outbound_features(): void {
		$source = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Core/UserRoles/Permissions.php'
		);

		$this->assertStringContainsString(
			'ai_not_configured',
			$source,
			'has_ai_access() must still refuse when no AI provider is configured.'
		);

		$this->assertStringContainsString(
			'function has_ai_role_access',
			$source,
			'The role-only gate must exist for the abilities layer to call.'
		);
	}

	/**
	 * The role gate is the half worth keeping: an administrator decides who may
	 * reach CRM data through an AI tool, and that answer is unrelated to
	 * whether a provider key is on file.
	 */
	public function test_role_gate_still_consults_allowed_roles(): void {
		$source = (string) file_get_contents(
			DOUBLESCALE_PLUGIN_DIR . 'includes/Core/UserRoles/Permissions.php'
		);

		$start = strpos( $source, 'function has_ai_role_access' );
		$this->assertNotFalse( $start );

		$body = substr( $source, $start, 2000 );

		$this->assertStringContainsString( 'allowed_roles', $body );
		$this->assertStringContainsString( 'ai_no_access', $body );
	}
}
