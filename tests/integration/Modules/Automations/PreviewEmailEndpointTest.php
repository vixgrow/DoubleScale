<?php
/**
 * Integration coverage for the builder's device-preview render endpoint.
 *
 * The preview must render the content sent in the request — not a saved
 * template — because the automation "Send Email" and email-sequence builders
 * hold their content in local state, and because rendering a saved template
 * made the preview show stale content after every edit.
 *
 * @package DoubleScale\Tests\Integration
 */

namespace DoubleScale\Tests\Integration\Modules\Automations;

use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group automations
 */
final class PreviewEmailEndpointTest extends IntegrationTestCase {

	private const ROUTE = '/doublescale/v1/automation-steps/preview-email';

	public function setUp(): void {
		parent::setUp();

		// Routes register on rest_api_init; the shared REST server was built
		// before this plugin hooked in, so re-run registration.
		do_action( 'rest_api_init' );
	}

	/**
	 * Builder payload containing a single text block with $text in it.
	 *
	 * @param string $text Text to embed in the block.
	 * @return string JSON body as the builder sends it.
	 */
	private function builder_body( string $text ): string {
		return wp_json_encode(
			array(
				'type'  => 'builder',
				'value' => array(
					'sections'       => array(
						array(
							'id'      => 'section-1',
							'columns' => array(
								array(
									'id'     => 'column-1',
									'width'  => 100,
									'blocks' => array(
										array(
											'id'    => 'block-1',
											'type'  => 'text',
											'props' => array(
												'content' => $text,
											),
										),
									),
								),
							),
						),
					),
					'globalSettings' => array(
						'canvasWidth' => 600,
					),
				),
			)
		);
	}

	public function test_route_is_registered(): void {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey(
			self::ROUTE,
			$routes,
			'preview-email route is not registered.'
		);
	}

	public function test_renders_the_content_sent_in_the_request(): void {
		$admin = $this->make_admin_user();

		$response = $this->dispatch_rest(
			'POST',
			self::ROUTE,
			array( 'body' => $this->builder_body( 'HELLO_FROM_REQUEST' ) ),
			$admin
		);

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'html', $data );
		$this->assertStringContainsString( 'HELLO_FROM_REQUEST', $data['html'] );
	}

	/**
	 * The whole point of the device preview: the rendered HTML must carry the
	 * responsive rules, otherwise the mobile frame shows a desktop layout.
	 */
	public function test_rendered_html_contains_the_mobile_media_query(): void {
		$admin = $this->make_admin_user();

		$response = $this->dispatch_rest(
			'POST',
			self::ROUTE,
			array( 'body' => $this->builder_body( 'x' ) ),
			$admin
		);

		$html = $response->get_data()['html'];

		$this->assertStringContainsString(
			'@media only screen and (max-width: 480px)',
			$html,
			'Preview HTML lacks the mobile breakpoint, so stacking would never show.'
		);
		$this->assertStringContainsString( 'mobile-container', $html );
	}

	/**
	 * Editing then previewing again must reflect the new content. This is the
	 * regression that made the preview look "stuck" when it rendered a saved
	 * template instead of the request body.
	 */
	public function test_second_render_reflects_edited_content(): void {
		$admin = $this->make_admin_user();

		$first = $this->dispatch_rest(
			'POST',
			self::ROUTE,
			array( 'body' => $this->builder_body( 'VERSION_ONE' ) ),
			$admin
		);

		$second = $this->dispatch_rest(
			'POST',
			self::ROUTE,
			array( 'body' => $this->builder_body( 'VERSION_TWO' ) ),
			$admin
		);

		$first_html  = $first->get_data()['html'];
		$second_html = $second->get_data()['html'];

		$this->assertStringContainsString( 'VERSION_ONE', $first_html );
		$this->assertStringContainsString( 'VERSION_TWO', $second_html );
		$this->assertStringNotContainsString(
			'VERSION_ONE',
			$second_html,
			'Second preview still shows the first version — content is stale.'
		);
	}

	/**
	 * Raw HTML bodies (non-builder steps) must pass through rather than error.
	 */
	public function test_raw_html_body_is_previewed_as_is(): void {
		$admin = $this->make_admin_user();

		$response = $this->dispatch_rest(
			'POST',
			self::ROUTE,
			array( 'body' => '<p>RAW_HTML_BODY</p>' ),
			$admin
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertStringContainsString(
			'RAW_HTML_BODY',
			$response->get_data()['html']
		);
	}

	public function test_empty_body_is_rejected(): void {
		$admin = $this->make_admin_user();

		$response = $this->dispatch_rest(
			'POST',
			self::ROUTE,
			array( 'body' => '' ),
			$admin
		);

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	/**
	 * The endpoint renders arbitrary content, so it must not be open to
	 * unauthenticated callers.
	 */
	public function test_requires_authentication(): void {
		$response = $this->dispatch_rest(
			'POST',
			self::ROUTE,
			array( 'body' => $this->builder_body( 'x' ) ),
			null
		);

		$this->assertGreaterThanOrEqual(
			400,
			$response->get_status(),
			'preview-email accepted an unauthenticated request.'
		);
	}
}
