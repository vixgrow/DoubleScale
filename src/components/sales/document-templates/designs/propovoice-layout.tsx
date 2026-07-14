/**
 * DoubleScale document layout — 8 visual variants.
 * Structure mirrors gallery thumbs so applied preview matches the card image.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { computeAmount, computeLineItemsTotals } from '../../line-items-editor';
import type { DocumentDesignProps } from './types';
import { docTypeLabel, formatMoney } from './blocks';

export type LayoutVariant =
	| 'classic'
	| 'wave'
	| 'corners'
	| 'wave-full'
	| 'minimal'
	| 'boxed'
	| 'bar'
	| 'sidebar';

const CornerSwoosh: React.FC<{ className?: string }> = ({ className }) => (
	<svg className={className} viewBox="0 0 180 140" aria-hidden="true">
		<path d="M0,0 H180 C140,18 110,55 95,95 C70,150 30,140 0,140 Z" />
	</svg>
);

/** Gold Wave top — thin band with scalloped lower edge (matches gallery thumb). */
const WaveBannerTop: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		className={className}
		viewBox="0 0 800 36"
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<path d="M0,0 H800 V18 C733,34 667,8 600,20 C533,32 467,6 400,20 C333,34 267,8 200,20 C133,32 67,6 0,18 Z" />
	</svg>
);

/** Gold Wave bottom — thin band with scalloped upper edge. */
const WaveBannerBottom: React.FC<{ className?: string }> = ({ className }) => (
	<svg
		className={className}
		viewBox="0 0 800 36"
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<path d="M0,36 H800 V18 C733,2 667,28 600,16 C533,4 467,30 400,16 C333,2 267,28 200,16 C133,4 67,30 0,18 Z" />
	</svg>
);

const LineItems: React.FC<
	Pick<DocumentDesignProps, 'lineItems' | 'currency' | 'showTax'>
> = ({ lineItems, currency, showTax }) => {
	const rows = lineItems.filter((item) => !item.optional);
	const colSpan = showTax ? 5 : 4;
	return (
		<div className="ds-sales-doc__items">
			<table>
				<thead>
					<tr>
						<th className="is-sl">{__('SL.', 'doublescale')}</th>
						<th>{__('Item Description', 'doublescale')}</th>
						<th className="is-right">{__('Qty', 'doublescale')}</th>
						<th className="is-right">{__('Rate', 'doublescale')}</th>
						{showTax ? (
							<th className="is-right">{__('Tax', 'doublescale')}</th>
						) : null}
						<th className="is-right">{__('Amount', 'doublescale')}</th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 ? (
						<tr>
							<td colSpan={colSpan + 1} className="ds-sales-doc__items-empty">
								{__('No line items.', 'doublescale')}
							</td>
						</tr>
					) : (
						rows.map((item, index) => (
							<tr key={index}>
								<td className="is-sl">
									{String(index + 1).padStart(2, '0')}.
								</td>
								<td>
									<div className="ds-sales-doc__items-name">
										{item.description || '—'}
									</div>
									{item.long_description ? (
										<div className="ds-sales-doc__items-desc">
											{item.long_description}
										</div>
									) : null}
								</td>
								<td className="is-right">{item.qty}</td>
								<td className="is-right">
									{formatMoney(item.rate, currency)}
								</td>
								{showTax ? (
									<td className="is-right">
										{(item.tax || [])
											.map((t) => `${t.name} (${t.rate}%)`)
											.join(', ') || '—'}
									</td>
								) : null}
								<td className="is-right">
									{formatMoney(computeAmount(item), currency)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
};

const Totals: React.FC<
	Pick<
		DocumentDesignProps,
		| 'subtotal'
		| 'totalTax'
		| 'discountType'
		| 'discountValue'
		| 'adjustment'
		| 'total'
		| 'amountPaid'
		| 'currency'
		| 'lineItems'
	>
> = (props) => {
	const computed = computeLineItemsTotals(
		props.lineItems,
		props.discountType,
		props.discountValue,
		props.adjustment
	);
	const balance =
		props.amountPaid !== undefined
			? Math.max(0, props.total - props.amountPaid)
			: undefined;

	return (
		<div className="ds-sales-doc__totals">
			<table>
				<tbody>
					<tr>
						<th>{__('Subtotal', 'doublescale')}</th>
						<td>{formatMoney(props.subtotal, props.currency)}</td>
					</tr>
					{(props.totalTax || 0) > 0 ? (
						<tr>
							<th>{__('Tax', 'doublescale')}</th>
							<td>
								{formatMoney(props.totalTax || 0, props.currency)}
							</td>
						</tr>
					) : null}
					{computed.discount > 0 ? (
						<tr>
							<th>{__('Discount', 'doublescale')}</th>
							<td>-{formatMoney(computed.discount, props.currency)}</td>
						</tr>
					) : null}
					{props.adjustment !== 0 ? (
						<tr>
							<th>{__('Adjustment', 'doublescale')}</th>
							<td>{formatMoney(props.adjustment, props.currency)}</td>
						</tr>
					) : null}
					<tr className="is-total-bar">
						<th>{__('Total', 'doublescale')}</th>
						<td>{formatMoney(props.total, props.currency)}</td>
					</tr>
					{props.amountPaid !== undefined ? (
						<>
							<tr>
								<th>{__('Amount Paid', 'doublescale')}</th>
								<td>
									{formatMoney(props.amountPaid, props.currency)}
								</td>
							</tr>
							<tr className="is-balance">
								<th>{__('Balance Due', 'doublescale')}</th>
								<td>
									{formatMoney(balance ?? 0, props.currency)}
								</td>
							</tr>
						</>
					) : null}
				</tbody>
			</table>
		</div>
	);
};

const PartyLines: React.FC<{ label: string; lines: string[] }> = ({
	label,
	lines,
}) => (
	<div className="ds-sales-doc__party">
		<h5 className="ds-sales-doc__party-label">{label}</h5>
		{lines.length ? (
			lines.map((line, i) => (
				<p key={`${line}-${i}`} className="ds-sales-doc__party-line">
					{line}
				</p>
			))
		) : (
			<p className="ds-sales-doc__party-line">—</p>
		)}
	</div>
);

export const PropovoiceLayout: React.FC<
	DocumentDesignProps & { variant: LayoutVariant; designId: number }
> = ({ variant, designId, ...props }) => {
	const title = docTypeLabel(props.docType);
	const billTo = props.parties[0];
	const from = props.from;
	const showWave = variant === 'wave' || variant === 'wave-full';
	const showCorners = variant === 'corners';
	const showQuadCorners = showCorners && designId === 2;
	const showBar = variant === 'bar';
	const showSidebar = variant === 'sidebar';
	const showSlant = variant === 'boxed';
	const centerTitle = designId === 3 || designId === 4;
	/** Classic / wave / corners: company left, title + bill-to right (thumb layout). */
	const splitHero = [1, 2].includes(designId);

	const accentStyle = props.accentColor
		? ({
				'--ds-doc-primary': props.accentColor,
				'--ds-doc-header-bg': props.accentColor,
				'--ds-doc-thead-bg': props.accentColor,
				'--ds-doc-thead-fg': '#ffffff',
				'--ds-doc-total-bg': props.accentColor,
			} as React.CSSProperties)
		: undefined;

	const datesBlock = (
		<div className="ds-sales-doc__dates">
			{props.dates.map((d) => (
				<div key={d.label} className="ds-sales-doc__date-row">
					<span className="ds-sales-doc__date-label">{d.label}:</span>
					{d.value || '—'}
				</div>
			))}
		</div>
	);

	const statusBadges =
		props.statusBadges.length > 0 ? (
			<div className="ds-sales-doc__status-group">
				{props.statusBadges.map((badge) => (
					<span key={badge.label} className={badge.className}>
						{badge.label}
					</span>
				))}
			</div>
		) : null;

	return (
		<div
			className={`ds-sales-doc ds-sales-doc--pv ds-sales-doc--design-${designId} ds-sales-doc--variant-${variant}`}
			style={accentStyle}
		>
			{showWave ? (
				<div
					className="ds-sales-doc__ornament ds-sales-doc__ornament--top ds-sales-doc__ornament--wave"
					aria-hidden="true"
				>
					<WaveBannerTop />
				</div>
			) : null}

			{showCorners ? (
				<>
					<div
						className="ds-sales-doc__ornament ds-sales-doc__ornament--corner-tl"
						aria-hidden="true"
					>
						<CornerSwoosh />
					</div>
					{showQuadCorners ? (
						<>
							<div
								className="ds-sales-doc__ornament ds-sales-doc__ornament--corner-tr"
								aria-hidden="true"
							>
								<CornerSwoosh />
							</div>
							<div
								className="ds-sales-doc__ornament ds-sales-doc__ornament--corner-bl"
								aria-hidden="true"
							>
								<CornerSwoosh />
							</div>
						</>
					) : null}
					<div
						className="ds-sales-doc__ornament ds-sales-doc__ornament--corner-br"
						aria-hidden="true"
					>
						<CornerSwoosh />
					</div>
				</>
			) : null}

			{showSidebar ? (
				<div className="ds-sales-doc__side-tab" aria-hidden="true">
					<span>{title}</span>
				</div>
			) : null}

			<div className="ds-sales-doc__body">
				{showBar ? (
					<div className="ds-sales-doc__title-bar">
						<div className="ds-sales-doc__brand-mark">
							{from?.lines?.[0] || title}
						</div>
						<h2 className="ds-sales-doc__doc-type-in-bar">{title}</h2>
					</div>
				) : null}

				{showSlant ? (
					<div className="ds-sales-doc__slant-bar" aria-hidden="true" />
				) : null}

				{splitHero ? (
					<div className="ds-sales-doc__hero ds-sales-doc__hero--split">
						<div className="ds-sales-doc__hero-left">
							<div className="ds-sales-doc__brand">
								{from?.lines?.[0] || __('Your Company', 'doublescale')}
							</div>
							{from ? (
								<div className="ds-sales-doc__brand-lines">
									{from.lines.slice(1).map((line, i) => (
										<p key={i}>{line}</p>
									))}
								</div>
							) : null}
							{datesBlock}
						</div>
						<div className="ds-sales-doc__hero-right">
							<p className="ds-sales-doc__doc-type">{title}</p>
							{billTo ? (
								<PartyLines label={billTo.label} lines={billTo.lines} />
							) : null}
							<p className="ds-sales-doc__number">{props.number}</p>
							{props.subject ? (
								<p className="ds-sales-doc__subject">{props.subject}</p>
							) : null}
							{statusBadges}
						</div>
					</div>
				) : centerTitle ? (
					<div className="ds-sales-doc__hero ds-sales-doc__hero--centered">
						<p className="ds-sales-doc__doc-type">{title}</p>
						<div className="ds-sales-doc__hero-split-meta">
							<div className="ds-sales-doc__hero-left">
								<div className="ds-sales-doc__brand">
									{from?.lines?.[0] || __('Your Company', 'doublescale')}
								</div>
								{from ? (
									<div className="ds-sales-doc__brand-lines">
										{from.lines.slice(1).map((line, i) => (
											<p key={i}>{line}</p>
										))}
									</div>
								) : null}
								{datesBlock}
							</div>
							<div className="ds-sales-doc__hero-right">
								{billTo ? (
									<PartyLines
										label={billTo.label}
										lines={billTo.lines}
									/>
								) : null}
								<p className="ds-sales-doc__number">{props.number}</p>
								{statusBadges}
							</div>
						</div>
					</div>
				) : (
					<>
						<div
							className={`ds-sales-doc__header${
								showSidebar || variant === 'minimal'
									? ' ds-sales-doc__header--top-row'
									: ''
							}`}
						>
							<div className="ds-sales-doc__title-block">
								{!showBar && !showSidebar ? (
									<p className="ds-sales-doc__doc-type">{title}</p>
								) : null}
								{showBar ? (
									<p className="ds-sales-doc__number">{props.number}</p>
								) : !showSidebar ? (
									<h2 className="ds-sales-doc__number">{props.number}</h2>
								) : (
									<div className="ds-sales-doc__brand">
										{from?.lines?.[0] ||
											__('Your Company', 'doublescale')}
									</div>
								)}
								{props.subject ? (
									<p className="ds-sales-doc__subject">{props.subject}</p>
								) : null}
								{statusBadges}
							</div>
							{datesBlock}
						</div>

						<div
							className={`ds-sales-doc__meta${
								variant === 'boxed' || variant === 'bar'
									? ' ds-sales-doc__meta--boxed'
									: ''
							}`}
						>
							{!showSidebar && from ? (
								<PartyLines label={from.label} lines={from.lines} />
							) : null}
							{showSidebar && from ? (
								<div className="ds-sales-doc__company-top">
									{from.lines.slice(1).map((line, i) => (
										<p key={i} className="ds-sales-doc__party-line">
											{line}
										</p>
									))}
								</div>
							) : null}
							{billTo ? (
								<PartyLines label={billTo.label} lines={billTo.lines} />
							) : null}
							{props.parties.slice(1).map((party) => (
								<PartyLines key={party.label} {...party} />
							))}
						</div>
					</>
				)}

				{splitHero || centerTitle ? null : null}

				{/* Extra parties for split/centered heroes */}
				{(splitHero || centerTitle) && props.parties.length > 1 ? (
					<div className="ds-sales-doc__meta">
						{props.parties.slice(1).map((party) => (
							<PartyLines key={party.label} {...party} />
						))}
					</div>
				) : null}

				<LineItems
					lineItems={props.lineItems}
					currency={props.currency}
					showTax={props.showTax}
				/>

				<div className="ds-sales-doc__footer">
					<div className="ds-sales-doc__notes">
						{(props.sections || []).map((section) => (
							<div key={section.title} className="ds-sales-doc__section">
								<h4 className="ds-sales-doc__section-title">
									{section.title}
								</h4>
								<p className="ds-sales-doc__section-body">{section.body}</p>
							</div>
						))}
					</div>
					<Totals {...props} />
				</div>
			</div>

			{showWave ? (
				<div
					className="ds-sales-doc__ornament ds-sales-doc__ornament--bottom ds-sales-doc__ornament--wave"
					aria-hidden="true"
				>
					<WaveBannerBottom />
				</div>
			) : null}
		</div>
	);
};
