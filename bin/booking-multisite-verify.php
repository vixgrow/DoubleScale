<?php
/**
 * Setup + verify Booking multisite isolation on a live network.
 *
 * Usage: wp eval-file wp-content/plugins/doublescale/bin/booking-multisite-verify.php
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

if ( ! is_multisite() ) {
	echo "FAIL: not multisite\n";
	exit( 1 );
}

$parent_id = 1;
$child     = get_sites(
	array(
		'path'   => '/wordpress/ds-booking-child/',
		'number' => 1,
	)
);
if ( empty( $child ) ) {
	echo "FAIL: child site ds-booking-child not found\n";
	exit( 1 );
}
$child_id = (int) $child[0]->blog_id;

$parent_only_login = 'ds-parent-only';
$child_admin_login = 'ds-child-admin';
$parent_pass       = 'ParentOnly1!';
$child_pass        = 'ChildAdmin1!';

$parent_user = get_user_by( 'login', $parent_only_login );
if ( ! $parent_user ) {
	$parent_user_id = wp_create_user( $parent_only_login, $parent_pass, 'parent-only@ds-booking.test' );
	wp_update_user(
		array(
			'ID'   => $parent_user_id,
			'role' => 'administrator',
		)
	);
} else {
	$parent_user_id = (int) $parent_user->ID;
}

$child_user = get_user_by( 'login', $child_admin_login );
if ( ! $child_user ) {
	$child_user_id = wp_create_user( $child_admin_login, $child_pass, 'child-admin@ds-booking.test' );
} else {
	$child_user_id = (int) $child_user->ID;
}

switch_to_blog( $child_id );
if ( ! is_user_member_of_blog( $child_user_id, $child_id ) ) {
	add_user_to_blog( $child_id, $child_user_id, 'administrator' );
}
restore_current_blog();

if ( is_user_member_of_blog( $parent_user_id, $child_id ) ) {
	remove_user_from_blog( $parent_user_id, $child_id );
}

switch_to_blog( $parent_id );
$provisioner = new \DoubleScale\Modules\Booking\Services\BookingProvisioner();
$parent_cal  = $provisioner->ensure_host_calendar( $parent_user_id );
restore_current_blog();

global $wpdb;
switch_to_blog( $child_id );
$child_cal_table = $wpdb->prefix . 'doublescale_booking_calendars';
$foreign_id      = (int) $wpdb->get_var(
	$wpdb->prepare(
		"SELECT id FROM {$child_cal_table} WHERE user_id = %d AND name = %s LIMIT 1",
		$parent_user_id,
		'CLONE-FOREIGN-CALENDAR'
	)
);
if ( ! $foreign_id ) {
	$wpdb->insert(
		$child_cal_table,
		array(
			'hash_id'    => wp_generate_password( 32, false, false ),
			'user_id'    => $parent_user_id,
			'name'       => 'CLONE-FOREIGN-CALENDAR',
			'slug'       => 'clone-foreign-' . wp_generate_password( 6, false, false ),
			'status'     => 'active',
			'type'       => 'host',
			'created_at' => current_time( 'mysql', true ),
			'updated_at' => current_time( 'mysql', true ),
		)
	);
	$foreign_id = (int) $wpdb->insert_id;
}
restore_current_blog();

switch_to_blog( $child_id );
\DoubleScale\Modules\Booking\Helpers\MultisiteScope::reset_cache_for_tests();
$child_cal = $provisioner->ensure_host_calendar( $child_user_id );
restore_current_blog();

echo "network=ok parent_blog={$parent_id} child_blog={$child_id} child_url=" . get_site_url( $child_id ) . "\n";
echo "parent_only_user={$parent_user_id} child_admin_user={$child_user_id}\n";
echo "parent_host_calendar=" . ( $parent_cal ? (int) $parent_cal->id : 0 ) . "\n";
echo "child_host_calendar=" . ( $child_cal ? (int) $child_cal->id : 0 ) . "\n";
echo "foreign_calendar_on_child={$foreign_id}\n";
echo "parent_only_on_child=" . ( is_user_member_of_blog( $parent_user_id, $child_id ) ? 'yes' : 'no' ) . "\n";

switch_to_blog( $child_id );
\DoubleScale\Modules\Booking\Helpers\MultisiteScope::reset_cache_for_tests();
wp_set_current_user( $child_user_id );

// Child subsites may lack optional Pro tables; skip task recurrence REST hook.
if ( isset( $GLOBALS['wp_filter']['rest_api_init'] ) ) {
	foreach ( $GLOBALS['wp_filter']['rest_api_init']->callbacks as $priority => $callbacks ) {
		foreach ( $callbacks as $callback ) {
			$fn = $callback['function'];
			if (
				is_array( $fn )
				&& isset( $fn[0] )
				&& is_object( $fn[0] )
				&& $fn[0] instanceof \DoubleScale\Pro\Modules\Tasks\Recurrences\TaskRecurrenceScheduler
			) {
				remove_action( 'rest_api_init', $fn, (int) $priority );
			}
		}
	}
}

$request = new WP_REST_Request( 'GET', '/doublescale/v1/booking/calendars' );
$request->set_param( 'per_page', 50 );
$request->set_param( 'user', 'all' );
$list    = rest_get_server()->dispatch( $request );
$ids     = array_map(
	static fn( $row ) => (int) $row['id'],
	(array) ( $list->get_data()['data'] ?? array() )
);

$detail = rest_get_server()->dispatch(
	new WP_REST_Request( 'GET', '/doublescale/v1/booking/calendars/' . $foreign_id )
);

$can_read_foreign = \DoubleScale\Modules\Booking\Capabilities::can_read_calendar( $foreign_id );

restore_current_blog();

$list_hides_foreign = ! in_array( $foreign_id, $ids, true );
$detail_blocked     = 403 === (int) $detail->get_status();
$cap_denies         = ! $can_read_foreign;

echo "REST_list_hides_foreign=" . ( $list_hides_foreign ? 'PASS' : 'FAIL' ) . "\n";
echo "REST_detail_blocks_foreign=" . ( $detail_blocked ? 'PASS' : 'FAIL' ) . " status=" . $detail->get_status() . "\n";
echo "CAP_denies_foreign=" . ( $cap_denies ? 'PASS' : 'FAIL' ) . "\n";

$super = get_super_admins();
if ( ! empty( $super ) ) {
	$sa = get_user_by( 'login', $super[0] );
	if ( $sa ) {
		switch_to_blog( $child_id );
		wp_set_current_user( $sa->ID );
		$sa_can = \DoubleScale\Modules\Booking\Capabilities::can_read_calendar( $foreign_id );
		restore_current_blog();
		echo "SUPER_ADMIN_can_read_foreign=" . ( $sa_can ? 'yes (expected)' : 'no' ) . "\n";
	}
}

$all_pass = $list_hides_foreign && $detail_blocked && $cap_denies && $child_cal;
echo $all_pass ? "OVERALL=PASS\n" : "OVERALL=FAIL\n";
exit( $all_pass ? 0 : 1 );
