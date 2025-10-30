<?php

/**
 * WooCommerce Review Received Trigger
 * This trigger will be fired when a review is received.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\WooCommerce\Review;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Review Received Trigger
 */
class Review_Received extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Review Received';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'wc_review_received';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a review is received.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'woocommerce';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'review';

	public function load_hooks() {
		add_action( 'comment_post', array( $this, 'review_received' ), 10, 3 );
	}

	/**
	 * Review Received
	 *
	 * @param int   $comment_ID Comment ID.
	 * @param int   $comment_approved Whether comment is approved.
	 * @param array $commentdata Comment data.
	 */
	public function review_received( $comment_ID, $comment_approved, $commentdata ) {
		if ( isset( $commentdata['comment_type'] ) && $commentdata['comment_type'] === 'review' ) {
			$this->process(
				array(
					'review_id'    => $comment_ID,
					'product_id'   => $commentdata['comment_post_ID'] ?? null,
					'author_email' => $commentdata['comment_author_email'] ?? '',
				)
			);
		}
	}
}

Triggers_Manager::instance()->register( new Review_Received() );
