<?php
/**
 * Editable templates for sales-rep in-app / email notifications.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Notifications\Services\NotificationCategories;
use DoubleScale\Modules\Documents\Constants\ProposalStatus;
use DoubleScale\Pro\Modules\Contracts\Models\ContractModel;
use DoubleScale\Modules\Documents\Models\InvoiceModel;
use DoubleScale\Modules\Documents\Models\ProposalModel;

/**
 * SalesRepNotificationTemplates service.
 */
final class SalesRepNotificationTemplates {

	/**
	 * @return array<string, array{title: string, message: string}>
	 */
	public static function defaults(): array {
		return array(
			NotificationCategories::SALES_PROPOSAL_SENT     => array(
				'title'   => __( '{event_label}: {proposal_number}', 'doublescale' ),
				'message' => __( '{proposal_number} — {proposal_subject}', 'doublescale' ),
			),
			NotificationCategories::SALES_PROPOSAL_ACCEPTED => array(
				'title'   => __( '{event_label}: {proposal_number}', 'doublescale' ),
				'message' => __( '{proposal_number} — {proposal_subject}', 'doublescale' ),
			),
			NotificationCategories::SALES_PROPOSAL_DECLINED => array(
				'title'   => __( '{event_label}: {proposal_number}', 'doublescale' ),
				'message' => __( '{proposal_number} — {proposal_subject}{decline_reason_suffix}', 'doublescale' ),
			),
			NotificationCategories::SALES_INVOICE_PAID      => array(
				'title'   => __( 'Invoice paid: {invoice_number}', 'doublescale' ),
				'message' => __( 'Invoice {invoice_number} has been paid in full.', 'doublescale' ),
			),
			NotificationCategories::SALES_CONTRACT_SENT     => array(
				'title'   => __( '{event_label}: {contract_number}', 'doublescale' ),
				'message' => __( '{contract_number} — {contract_subject}', 'doublescale' ),
			),
			NotificationCategories::SALES_CONTRACT_SIGNED   => array(
				'title'   => __( '{event_label}: {contract_number}', 'doublescale' ),
				'message' => __( '{contract_number} — {contract_subject}', 'doublescale' ),
			),
		);
	}

	/**
	 * @param string $subcategory Notification subcategory key.
	 * @return array{title: string, message: string}
	 */
	public static function get_template( string $subcategory ): array {
		$defaults = self::defaults();
		$stored   = SalesSettings::get( 'rep_notification_templates', array() );
		$stored   = is_array( $stored ) ? $stored : array();
		$base     = $defaults[ $subcategory ] ?? array(
			'title'   => '',
			'message' => '',
		);
		$custom   = isset( $stored[ $subcategory ] ) && is_array( $stored[ $subcategory ] )
			? $stored[ $subcategory ]
			: array();

		return array(
			'title'   => '' !== trim( (string) ( $custom['title'] ?? '' ) )
				? (string) $custom['title']
				: (string) $base['title'],
			'message' => '' !== trim( (string) ( $custom['message'] ?? '' ) )
				? (string) $custom['message']
				: (string) $base['message'],
		);
	}

	/**
	 * @param string               $subcategory Subcategory key.
	 * @param array<string, mixed> $context Proposal / invoice context.
	 * @return array{title: string, message: string}
	 */
	public static function render( string $subcategory, array $context ): array {
		$template = self::get_template( $subcategory );
		$tokens   = self::build_tokens( $subcategory, $context );

		return array(
			'title'   => SalesEmailTokens::replace( $template['title'], $tokens ),
			'message' => SalesEmailTokens::replace( $template['message'], $tokens ),
		);
	}

	/**
	 * @param string               $subcategory Subcategory key.
	 * @param array<string, mixed> $context Context.
	 * @return array<string, string>
	 */
	private static function build_tokens( string $subcategory, array $context ): array {
		$tokens = array(
			'company_name' => (string) get_bloginfo( 'name' ),
		);

		$proposal = $context['proposal'] ?? null;
		if ( $proposal instanceof ProposalModel ) {
			$event  = isset( $context['event'] ) ? (string) $context['event'] : '';
			$labels = array(
				'sent'     => __( 'Proposal sent to customer', 'doublescale' ),
				'accepted' => __( 'Proposal accepted by customer', 'doublescale' ),
				'declined' => __( 'Proposal declined by customer', 'doublescale' ),
			);

			$tokens['event_label']      = $labels[ $event ] ?? __( 'Proposal update', 'doublescale' );
			$tokens['proposal_number']  = (string) $proposal->proposal_number;
			$tokens['proposal_subject'] = (string) $proposal->subject;
			$tokens['sales_link']       = admin_url( 'admin.php?page=doublescale&path=sales/proposals/' . (int) $proposal->id );

			$decline_suffix = '';
			if ( ProposalStatus::DECLINED === (string) $proposal->status && $proposal->decline_reason ) {
				$decline_suffix = ' — ' . (string) $proposal->decline_reason;
			}
			$tokens['decline_reason_suffix'] = $decline_suffix;
		}

		$invoice = $context['invoice'] ?? null;
		if ( $invoice instanceof InvoiceModel ) {
			$tokens['invoice_number'] = (string) $invoice->invoice_number;
			$tokens['sales_link']     = admin_url( 'admin.php?page=doublescale&path=sales/invoices/' . (int) $invoice->id );
		}

		$contract = $context['contract'] ?? null;
		if ( $contract instanceof ContractModel ) {
			$event  = isset( $context['event'] ) ? (string) $context['event'] : '';
			$labels = array(
				'sent'   => __( 'Contract sent to customer', 'doublescale' ),
				'signed' => __( 'Contract signed by customer', 'doublescale' ),
			);

			$tokens['event_label']       = $labels[ $event ] ?? __( 'Contract update', 'doublescale' );
			$tokens['contract_number']   = (string) $contract->contract_number;
			$tokens['contract_subject']  = (string) $contract->subject;
			$tokens['sales_link']        = admin_url( 'admin.php?page=doublescale&path=sales/contracts/' . (int) $contract->id );
		}

		return $tokens;
	}

	/**
	 * @param mixed $templates Raw templates payload.
	 * @return array<string, array{title: string, message: string}>
	 */
	public static function sanitize_templates( $templates ): array {
		if ( ! is_array( $templates ) ) {
			return array();
		}

		$allowed = array_keys( self::defaults() );
		$clean   = array();

		foreach ( $allowed as $key ) {
			if ( ! isset( $templates[ $key ] ) || ! is_array( $templates[ $key ] ) ) {
				continue;
			}
			$row = $templates[ $key ];
			$clean[ $key ] = array(
				'title'   => isset( $row['title'] ) ? sanitize_text_field( (string) $row['title'] ) : '',
				'message' => isset( $row['message'] ) ? sanitize_textarea_field( (string) $row['message'] ) : '',
			);
		}

		return $clean;
	}
}
