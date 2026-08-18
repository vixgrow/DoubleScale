<?php
/**
 * Accept Hosted handoff — security properties of the POST bridge.
 *
 * The handoff holds a live payment token. It must be single-use, expire, and
 * never leak the token into a URL. These need real transients, hence an
 * integration test.
 *
 * @package DoubleScale\Tests\Integration\Sales
 */

namespace DoubleScale\Tests\Integration\Sales;

use DoubleScale\Core\ModuleManager;
use DoubleScale\Pro\Modules\Integrations\AuthorizeNet\HostedFormRedirect;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class AuthorizeNetHandoffSecurityTest extends IntegrationTestCase {

	private const FORM_URL = 'https://test.authorize.net/payment/payment';

	protected function setUp(): void {
		parent::setUp();

		if ( ! class_exists( HostedFormRedirect::class ) ) {
			$pro_main = dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/doublescale-pro.php';
			if ( is_readable( $pro_main ) ) {
				require_once $pro_main;
			}
		}

		if ( ! class_exists( HostedFormRedirect::class ) ) {
			$this->markTestSkipped( 'Requires doublescale-pro.' );
		}

		$this->ensure_sales_module();
	}

	/**
	 * Read the stored handoff the way handle() does.
	 *
	 * @param string $handoff_id Handoff id.
	 * @return array|false
	 */
	private function stored( string $handoff_id ) {
		return get_transient( 'ds_authnet_handoff_' . $handoff_id );
	}

	public function test_store_persists_the_token_server_side(): void {
		$id = HostedFormRedirect::store( 'TOK_LIVE', self::FORM_URL, 42 );

		$stored = $this->stored( $id );

		$this->assertIsArray( $stored );
		$this->assertSame( 'TOK_LIVE', $stored['token'] );
		$this->assertSame( self::FORM_URL, $stored['form_url'] );
		$this->assertSame( 42, (int) $stored['invoice_id'] );
	}

	/**
	 * The token must never travel in the query string: URLs land in browser
	 * history, server logs and Referer headers.
	 */
	public function test_the_token_never_appears_in_the_handoff_url(): void {
		$id  = HostedFormRedirect::store( 'TOK_SECRET_VALUE', self::FORM_URL, 1 );
		$url = HostedFormRedirect::url( $id );

		$this->assertStringNotContainsString( 'TOK_SECRET_VALUE', $url );
		$this->assertStringNotContainsString( 'TOK_SECRET_VALUE', rawurldecode( $url ) );
		$this->assertStringContainsString( $id, $url );
	}

	/**
	 * Two handoffs must not collide — a predictable id would let one customer
	 * pick up another's payment token.
	 */
	public function test_handoff_ids_are_unique_across_calls(): void {
		$ids = array();
		for ( $i = 0; $i < 25; $i++ ) {
			$ids[] = HostedFormRedirect::store( 'TOK_' . $i, self::FORM_URL, $i );
		}

		$this->assertCount( 25, array_unique( $ids ), 'Handoff ids must be unique.' );

		foreach ( $ids as $id ) {
			$this->assertGreaterThanOrEqual( 20, strlen( $id ), 'Handoff id is too short to be unguessable.' );
		}
	}

	/**
	 * Each handoff resolves only to its own token.
	 */
	public function test_handoffs_do_not_leak_into_each_other(): void {
		$first  = HostedFormRedirect::store( 'TOK_ONE', self::FORM_URL, 1 );
		$second = HostedFormRedirect::store( 'TOK_TWO', self::FORM_URL, 2 );

		$this->assertSame( 'TOK_ONE', $this->stored( $first )['token'] );
		$this->assertSame( 'TOK_TWO', $this->stored( $second )['token'] );
	}

	/**
	 * The single-use guarantee: handle() deletes the transient before
	 * rendering, so a back button or a replayed URL cannot resubmit a token.
	 */
	public function test_consuming_a_handoff_removes_it(): void {
		$id = HostedFormRedirect::store( 'TOK_ONCE', self::FORM_URL, 1 );

		$this->assertIsArray( $this->stored( $id ) );

		// This is exactly what handle() does before it renders.
		delete_transient( 'ds_authnet_handoff_' . $id );

		$this->assertFalse( $this->stored( $id ), 'A consumed handoff must not be readable again.' );
	}

	/**
	 * An unknown id must resolve to nothing rather than any other handoff.
	 */
	public function test_an_unknown_handoff_id_resolves_to_nothing(): void {
		HostedFormRedirect::store( 'TOK_REAL', self::FORM_URL, 1 );

		$this->assertFalse( $this->stored( 'not-a-real-handoff-id' ) );
		$this->assertFalse( $this->stored( '' ) );
	}

	/**
	 * The stored payload must carry a usable form URL — an empty one would
	 * make handle() render the expired page instead of posting the token.
	 */
	public function test_stored_form_url_is_the_mode_specific_endpoint(): void {
		$sandbox = HostedFormRedirect::store( 'T1', 'https://test.authorize.net/payment/payment', 1 );
		$live    = HostedFormRedirect::store( 'T2', 'https://accept.authorize.net/payment/payment', 2 );

		$this->assertSame(
			'https://test.authorize.net/payment/payment',
			$this->stored( $sandbox )['form_url']
		);
		$this->assertSame(
			'https://accept.authorize.net/payment/payment',
			$this->stored( $live )['form_url']
		);
	}

	/**
	 * Accept Hosted blanks its own form when the return URL contains an
	 * ampersand, so the bounce URL must stay path-only.
	 */
	public function test_customer_return_url_stays_ampersand_free(): void {
		$hash = str_repeat( 'a', 32 );
		$url  = HostedFormRedirect::return_url( $hash );

		$this->assertStringNotContainsString( '&', $url );
		$this->assertStringContainsString( $hash, rawurldecode( $url ) );
	}

	// -------------------------------------------------------------------
	// The rendered form — the one place the live token enters a response.
	// -------------------------------------------------------------------

	public function test_rendered_form_posts_the_token_to_the_gateway(): void {
		$html = HostedFormRedirect::build_form_html( self::FORM_URL, 'TOK_RENDER' );

		// Accept Hosted only accepts a POST, so the page must self-submit.
		$this->assertStringContainsString( 'method="post"', $html );
		$this->assertStringContainsString( 'action="' . self::FORM_URL . '"', $html );
		$this->assertStringContainsString( 'name="token"', $html );
		$this->assertStringContainsString( 'value="TOK_RENDER"', $html );
		$this->assertStringContainsString( '.submit()', $html );
		// Still payable with JavaScript disabled.
		$this->assertStringContainsString( '<noscript>', $html );
	}

	/**
	 * A token carrying HTML metacharacters must not break out of the value
	 * attribute and inject markup.
	 */
	public function test_rendered_token_is_escaped(): void {
		$html = HostedFormRedirect::build_form_html(
			self::FORM_URL,
			'TOK"><script>alert(1)</script>'
		);

		$this->assertStringNotContainsString( '<script>alert(1)</script>', $html );
		$this->assertStringContainsString( '&lt;script&gt;', $html );
		// The value attribute must still be closed properly.
		$this->assertStringContainsString( 'name="token" value="TOK&quot;', $html );
	}

	/**
	 * The form action is attacker-influenced only via stored settings, but a
	 * javascript: URL there would be an XSS sink.
	 */
	public function test_rendered_form_action_is_url_escaped(): void {
		$html = HostedFormRedirect::build_form_html(
			'javascript:alert(1)',
			'TOK'
		);

		$this->assertStringNotContainsString( 'action="javascript:alert(1)"', $html );
	}

	/**
	 * The page must not be cached or leak its URL onward — it is a one-time
	 * payment handoff.
	 */
	public function test_rendered_page_suppresses_referrer_leakage(): void {
		$html = HostedFormRedirect::build_form_html( self::FORM_URL, 'TOK' );

		$this->assertStringContainsString( 'name="referrer" content="no-referrer"', $html );
	}

	private function ensure_sales_module(): void {
		$modules = get_option( 'doublescale_enabled_modules', array() );
		if ( empty( $modules['sales'] ) ) {
			$modules['sales'] = true;
			update_option( 'doublescale_enabled_modules', $modules );
		}

		ModuleManager::activateModule( 'sales' );
	}
}
