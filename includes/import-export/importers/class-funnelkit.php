<?php
/**
 * Funnelkit Importer
 *
 * This class is responsible for handling the Funnelkit importer
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Import_Export\Importers;

use QuillCRM\Abstracts\Importer;

/**
 * Funnelkit Importer class
 */
class Funnelkit extends Importer {

	/**
	 * Name
	 *
	 * @var string
	 */
	public $name = 'Funnelkit';

	/**
	 * Slug
	 *
	 * @var string
	 */
	public $slug = 'wpfunnelkit';

	/**
	 * Is Integration
	 *
	 * @var bool
	 */
	protected $is_integration = true;

	/**
	 * Is Active
	 *
	 * @var bool
	 */
	public function is_active() {
		return quillcrm_is_plugin_active( 'wp-marketing-automations/wp-marketing-automations.php' );
	}

	/**
	 * Run importer
	 */
	public function run() {
		global $wpdb;

		// phpcs:disable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table names are from FunnelKit plugin tables.

		$table_name  = $wpdb->prefix . 'fc_subscribers';
		$pivot_table = $wpdb->prefix . 'fc_subscriber_pivot';
		$list_table  = $wpdb->prefix . 'fc_lists';
		$tag_table   = $wpdb->prefix . 'fc_tags';

		// Define the mapping as before
		$mapping = array(
			'first_name' => 'first_name',
			'last_name'  => 'last_name',
			'email'      => 'email',
			'phone'      => 'phone',
			'address_1'  => 'address_line_1',
			'address_2'  => 'address_line_2',
			'city'       => 'city',
			'state'      => 'state',
			'zip'        => 'postal_code',
			'country'    => 'country',
			'status'     => array(
				'unsubscribed' => 'unsubscribed',
				'subscribed'   => 'subscribed',
				'pending'      => 'unverified',
			),
		);

		// Get total subscribers count
		$total = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );

		$result = $this->import_with_offset(
			$total,
			$this->offset,
			function ( $offset ) use ( $wpdb, $table_name, $pivot_table, $list_table, $tag_table ) {
				$like_list = '%' . $wpdb->esc_like( 'List' ) . '%';
				$like_tag  = '%' . $wpdb->esc_like( 'Tag' ) . '%';

				return $wpdb->get_results(
					$wpdb->prepare(
						"SELECT s.*, 
								GROUP_CONCAT(DISTINCT CASE WHEN p.object_type LIKE %s THEN l.title END) AS lists,
								GROUP_CONCAT(DISTINCT CASE WHEN p.object_type LIKE %s THEN t.title END) AS tags
						 FROM $table_name AS s
						 
						 LEFT JOIN $pivot_table AS p ON s.id = p.subscriber_id
						 LEFT JOIN $list_table AS l ON p.object_id = l.id AND p.object_type LIKE %s
						 LEFT JOIN $tag_table AS t ON p.object_id = t.id AND p.object_type LIKE %s
						 
						 GROUP BY s.id
						 LIMIT %d, 20",
						$like_list,
						$like_tag,
						$like_list,
						$like_tag,
						$offset
					),
					ARRAY_A
				);
			},
			$mapping
		);

		// phpcs:enable PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return $result;
	}

	/**
	 * Get lists
	 *
	 * @return array
	 */
	public function get_lists() {
		global $wpdb;
		$terms_table = $wpdb->prefix . 'bwfan_terms';

		// phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is from FunnelKit plugin.
		$terms = $wpdb->get_results( "SELECT * FROM $terms_table WHERE type = 2" );

		$lists_array = array();

		foreach ( $terms ?? array() as $term ) {
			$lists_array[] = array(
				'key'   => $term->name,
				'label' => $term->name,
			);
		}

		return $lists_array;
	}

	/**
	 * Get tags
	 *
	 * @return array
	 */
	public function get_tags() {
		global $wpdb;
		$terms_table = $wpdb->prefix . 'bwfan_terms';

		// phpcs:ignore PluginCheck.Security.DirectDB.UnescapedDBParameter, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is from FunnelKit plugin.
		$terms = $wpdb->get_results( "SELECT * FROM $terms_table WHERE type = 1" );

		$tags_array = array();

		foreach ( $terms ?? array() as $term ) {
			$tags_array[] = array(
				'key'   => $term->name,
				'label' => $term->name,
			);
		}

		return $tags_array;
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'lists_mapping' => array(
				'type'    => 'lists_mapping',
				'label'   => __( 'Lists', 'quill-crm' ),
				'options' => $this->get_lists(),
			),
			'tags_mapping'  => array(
				'type'    => 'tags_mapping',
				'label'   => __( 'Tags', 'quill-crm' ),
				'options' => $this->get_tags(),
			),
		);
	}
}
