<?php
/**
 * Integration tests for the MCP key routes after self-service was opened up.
 *
 * MCP key management used to be administrator-only. It now has two tiers:
 * `Permissions::can_manage_mcp()` still governs the endpoint toggle and the
 * site-wide key list, while `can_manage_own_mcp_key()` lets any user with a
 * DoubleScale role issue and revoke THEIR OWN key.
 *
 * Widening a route gate without scoping the handler behind it is how this
 * becomes a privilege escalation: `ApiKeyStore::list_for_display()` and
 * `delete()` are both site-wide, so a rep reaching those unscoped could
 * enumerate every key on the site and revoke a colleague's by id. The unit tests
 * in `phpunit/tests/Core/Abilities/McpKeyOwnerScopeTest.php` cover the store
 * functions; these cover the ROUTES, which is where the gate and the scoping
 * actually have to meet.
 *
 * @package DoubleScale\Tests\Integration\Core\Abilities
 */

namespace DoubleScale\Tests\Integration\Core\Abilities;

use DoubleScale\Core\Abilities\Mcp\ApiKeyStore;
use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class McpKeyRoutesTest extends IntegrationTestCase {

	/**
	 * Dispatch against the MCP routes.
	 *
	 * @param string               $method HTTP method.
	 * @param string               $path   Path after /doublescale/v1.
	 * @param array<string, mixed> $body   Body or query params.
	 * @param int|null             $user   Authenticated user.
	 * @return \WP_REST_Response
	 */
	private function mcp( string $method, string $path, array $body = array(), $user = null ) {
		return $this->dispatch_rest( $method, '/doublescale/v1/mcp' . $path, $body, $user );
	}

	/**
	 * A rep who may manage their own key but not the MCP surface.
	 *
	 * @return int
	 */
	private function make_rep(): int {
		return self::factory()->user->create( array( 'role' => UserRoles::SALES_REP ) );
	}

	/**
	 * A user with no DoubleScale role at all.
	 *
	 * @return int
	 */
	private function make_outsider(): int {
		return self::factory()->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * The point of the change: a rep can now obtain a key at all.
	 */
	public function test_rep_can_create_their_own_key(): void {
		$rep = $this->make_rep();

		$response = $this->mcp( 'POST', '/keys', array( 'label' => 'rep laptop' ), $rep );

		$this->assertSame( 201, $response->get_status(), 'A CRM role must be able to self-issue an MCP key.' );

		$data = $response->get_data();
		$this->assertSame( $rep, (int) $data['user_id'], 'A self-issued key must be bound to the caller.' );
		$this->assertNotEmpty( $data['key'] );
	}

	/**
	 * The create response carries an `api_keys` list for the UI to re-render
	 * from, and it must be scoped too. This was a real leak: creating your own
	 * key handed back every key on the site as a side effect, which the status
	 * route's scoping did nothing to prevent.
	 */
	public function test_create_response_does_not_leak_other_users_keys(): void {
		$rep   = $this->make_rep();
		$other = $this->make_rep();

		ApiKeyStore::create( 'theirs', $other );

		$response = $this->mcp( 'POST', '/keys', array( 'label' => 'mine' ), $rep );
		$this->assertSame( 201, $response->get_status() );

		$listed = $response->get_data()['api_keys'];

		$this->assertCount(
			1,
			$listed,
			'Creating a key must not return the whole site inventory to a non-administrator.'
		);
		$this->assertSame( $rep, (int) $listed[0]['user_id'] );
	}

	/**
	 * A key must act as its owner, never as whoever asked for it. A rep naming
	 * another user must be refused, or they could mint a key with wider reach
	 * than their own.
	 */
	public function test_rep_cannot_create_a_key_for_another_user(): void {
		$rep   = $this->make_rep();
		$other = $this->make_rep();

		$response = $this->mcp(
			'POST',
			'/keys',
			array(
				'label'   => 'not mine',
				'user_id' => $other,
			),
			$rep
		);

		$this->assertSame( 403, $response->get_status(), 'A rep must not issue a key on behalf of anyone else.' );
	}

	/**
	 * A roleless user would authenticate into zero tools, so the gate refuses
	 * rather than handing out a key that silently does nothing.
	 */
	public function test_user_without_a_doublescale_role_is_refused(): void {
		$outsider = $this->make_outsider();

		$response = $this->mcp( 'POST', '/keys', array( 'label' => 'nope' ), $outsider );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Unauthenticated callers get nothing.
	 */
	public function test_anonymous_caller_is_refused(): void {
		$response = $this->mcp( 'POST', '/keys', array( 'label' => 'nope' ) );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * THE escalation test: the status route must not hand a rep the whole site's
	 * key inventory. Labels and usernames alone map out who holds agent access.
	 */
	public function test_status_shows_a_rep_only_their_own_keys(): void {
		$rep   = $this->make_rep();
		$other = $this->make_rep();
		$admin = $this->make_admin_user();

		ApiKeyStore::create( 'mine', $rep );
		ApiKeyStore::create( 'theirs', $other );
		ApiKeyStore::create( 'admins', $admin );

		$response = $this->mcp( 'GET', '/status', array(), $rep );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertCount(
			1,
			$data['api_keys'],
			'A rep must see only their own keys, never the whole site inventory.'
		);
		$this->assertSame( $rep, (int) $data['api_keys'][0]['user_id'] );
		$this->assertFalse( $data['can_manage_mcp'], 'A rep must not be told they manage the MCP surface.' );
	}

	/**
	 * The administrator view is unchanged — they still see everything.
	 */
	public function test_status_shows_an_administrator_every_key(): void {
		$rep   = $this->make_rep();
		$admin = $this->make_admin_user();

		ApiKeyStore::create( 'reps', $rep );
		ApiKeyStore::create( 'admins', $admin );

		$response = $this->mcp( 'GET', '/status', array(), $admin );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertCount( 2, $data['api_keys'] );
		$this->assertTrue( $data['can_manage_mcp'] );
	}

	/**
	 * A rep must not be offered other users as key subjects — that list is the
	 * administrator's "issue on behalf of" control.
	 */
	public function test_rep_is_offered_no_eligible_key_subjects(): void {
		$rep = $this->make_rep();
		$this->make_rep();

		$response = $this->mcp( 'GET', '/status', array(), $rep );

		$this->assertSame( array(), $response->get_data()['eligible_key_users'] );
	}

	/**
	 * Revoking your own key works through the route.
	 */
	public function test_rep_can_revoke_their_own_key(): void {
		$rep     = $this->make_rep();
		$created = ApiKeyStore::create( 'mine', $rep );

		$response = $this->mcp( 'DELETE', '/keys/' . $created['id'], array(), $rep );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['deleted'] );
		$this->assertSame( array(), ApiKeyStore::list_for_user( $rep ) );
	}

	/**
	 * THE other escalation test: a rep must not revoke a colleague's key, and
	 * the key must survive the attempt.
	 */
	public function test_rep_cannot_revoke_another_users_key(): void {
		$rep    = $this->make_rep();
		$other  = $this->make_rep();
		$theirs = ApiKeyStore::create( 'theirs', $other );

		$response = $this->mcp( 'DELETE', '/keys/' . $theirs['id'], array(), $rep );

		$this->assertFalse(
			$response->get_data()['deleted'],
			'A rep must not be able to revoke another user’s key.'
		);

		$survivors = ApiKeyStore::list_for_user( $other );
		$this->assertCount( 1, $survivors, 'The refused revoke must leave the key in place.' );
		$this->assertSame( $theirs['id'], $survivors[0]['id'] );
	}

	/**
	 * An administrator may still revoke anyone's key.
	 */
	public function test_administrator_can_revoke_any_key(): void {
		$rep     = $this->make_rep();
		$admin   = $this->make_admin_user();
		$created = ApiKeyStore::create( 'reps', $rep );

		$response = $this->mcp( 'DELETE', '/keys/' . $created['id'], array(), $admin );

		$this->assertTrue( $response->get_data()['deleted'] );
		$this->assertSame( array(), ApiKeyStore::list_for_user( $rep ) );
	}

	/**
	 * The endpoint toggle stays administrator-only. This is the half of the old
	 * gate that must NOT have been widened.
	 */
	public function test_rep_cannot_toggle_the_mcp_endpoint(): void {
		$rep = $this->make_rep();

		$response = $this->mcp( 'POST', '/settings', array( 'enabled' => true ), $rep );

		$this->assertSame(
			403,
			$response->get_status(),
			'Enabling the site-wide MCP endpoint must remain an administrator decision.'
		);
	}

	/**
	 * An administrator can still toggle it, so the refusal above is not passing
	 * for an unrelated reason.
	 */
	public function test_administrator_can_toggle_the_mcp_endpoint(): void {
		$admin = $this->make_admin_user();

		$response = $this->mcp( 'POST', '/settings', array( 'enabled' => true ), $admin );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * The email route mails a live credential, so a rep must not be able to
	 * trigger it for a key they do not own. Reported as 404 rather than 403 on
	 * purpose: confirming that another user's key id is real is itself the leak.
	 */
	public function test_rep_cannot_email_setup_for_another_users_key(): void {
		$rep    = $this->make_rep();
		$other  = $this->make_rep();
		$theirs = ApiKeyStore::create( 'theirs', $other );

		$response = $this->mcp(
			'POST',
			'/keys/' . $theirs['id'] . '/email',
			array(
				'client' => 'claude',
				'os'     => 'macos',
				'config' => '{}',
			),
			$rep
		);

		$this->assertSame( 404, $response->get_status() );
	}
}
