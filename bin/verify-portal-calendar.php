<?php
/**
 * Live WordPress verifier for the Client Portal calendar feed.
 *
 * The shim PHPUnit suite covers the controller's pure window logic
 * (see RestPortalCalendarRoutesTest); this exercises the DB-backed
 * `doublescale_portal_calendar_events` providers against a real contact:
 * event shaping, the customer-safe hash routes, booking-timezone resolution
 * (the eager-loaded, N+1-free path), the end-of-day boundary (both directions),
 * and contact-scoped ownership.
 *
 * Usage (from plugin root, pass a contact id with calendar data):
 *   wp eval-file bin/verify-portal-calendar.php 98 --path=/var/www/html/site
 *
 * @package DoubleScale
 */

if ( ! defined( 'ABSPATH' ) ) {
	fwrite( STDERR, "Run via: wp eval-file bin/verify-portal-calendar.php <contact_id>\n" );
	exit( 1 );
}

use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;

$failures = 0;
$passes   = 0;

/**
 * @param bool   $ok    Assertion result.
 * @param string $label Human-readable label.
 */
$check = static function ( bool $ok, string $label ) use ( &$failures, &$passes ): void {
	if ( $ok ) {
		++$passes;
		echo "[PASS] {$label}\n";
		return;
	}
	++$failures;
	echo "[FAIL] {$label}\n";
};

echo "=== DoubleScale Client Portal Calendar Verifier ===\n\n";

// `wp eval-file foo.php 98` exposes positional args in $args.
$contact_id = isset( $args[0] ) ? (int) $args[0] : 98;
$contact    = ContactModel::find( $contact_id );

$check( $contact instanceof ContactModel, "contact {$contact_id} resolves" );
if ( ! $contact instanceof ContactModel ) {
	echo "\nCannot continue without a contact.\n";
	exit( 1 );
}

// Wide window covering the contact's data.
$events = apply_filters( 'doublescale_portal_calendar_events', array(), $contact, '2020-01-01', '2030-12-31 23:59:59' );

$by_kind = array();
foreach ( $events as $event ) {
	$by_kind[ $event['kind'] ][] = $event;
}

$booking  = $by_kind['booking'][0] ?? null;
$invoice  = $by_kind['invoice'][0] ?? null;
$proposal = $by_kind['proposal'][0] ?? null;

// Booking: timed, tz resolved (eager-loaded, not the N+1 accessor), numeric route.
if ( $booking ) {
	$check( false === $booking['all_day'], 'booking is timed (all_day=false)' );
	$check( is_string( $booking['timezone'] ) && '' !== $booking['timezone'], 'booking timezone resolved to a non-empty string' );
	$check( (bool) preg_match( '#^/bookings/\d+$#', (string) $booking['route'] ), 'booking route is /bookings/{id}' );
}

// Invoice: all-day, null tz, HASH route (a numeric id would 404 in-portal).
if ( $invoice ) {
	$check( true === $invoice['all_day'], 'invoice is all-day' );
	$check( null === $invoice['timezone'], 'invoice timezone is null (civil date)' );
	$check( (bool) preg_match( '#^/documents/invoice/[a-f0-9]{32}$#', (string) $invoice['route'] ), 'invoice route is /documents/invoice/{hash}' );
}

// Proposal: HASH route.
if ( $proposal ) {
	$check( (bool) preg_match( '#^/documents/proposal/[a-f0-9]{32}$#', (string) $proposal['route'] ), 'proposal route is /documents/proposal/{hash}' );
}

// End-of-day boundary — the load-bearing fix, asserted in BOTH directions.
$last_booking = BookingModel::where( 'contact_id', $contact_id )->orderBy( 'start_time', 'desc' )->first();
if ( $last_booking instanceof BookingModel ) {
	$day = substr( (string) $last_booking->start_time, 0, 10 );
	$id  = 'booking-' . (int) $last_booking->id;

	$with_eod = apply_filters( 'doublescale_portal_calendar_events', array(), $contact, $day, $day . ' 23:59:59' );
	$found    = false;
	foreach ( $with_eod as $event ) {
		if ( $id === $event['id'] ) {
			$found = true;
		}
	}
	$check( $found, "last-day timed booking ({$last_booking->start_time}) included with end-of-day bound" );

	// Regression sentinel: the same booking MUST drop with a bare-midnight end —
	// proving the inclusive bound is load-bearing, not cosmetic.
	$with_midnight = apply_filters( 'doublescale_portal_calendar_events', array(), $contact, $day, $day . ' 00:00:00' );
	$dropped       = true;
	foreach ( $with_midnight as $event ) {
		if ( $id === $event['id'] ) {
			$dropped = false;
		}
	}
	$check( $dropped, 'same booking dropped with bare-midnight end (regression sentinel)' );
}

// Ownership: another contact's feed must not carry this contact's doc routes.
$other = ContactModel::where( 'id', '!=', $contact_id )->first();
if ( $other instanceof ContactModel ) {
	$other_events = apply_filters( 'doublescale_portal_calendar_events', array(), $other, '2020-01-01', '2030-12-31 23:59:59' );
	$mine         = array();
	foreach ( $events as $event ) {
		if ( 0 === strpos( (string) $event['route'], '/documents/' ) ) {
			$mine[] = $event['route'];
		}
	}
	$leak = false;
	foreach ( $other_events as $event ) {
		if ( in_array( $event['route'], $mine, true ) ) {
			$leak = true;
		}
	}
	$check( ! $leak, 'no cross-contact document-route leak' );
}

echo "\n=== Summary: {$passes} passed, {$failures} failed ===\n";
exit( $failures > 0 ? 1 : 0 );
