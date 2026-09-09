<?php
/**
 * Live multisite probe for Booking isolation + host calendar provisioning.
 *
 * Usage (from WP root):
 *   wp eval-file wp-content/plugins/doublescale/bin/booking-multisite-probe.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	fwrite( STDERR, "Run via wp eval-file from a WordPress install.\n" );
	exit( 1 );
}

if ( ! is_multisite() ) {
	echo "SKIP: install is not multisite (is_multisite() = false).\n";
	exit( 0 );
}

global $wpdb;

$sites = get_sites( array( 'number' => 0 ) );
echo 'sites=' . count( $sites ) . PHP_EOL;

foreach ( $sites as $site ) {
	$blog_id = (int) $site->blog_id;
	switch_to_blog( $blog_id );

	$calendar_table = $wpdb->prefix . 'doublescale_booking_calendars';
	$booking_table  = $wpdb->prefix . 'doublescale_bookings';
	$calendar_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$calendar_table}" );
	$booking_count  = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$booking_table}" );

	$member_ids = get_users( array( 'blog_id' => $blog_id, 'fields' => 'ID' ) );
	$orphans    = (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT COUNT(*) FROM {$calendar_table} WHERE user_id NOT IN (" . implode( ',', array_map( 'intval', $member_ids ?: array( 0 ) ) ) . ')'
		)
	);

	echo sprintf(
		"blog=%d url=%s calendars=%d bookings=%d members=%d orphan_calendars=%d\n",
		$blog_id,
		get_site_url(),
		$calendar_count,
		$booking_count,
		count( $member_ids ),
		$orphans
	);

	restore_current_blog();
}
