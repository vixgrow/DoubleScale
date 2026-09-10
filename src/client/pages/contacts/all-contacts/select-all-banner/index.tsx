/**
 * wordpress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

interface SelectAllBannerProps {
	/** How many rows are checked on the current page. */
	pageCount: number;
	/** How many contacts match the current filter across every page. */
	total: number;
	/** Whether the selection currently spans the whole filtered set. */
	selectAllMatching: boolean;
	/** Promote the page selection to every matching contact. */
	onSelectAll: () => void;
	/** Drop the selection entirely. */
	onClear: () => void;
}

/**
 * Offers to widen a page-scoped selection to every contact matching the filter.
 *
 * Without this the only way to act on thousands of contacts is to walk the
 * pagination one page at a time.
 */
const SelectAllBanner: React.FC<SelectAllBannerProps> = ({
	pageCount,
	total,
	selectAllMatching,
	onSelectAll,
	onClear,
}) => {
	if (pageCount === 0 && !selectAllMatching) {
		return null;
	}

	// Nothing to widen to when the page already shows every match.
	const canSelectAll = !selectAllMatching && total > pageCount;

	return (
		<div
			className="mb-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg border border-brandPrimary/20 bg-brandPrimary/[0.06] px-4 py-2.5 text-sm"
			data-testid="contacts-select-all-banner"
		>
			<span className="text-foreground">
				{selectAllMatching
					? sprintf(
							/* translators: %s: number of contacts matching the current filter. */
							_n(
								'All %s contact matching this filter is selected.',
								'All %s contacts matching this filter are selected.',
								total,
								'doublescale'
							),
							total.toLocaleString()
						)
					: sprintf(
							/* translators: %s: number of selected rows on the current page. */
							_n(
								'%s contact on this page is selected.',
								'All %s contacts on this page are selected.',
								pageCount,
								'doublescale'
							),
							pageCount.toLocaleString()
						)}
			</span>

			{canSelectAll && (
				<button
					type="button"
					onClick={onSelectAll}
					className="font-medium text-brandPrimary underline underline-offset-2 hover:opacity-80"
				>
					{sprintf(
						/* translators: %s: total number of contacts matching the current filter. */
						_n(
							'Select all %s contact matching this filter',
							'Select all %s contacts matching this filter',
							total,
							'doublescale'
						),
						total.toLocaleString()
					)}
				</button>
			)}

			<button
				type="button"
				onClick={onClear}
				className="font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
			>
				{__('Clear selection', 'doublescale')}
			</button>
		</div>
	);
};

export default SelectAllBanner;
