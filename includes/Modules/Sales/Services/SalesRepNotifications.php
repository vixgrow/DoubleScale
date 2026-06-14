<?php
/**
 * In-app / email / push notifications to assigned sales reps.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Notifications\Services\NotificationCategories;
use DoubleScale\Modules\Notifications\Services\NotificationService;
use DoubleScale\Modules\Sales\Constants\ProposalStatus;
use DoubleScale\Modules\Sales\Models\InvoiceModel;
use DoubleScale\Modules\Sales\Models\ProposalModel;

/**
 * SalesRepNotifications service.
 */
final class SalesRepNotifications {

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @param string        $event Event key: sent|accepted|declined.
	 * @return void
	 */
	public function notify_proposal_event( ProposalModel $proposal, string $event ): void {
		$user_id = $proposal->assigned_user_id ? (int) $proposal->assigned_user_id : 0;
		if ( $user_id <= 0 ) {
			return;
		}

		$subcategory = $this->proposal_subcategory_for_event( $event );
		if ( ! $subcategory ) {
			return;
		}

		$labels = array(
			'sent'     => __( 'Proposal sent to customer', 'doublescale' ),
			'accepted' => __( 'Proposal accepted by customer', 'doublescale' ),
			'declined' => __( 'Proposal declined by customer', 'doublescale' ),
		);

		$title = sprintf(
			/* translators: 1: event label, 2: proposal number */
			__( '%1$s: %2$s', 'doublescale' ),
			$labels[ $event ] ?? __( 'Proposal update', 'doublescale' ),
			(string) $proposal->proposal_number
		);

		$message = sprintf(
			/* translators: 1: proposal number, 2: subject */
			__( '%1$s — %2$s', 'doublescale' ),
			(string) $proposal->proposal_number,
			(string) $proposal->subject
		);

		if ( ProposalStatus::DECLINED === (string) $proposal->status && $proposal->decline_reason ) {
			$message .= ' — ' . (string) $proposal->decline_reason;
		}

		$this->notify_rep(
			$user_id,
			$title,
			$message,
			$this->proposal_links( $proposal ),
			$subcategory,
			array(
				'proposal_id' => (int) $proposal->id,
				'event'       => $event,
			)
		);
	}

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @return void
	 */
	public function notify_invoice_paid( InvoiceModel $invoice ): void {
		$user_id = $invoice->sale_agent_user_id ? (int) $invoice->sale_agent_user_id : 0;
		if ( $user_id <= 0 ) {
			return;
		}

		$title = sprintf(
			/* translators: %s: invoice number */
			__( 'Invoice paid: %s', 'doublescale' ),
			(string) $invoice->invoice_number
		);

		$message = sprintf(
			/* translators: %s: invoice number */
			__( 'Invoice %s has been paid in full.', 'doublescale' ),
			(string) $invoice->invoice_number
		);

		$this->notify_rep(
			$user_id,
			$title,
			$message,
			$this->invoice_links( $invoice ),
			NotificationCategories::SALES_INVOICE_PAID,
			array(
				'invoice_id' => (int) $invoice->id,
			)
		);
	}

	/**
	 * @param string $event Proposal event key.
	 * @return string|null
	 */
	private function proposal_subcategory_for_event( string $event ): ?string {
		$map = array(
			'sent'     => NotificationCategories::SALES_PROPOSAL_SENT,
			'accepted' => NotificationCategories::SALES_PROPOSAL_ACCEPTED,
			'declined' => NotificationCategories::SALES_PROPOSAL_DECLINED,
		);

		return $map[ $event ] ?? null;
	}

	/**
	 * @param int    $user_id Rep user ID.
	 * @param string $title Notification title.
	 * @param string $message Notification body.
	 * @param array  $links Link payload.
	 * @param string $subcategory Notification subcategory.
	 * @param array  $metadata Optional metadata.
	 * @return void
	 */
	private function notify_rep( int $user_id, string $title, string $message, array $links, string $subcategory, array $metadata = array() ): void {
		if ( ! class_exists( NotificationService::class ) ) {
			return;
		}

		try {
			NotificationService::create( $user_id, $title, $message, $links, $subcategory, $metadata );
		} catch ( \Throwable $e ) {
			if ( function_exists( 'doublescale_get_logger' ) ) {
				doublescale_get_logger()->error(
					'Sales rep notification failed',
					array(
						'source'      => 'sales-rep-notifications',
						'user_id'     => $user_id,
						'subcategory' => $subcategory,
						'error'       => $e->getMessage(),
					)
				);
			}
		}
	}

	/**
	 * @param ProposalModel $proposal Proposal.
	 * @return array{web:string,mobile:string}
	 */
	private function proposal_links( ProposalModel $proposal ): array {
		$id = (int) $proposal->id;
		return array(
			'web'    => admin_url( 'admin.php?page=doublescale&path=sales/proposals/' . $id ),
			'mobile' => '/sales/proposals/' . $id,
		);
	}

	/**
	 * @param InvoiceModel $invoice Invoice.
	 * @return array{web:string,mobile:string}
	 */
	private function invoice_links( InvoiceModel $invoice ): array {
		$id = (int) $invoice->id;
		return array(
			'web'    => admin_url( 'admin.php?page=doublescale&path=sales/invoices/' . $id ),
			'mobile' => '/sales/invoices/' . $id,
		);
	}
}
