<?php
// includes/emails/blocks/interface-email-block.php

namespace QuillCRM\Emails\Blocks;

/**
 * Interface for all email blocks
 */
interface Email_Block_Interface {
	/**
	 * Get block type identifier
	 *
	 * @return string
	 */
	public function get_type(): string;

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string;

	/**
	 * Render block for email
	 *
	 * @param array $props Block properties
	 * @param array $merge_tags Merge tags for content
	 * @return string HTML output
	 */
	public function render( array $props, array $merge_tags = array()): string;

	/**
	 * Get default properties for the block
	 *
	 * @return array
	 */
	public function get_default_props(): array;
}
