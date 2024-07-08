<?php
/**
 * Class Merge Tag Manager
 *
 * This class is responsible for handling the merge tags
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Merge Tag Manager
 */
final class Merge_Tags_Manager {

	/**
	 * Registed merge tags
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $merge_tags = array();

	/**
	 * Groups
	 *
	 * @var array
	 */
	protected $groups = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Merge_Tags_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Merge_Tags_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * constructor
	 */
	private function __construct() {
		$this->set_groups();
	}

	/**
	 * Register Merge Tag
	 *
	 * @since 1.0.0
	 *
	 * @param Merge_Tag $merge_tag Merge Tag.
	 */
	public function register( Merge_Tag $merge_tag ) {
		if ( ! $merge_tag instanceof Merge_Tag ) {
			return;
		}

		if ( isset( $this->merge_tags[ $merge_tag->slug ] ) ) {
			return;
		}

		// Merge tag will be like {{group:slug}}
		$this->merge_tags[ $merge_tag->group ][ $merge_tag->slug ]     = $merge_tag;
		$this->groups[ $merge_tag->group ]['tags'][ $merge_tag->slug ] = array(
			'label'       => $merge_tag->name,
			'description' => $merge_tag->description,
		);
	}

	/**
	 * Get Merge Tag
	 *
	 * @since 1.0.0
	 *
	 * @param string $group Merge Tag Group.
	 * @param string $slug Merge Tag Slug.
	 *
	 * @return Merge_Tag
	 */
	public function get_merge_tag( $group, $slug ) {
		if ( isset( $this->merge_tags[ $group ][ $slug ] ) ) {
			return $this->merge_tags[ $group ][ $slug ];
		}

		return null;
	}

	/**
	 * Get Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_merge_tags() {
		return $this->merge_tags;
	}

	/**
	 * Set Groups
	 */
	public function set_groups() {
		$this->groups = array(
			'contact'        => array(
				'label' => __( 'Contact', 'quillcrm' ),
				'tags'  => array(),
			),
			'general'        => array(
				'label' => __( 'General', 'quillcrm' ),
				'tags'  => array(),
			),
			'order'          => array(
				'label' => __( 'Order', 'quillcrm' ),
				'tags'  => array(),
			),
			'abandoned_cart' => array(
				'label' => __( 'Abandoned Cart', 'quillcrm' ),
				'tags'  => array(),
			),
		);
	}

	/**
	 * Get Groups
	 *
	 * @return array
	 */
	public function get_groups() {
		return $this->groups;
	}

	/**
	 * Process Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @param string                   $content Content.
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return string
	 */
	public function process_merge_tags( $content, Automation_Contact_Model $automation_contact ) {
		return preg_replace_callback(
			'/{{(.*?):(.*?)}}/',
			function( $matches ) use ( $automation_contact ) {
				$group          = $matches[1];
				$slug           = $matches[2];
				$slug_parts     = explode( ' ', $slug );
				$merge_tag_slug = $slug_parts[0];
				$merge_tag      = $this->get_merge_tag( $group, $merge_tag_slug );

				if ( ! $merge_tag ) {
					return '';
				}

				return $merge_tag->get_value( $automation_contact, $slug );
			},
			$content
		);
	}
}
