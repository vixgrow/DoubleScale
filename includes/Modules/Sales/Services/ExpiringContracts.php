<?php
/**
 * Mark active contracts as expired when past end date.
 *
 * @package DoubleScale\Modules\Sales
 */

namespace DoubleScale\Modules\Sales\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Sales\Constants\ContractStatus;
use DoubleScale\Modules\Sales\Models\ContractModel;

/**
 * ExpiringContracts service.
 */
final class ExpiringContracts {

	/**
	 * @return int Number of contracts marked expired.
	 */
	public function run(): int {
		$today = current_time( 'Y-m-d' );

		$contracts = ContractModel::query()
			->where( 'status', ContractStatus::ACTIVE )
			->whereNotNull( 'end_date' )
			->where( 'end_date', '<', $today )
			->get();

		$updated = 0;
		foreach ( $contracts as $contract ) {
			$contract->status = ContractStatus::EXPIRED;
			$contract->save();
			++$updated;
		}

		return $updated;
	}
}
