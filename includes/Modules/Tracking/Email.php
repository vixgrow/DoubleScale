<?php

/**
 * Class Email Tracking
 * This class is responsible for handling the Email Tracking
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Tracking;

use DoubleScale\Constants\MessageDirection;
use DoubleScale\Constants\TrackingStatus;
use DoubleScale\Modules\Tracking\Models\CommunicationTrackingModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;

/**
 * Email Tracking
 */
class Email
{

	/**
	 * 1x1 transparent GIF pixel (base64-encoded).
	 *
	 * @var string
	 */
	private const TRACKING_PIXEL = 'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Email
	 */
	private static $instance;

	/**
	 * Email Instance.
	 *
	 * Instantiates or reuses an instance of Email.
	 *
	 * @since  1.0.0
	 *
	 * @return Email
	 */
	public static function instance()
	{
		if (is_null(self::$instance)) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Email Tracking
	 */
	public function __construct()
	{
		add_action('doublescale_loaded', array($this, 'init'));
	}

	/**
	 * Init
	 */
	public function init()
	{
		$this->email_opened_tracking();
		$this->email_clicked_tracking();
	}

	/**
	 * Send a 1x1 transparent tracking pixel and terminate.
	 *
	 * @param bool $cache Whether to allow caching (false = send no-cache headers).
	 */
	private function send_tracking_pixel($cache = false)
	{
		header('Content-Type: image/gif');
		header('Content-Length: 43');
		if (! $cache) {
			header('Cache-Control: private, no-cache, no-cache=Set-Cookie, proxy-revalidate');
			header('Expires: Wed, 11 Jan 1984 05:00:00 GMT');
			header('Last-Modified: Wed, 11 Jan 1984 05:00:00 GMT');
			header('Pragma: no-cache');
		}
		die(base64_decode(self::TRACKING_PIXEL));
	}

	/**
	 * Check if a tracking entry is a failed outbound message.
	 *
	 * @param object $tracking_entry Communication tracking model instance.
	 * @return bool
	 */
	private function is_failed_outbound($tracking_entry)
	{
		return (int) $tracking_entry->status === TrackingStatus::FAILED
			&& (int) $tracking_entry->direction === MessageDirection::OUTBOUND;
	}

	/**
	 * Email Opened Tracking
	 * Handles tracking for all email types: Campaign, Automation, and Individual
	 */
	public function email_opened_tracking()
	{
		try {
			if (! isset($_GET['doublescale']) || $_GET['doublescale'] !== 'email_open') {
				return;
			}

			$hash_key = isset($_GET['hash_key']) ? sanitize_text_field($_GET['hash_key']) : '';
			$tracking_entry = CommunicationTrackingModel::where('hash_key', $hash_key)
				->where('mode', CommunicationTrackingModel::MODE_EMAIL)
				->first();

			if (! $tracking_entry) {
				return;
			}

			// Skip open tracking for failed outbound emails (still send pixel to avoid broken images).
			if ($this->is_failed_outbound($tracking_entry)) {
				$this->send_tracking_pixel(true);
			}

			// Only update and fire action on first open (prevent duplicate notifications/lead scoring).
			if (! $tracking_entry->opened) {
				$tracking_entry->update(
					array(
						'opened'    => 1,
						'opened_at' => current_time('mysql', true),
					)
				);

				// Fire email opened action only on first open.
				$contact = $tracking_entry->contact;
				if ($contact) {
					do_action('doublescale_email_opened', $contact);
				}
			}

			// Send the pixel (always, regardless of first/repeat open)
			$this->send_tracking_pixel();
		} catch (\Exception $e) {
			doublescale_get_logger()->error(
				__('Email Opened Tracking Error', 'doublescale'),
				array(
					'code'  => 'email_opened_tracking',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
			return;
		}
	}

	/**
	 * Email Clicked Tracking
	 * Handles tracking for all email types: Campaign, Automation, and Individual
	 */
	public function email_clicked_tracking()
	{
		try {
			if (! isset($_GET['doublescale']) || $_GET['doublescale'] !== 'email_click') {
				return;
			}

			if (! isset($_GET['hash_key']) || ! isset($_GET['original'])) {
				return;
			}

			$hash_key = sanitize_text_field($_GET['hash_key']);
			$tracking_entry = CommunicationTrackingModel::where('hash_key', $hash_key)
				->where('mode', CommunicationTrackingModel::MODE_EMAIL)
				->first();

			if (! $tracking_entry) {
				return;
			}

			// Skip click tracking for failed outbound emails — redirect to original URL if valid, otherwise home.
			if ($this->is_failed_outbound($tracking_entry)) {
				// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				$fallback = isset($_GET['original']) ? esc_url_raw(sanitize_text_field(urldecode($_GET['original']))) : '';
				if (empty($fallback) || ! preg_match('#^https?://#i', $fallback)) {
					$fallback = home_url();
				}
				wp_redirect($fallback);
				exit;
			}

			// Capture state before update to avoid duplicate notifications/lead scoring.
			$already_clicked = (bool) $tracking_entry->clicked;

			// Update tracking status only on first click.
			if (! $already_clicked) {
				$tracking_entry->update(
					array(
						'clicked'    => 1,
						'clicked_at' => current_time('mysql', true),
					)
				);
			}

			// If email was clicked but not opened, mark as opened too.
			if (! $tracking_entry->opened) {
				$tracking_entry->update(
					array(
						'opened'    => 1,
						'opened_at' => current_time('mysql', true),
					)
				);
			}

			// Fire email clicked action only on first click.
			if (! $already_clicked) {
				$contact = $tracking_entry->contact;
				if ($contact) {
					do_action('doublescale_email_clicked', $contact);
				}
			}

			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- urldecode must happen before sanitize_text_field.
			$original_url = sanitize_text_field(urldecode($_GET['original']));

			// Handle broken unsubscribe merge tags (e.g., "unsubscribe_link}}" from unprocessed {{contact:unsubscribe_link}})
			if (strpos($original_url, 'unsubscribe_link') !== false || strpos($original_url, '{{contact:') !== false) {
				$contact = isset($contact) ? $contact : $tracking_entry->contact;
				if ($contact) {
					$unsubscribe_url = add_query_arg(
						array(
							'doublescale-unsubscribe' => '1',
							'id'                   => $contact->hash_id,
							'channel'              => 'email',
						),
						home_url()
					);
					wp_redirect($unsubscribe_url);
					exit;
				}
			}

			// Validate URL scheme to prevent open redirect attacks.
			$original_url = esc_url_raw($original_url);
			if (empty($original_url) || ! preg_match('#^https?://#i', $original_url)) {
				$original_url = home_url();
			}

			wp_redirect($original_url);
			exit;
		} catch (\Exception $e) {
			doublescale_get_logger()->error(
				__('Email Clicked Tracking Error', 'doublescale'),
				array(
					'code'  => 'email_clicked_tracking',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
			return;
		}
	}
}
