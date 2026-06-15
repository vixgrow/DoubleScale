<?php
/**
 * Guards the portal-timeline activity whitelist's deny-by-default contract.
 *
 * Regression test for the "disabled module leaks timeline rows" bug: the
 * Tickets section + summary card vanish when Support is off (their filters are
 * only added in Support's boot()), but the activity-table whitelist used to
 * hardcode `support_reply` in the Portal module, so the dashboard timeline kept
 * surfacing support rows — linking to a /tickets route that no longer existed.
 *
 * The fix makes the whitelist deny-by-default and moves the `support_reply`
 * opt-in into Support::boot() (via the `doublescale_portal_timeline_activity_types`
 * filter), so a disabled module contributes nothing.
 *
 * @package DoubleScale\Tests\Modules\Portal
 */

namespace DoubleScale\Tests\Modules\Portal;

use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Modules\Portal\Services\PortalActivityWhitelist;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class PortalTimelineWhitelistGateTest extends TestCase {

	/**
	 * With no module contributing, the whitelist must be empty (deny-by-default)
	 * — NOT silently include support_reply. This is what makes a disabled
	 * Support module drop its timeline rows.
	 */
	public function test_whitelist_is_deny_by_default(): void {
		$this->assertSame(
			array(),
			PortalActivityWhitelist::allowed_types(),
			'The base portal timeline whitelist must be empty so disabled modules contribute nothing.'
		);
		$this->assertFalse(
			PortalActivityWhitelist::is_allowed( ActivityTypes::SUPPORT_REPLY ),
			'support_reply must not be allowed unless the Support module opts it in.'
		);
	}

	/**
	 * The Support opt-in (mirroring Support::boot()) adds exactly support_reply.
	 */
	public function test_support_optin_adds_support_reply(): void {
		$cb = static function ( array $types ): array {
			$types[] = ActivityTypes::SUPPORT_REPLY;
			return $types;
		};
		add_filter( 'doublescale_portal_timeline_activity_types', $cb );

		$this->assertContains( ActivityTypes::SUPPORT_REPLY, PortalActivityWhitelist::allowed_types() );
		$this->assertTrue( PortalActivityWhitelist::is_allowed( ActivityTypes::SUPPORT_REPLY ) );

		remove_filter( 'doublescale_portal_timeline_activity_types', $cb );
	}

	/**
	 * Garbage contributions are normalised away (string-cast, de-duped, empties
	 * dropped) so a sloppy filter can't inject blank or duplicate types.
	 */
	public function test_contributions_are_normalised(): void {
		$cb = static function ( array $types ): array {
			$types[] = ActivityTypes::SUPPORT_REPLY;
			$types[] = ActivityTypes::SUPPORT_REPLY; // duplicate
			$types[] = '';                            // empty
			return $types;
		};
		add_filter( 'doublescale_portal_timeline_activity_types', $cb );

		$allowed = PortalActivityWhitelist::allowed_types();

		$this->assertSame(
			array( ActivityTypes::SUPPORT_REPLY ),
			$allowed,
			'Whitelist must de-dupe and drop empty contributions.'
		);

		remove_filter( 'doublescale_portal_timeline_activity_types', $cb );
	}
}
