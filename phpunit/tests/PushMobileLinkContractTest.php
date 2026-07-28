<?php
/**
 * Regression: the mobile deep links emitted by notification producers stay in
 * sync with the routes the mobile app can actually handle.
 *
 * A push whose mobile_link has no matching case in the app's
 * src/utils/deepLinkRoute.ts navigates nowhere — the notification arrives and
 * tapping it silently does nothing. That bug shipped once for bookings, support
 * tickets and every sales document, so the shapes are pinned here.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class PushMobileLinkContractTest extends TestCase {

	/**
	 * Link shapes the mobile app knows how to route, with {id} standing in for
	 * a numeric id. Keep in sync with resolveDeepLink() in the app.
	 *
	 * @var string[]
	 */
	private const SUPPORTED_ROUTES = array(
		'/contacts',
		'/contacts/{id}',
		'/deals/{id}',
		'/tasks/{id}',
		'/bookings/{id}',
		'/support/tickets/{id}',
		'/sales/proposals/{id}',
		'/sales/invoices/{id}',
		'/sales/contracts/{id}',
		'/sales/credit-notes/{id}',
		'/sales/approvals',
		'/notifications',
	);

	/**
	 * Routes emitted by the plugin that the app has no screen for yet. These
	 * are tolerated (the app no-ops) but tracked so the list stays deliberate.
	 *
	 * @var string[]
	 */
	private const KNOWN_UNROUTED = array(
		'/projects/{id}',
	);

	/**
	 * Collect every literal 'mobile' => ... link produced across both plugins,
	 * normalised so dynamic ids become {id}.
	 *
	 * @return array<string, string> Normalised link => source file.
	 */
	private function collect_mobile_links(): array {
		$plugins = dirname( __DIR__, 3 );
		$roots   = array(
			$plugins . '/doublescale/includes',
			$plugins . '/doublescale-pro/includes',
		);

		$links = array();

		foreach ( $roots as $root ) {
			if ( ! is_dir( $root ) ) {
				continue;
			}

			$it = new \RecursiveIteratorIterator( new \RecursiveDirectoryIterator( $root ) );
			foreach ( $it as $file ) {
				if ( ! $file->isFile() || 'php' !== $file->getExtension() ) {
					continue;
				}

				$src = (string) file_get_contents( $file->getPathname() );
				if ( ! preg_match_all( "/'mobile'\s*=>\s*([^,\n]+)/", $src, $matches ) ) {
					continue;
				}

				foreach ( $matches[1] as $raw ) {
					$raw = trim( $raw );

					// Skip null links (producers with no mobile destination).
					if ( 'null' === $raw ) {
						continue;
					}

					// Only literal-prefixed links can be checked statically.
					if ( ! preg_match( "/^'(\/[^']*)'/", $raw, $lit ) ) {
						continue;
					}

					$path = $lit[1];

					// `'/' . $path` builds the whole route dynamically (approval
					// documents); the concatenated values are covered by the
					// sales/* entries, so there is nothing static to assert.
					if ( '/' === $path ) {
						continue;
					}

					// '/contacts/' . $id  ->  /contacts/{id}
					if ( substr( $path, -1 ) === '/' ) {
						$path = rtrim( $path, '/' ) . '/{id}';
					}

					$links[ $path ] = str_replace( dirname( __DIR__, 3 ) . '/', '', $file->getPathname() );
				}
			}
		}

		return $links;
	}

	public function test_every_emitted_mobile_link_is_routable_by_the_app() {
		$links = $this->collect_mobile_links();

		$this->assertNotEmpty( $links, 'Expected to find mobile links in the notification producers.' );

		$allowed = array_merge( self::SUPPORTED_ROUTES, self::KNOWN_UNROUTED );

		foreach ( $links as $link => $source ) {
			$this->assertContains(
				$link,
				$allowed,
				"Notification in {$source} emits mobile_link '{$link}', which the mobile app "
				. 'cannot route. Add a case to resolveDeepLink() in the app (and to '
				. 'SUPPORTED_ROUTES here), or the push will navigate nowhere when tapped.'
			);
		}
	}

	public function test_contact_and_booking_links_keep_their_shape() {
		$links = $this->collect_mobile_links();

		// These three regressed before: contacts/bookings navigated nowhere.
		$this->assertArrayHasKey( '/contacts/{id}', $links, 'Contact notifications must deep link to the contact.' );
		$this->assertArrayHasKey( '/bookings/{id}', $links, 'Booking notifications must deep link to the booking.' );
		$this->assertArrayHasKey( '/support/tickets/{id}', $links, 'Ticket notifications must deep link to the ticket.' );
	}
}
