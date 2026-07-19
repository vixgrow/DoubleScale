/**
 * Document layout — ported from Propovoice (.pv-inv) so the 8 invoice/proposal
 * designs render identically to the source plugin. Structure and class names
 * mirror Propovoice's `pv-inv-one` … `pv-inv-eight` templates.
 */

import React, { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { computeAmount, computeLineItemsTotals } from '../../line-items-editor';
import type { DocumentDesignProps, DocumentDesignParty } from './types';
import { docTypeLabel, formatMoney } from './blocks';

export type LayoutVariant =
	| 'one'
	| 'two'
	| 'three'
	| 'four'
	| 'five'
	| 'six'
	| 'seven'
	| 'eight';

const VARIANT_BY_ID: Record<number, LayoutVariant> = {
	1: 'one',
	2: 'two',
	3: 'three',
	4: 'four',
	5: 'five',
	6: 'six',
	7: 'seven',
	8: 'eight',
};

/* ----------------------------------------------------------------------------
 * Shape SVGs (verbatim from Propovoice build).
 * ------------------------------------------------------------------------- */

const TopShapeTwo: React.FC = () => (
	<div className="pv-inv-top-shape">
		<svg viewBox="0 0 595 69" fill="none">
			<path d="M595 29.2L575.167 22.6C555.333 16 515.667 2.80004 476 7.21378C436.333 11.4625 396.667 33.7375 357 33.6138C317.333 33.7375 277.667 10.0762 238 -3C219.166 -9.32618 198.87 -10.7301 178.5 -10.5162C155.968 -10.2796 133.347 -7.36757 112.514 -0.499996C72.8471 12.8237 39.6666 37.8625 19.8333 53.4137L0 68.8L6.01468e-06 1.38921e-06L19.8333 3.12309e-06C39.6667 4.85698e-06 72.8471 -0.5 112.514 -0.499996C152.18 -0.499993 198.333 -3 238 -3C277.667 -3 308.614 -1.61374 348.28 -1.61374C387.947 -1.61373 427.614 -1.61373 467.28 -1.61373C506.947 -1.61372 555.333 -1.61374 575.167 -1.61374L595 -1.61372L595 29.2Z" />
		</svg>
	</div>
);

const FooterShapeTwo: React.FC = () => (
	<div className="pv-inv-footer-shape">
		<svg viewBox="0 0 595 93" fill="none">
			<path d="M0 39.6L19.8333 46.2C39.6667 52.8 79.3333 66 119 61.5862C158.667 57.3375 198.333 35.0625 238 35.1862C277.667 35.0625 317.333 57.3375 357 70.4137C396.667 83.7375 436.333 87.8625 476 74.7862C515.667 61.4625 555.333 30.9375 575.167 15.3862L595 0V118.8H575.167C555.333 118.8 515.667 118.8 476 118.8C436.333 118.8 396.667 118.8 357 118.8C317.333 118.8 277.667 118.8 238 118.8C198.333 118.8 158.667 118.8 119 118.8C79.3333 118.8 39.6667 118.8 19.8333 118.8H0L0 39.6Z" />
		</svg>
	</div>
);

const CornerShapeThree: React.FC<{ footer?: boolean }> = ({ footer }) => (
	<div className={footer ? 'pv-inv-top-shape pv-inv-footer-shape' : 'pv-inv-top-shape'}>
		<svg width={182} height={183} viewBox="0 0 182 183" fill="none">
			<path d="M0 13H19V160L0 183V13Z" fill="#E2E8F0" />
			<path d="M0 0H19V142.676L0 165V0Z" />
			<path d="M12 0L12 19L159 19L182 -7.43094e-06L12 0Z" fill="#E2E8F0" />
			<path d="M0 0L8.30517e-07 19L142.676 19L165 -7.21238e-06L0 0Z" />
			<circle cx="16.5" cy="16.5" r="16.5" />
		</svg>
	</div>
);

const TopShapeFour: React.FC = () => (
	<div className="pv-inv-top-shape">
		<svg viewBox="0 0 595 117" fill="none">
			<path d="M595 117V0H431.187C475.3 15.874 554.243 51.495 592.739 113.272A68.804 68.804 0 01595 117z" />
			<path d="M478.8 33.838a562.361 562.361 0 00-15.522-6.309c-1.595-.614-3.214-1.249-4.857-1.863a284.849 284.849 0 00-3.785-1.434 419.59 419.59 0 00-5.523-2.049 5.944 5.944 0 01-.548-.204c-2.5-.922-5.023-1.823-7.57-2.725a879.463 879.463 0 00-26.497-8.93 230.619 230.619 0 00-5.38-1.7c-1.262-.41-2.5-.8-3.762-1.189a556.549 556.549 0 00-7.166-2.191A1244.362 1244.362 0 00380.359 0H0v42.072S150.125 5.532 305.678 8.603c.285 0 .571.02.857.02 1.69.041 3.404.062 5.118.123 3.762.103 7.499.205 11.261.37 2.523.081 5.047.183 7.57.327 1.333.04 2.666.123 3.976.184 2.309.123 4.618.266 6.904.41 1.809.102 3.618.225 5.428.348 1.738.102 3.475.246 5.19.369 3.023.225 6.046.47 9.07.737 2.047.164 4.095.348 6.118.553 4.047.39 8.071.799 12.07 1.27 1.786.205 3.571.41 5.357.635.785.082 1.547.184 2.333.287 1.547.184 3.095.389 4.642.594a229.6 229.6 0 013.714.512c1.762.246 3.547.492 5.309.758 2.142.307 4.261.635 6.38.983 1.405.205 2.785.43 4.19.676 1.762.287 3.499.573 5.261.901 2.976.533 5.928 1.065 8.88 1.639a508.69 508.69 0 018.118 1.618c.214.041.452.102.667.143.285.062.595.123.881.185 1.404.307 2.785.594 4.166.921 2.095.451 4.19.922 6.261 1.434.143.02.262.041.405.082 1.309.308 2.595.615 3.904.943.214.04.405.102.619.163 2.381.574 4.761 1.188 7.118 1.803l.024.02c1.809.471 3.595.963 5.38 1.455 3.5.983 6.976 1.987 10.428 3.031 1.856.574 3.69 1.147 5.523 1.741z" />
		</svg>
	</div>
);

const FooterShapeFour: React.FC = () => (
	<div className="pv-inv-footer-shape">
		<svg viewBox="0 0 595 136" fill="none">
			<path d="M595 0v136H431.187C475.3 117.548 554.243 76.143 592.739 4.333A83.63 83.63 0 00595 0z" />
			<path d="M478.8 96.667A520.456 520.456 0 01463.278 104c-1.595.714-3.214 1.452-4.857 2.167a259.519 259.519 0 01-3.785 1.666c-1.833.81-3.666 1.596-5.523 2.381a5.643 5.643 0 00-.548.238 557.224 557.224 0 01-7.57 3.167A798.138 798.138 0 01414.498 124c-1.786.69-3.571 1.333-5.38 1.976-1.262.476-2.5.929-3.762 1.381a510.738 510.738 0 01-7.166 2.548A1120.1 1120.1 0 01380.359 136H0V87.095S150.125 129.571 305.678 126c.285 0 .571-.024.857-.024 1.69-.047 3.404-.071 5.118-.143 3.762-.119 7.499-.238 11.261-.428 2.523-.096 5.047-.215 7.57-.381 1.333-.048 2.666-.143 3.976-.215 2.309-.142 4.618-.309 6.904-.476 1.809-.119 3.618-.262 5.428-.404 1.738-.12 3.475-.286 5.19-.429a592.47 592.47 0 009.07-.857c2.047-.191 4.095-.405 6.118-.643 4.047-.452 8.071-.929 12.07-1.476a409.98 409.98 0 005.357-.738c.785-.096 1.547-.215 2.333-.334 1.547-.214 3.095-.452 4.642-.69 1.238-.191 2.476-.381 3.714-.595 1.762-.286 3.547-.572 5.309-.881 2.142-.357 4.261-.738 6.38-1.143 1.405-.238 2.785-.5 4.19-.786 1.762-.333 3.499-.667 5.261-1.048a539.228 539.228 0 008.88-1.904 452.054 452.054 0 008.118-1.881c.214-.048.452-.119.667-.167.285-.071.595-.143.881-.214 1.404-.357 2.785-.691 4.166-1.072 2.095-.523 4.19-1.071 6.261-1.666.143-.024.262-.048.405-.096 1.309-.357 2.595-.714 3.904-1.095.214-.047.405-.119.619-.19a353.851 353.851 0 007.118-2.095l.024-.024a352.3 352.3 0 005.38-1.691c3.5-1.143 6.976-2.31 10.428-3.523 1.856-.667 3.69-1.334 5.523-2.024z" />
		</svg>
	</div>
);

const ShapeSixSvg: React.FC = () => (
	<div className="pv-inv-shape2">
		<svg viewBox="0 0 209 7" fill="none">
			<path d="M0 0H209L203.5 7H0V0Z" />
		</svg>
	</div>
);

/* ----------------------------------------------------------------------------
 * Shared blocks.
 * ------------------------------------------------------------------------- */

const partyName = (party?: DocumentDesignParty | null): string | null =>
	party && party.lines.length ? party.lines[0] : null;

const partyRest = (party?: DocumentDesignParty | null): string[] =>
	party ? party.lines.slice(1) : [];

const FromLogo: React.FC<{ from?: DocumentDesignParty | null }> = ({ from }) =>
	from && from.logoUrl ? (
		<div className="pv-inv-from-logo">
			<img src={from.logoUrl} alt="" />
		</div>
	) : null;

/** From block — h5 "From", h6 company name, p address lines. */
const FromBlock: React.FC<{ from?: DocumentDesignParty | null }> = ({ from }) => {
	if (!from) {
		return null;
	}
	const name = partyName(from);
	const rest = partyRest(from);
	return (
		<>
			<h5>{__('From', 'doublescale')}</h5>
			{name ? <h6>{name}</h6> : null}
			<p>
				{rest.map((line, i) => (
					<Fragment key={i}>
						{line}
						{i < rest.length - 1 ? <br /> : null}
					</Fragment>
				))}
			</p>
		</>
	);
};

/** Bill-to block — h5 "Bill to", h6 name, p address lines. */
const ToBlock: React.FC<{ party?: DocumentDesignParty | null }> = ({ party }) => {
	if (!party) {
		return null;
	}
	const name = partyName(party);
	const rest = partyRest(party);
	return (
		<>
			<h5>{party.label}</h5>
			{name ? <h6>{name}</h6> : null}
			<p>
				{rest.map((line, i) => (
					<Fragment key={i}>
						{line}
						{i < rest.length - 1 ? <br /> : null}
					</Fragment>
				))}
			</p>
		</>
	);
};

/** Invoice No / Date / Due Date block. */
const DatesBlock: React.FC<{
	number: string;
	numberLabel: string;
	dates: DocumentDesignProps['dates'];
}> = ({ number, numberLabel, dates }) => (
	<>
		<p>
			{numberLabel}: <span>{number}</span>
		</p>
		{dates.map((d) => (
			<p key={d.label}>
				{d.label}: <span>{d.value || ''}</span>
			</p>
		))}
	</>
);

const ItemsTable: React.FC<
	Pick<DocumentDesignProps, 'lineItems' | 'currency' | 'showTax'>
> = ({ lineItems, currency, showTax }) => {
	const rows = lineItems.filter((item) => !item.optional);
	return (
		<div className="pv-inv-items">
			<table>
				<thead>
					<tr>
						<th style={{ width: '35px' }}>{__('SL.', 'doublescale')}</th>
						<th style={{ width: 'auto' }}>
							{__('Item Description', 'doublescale')}
						</th>
						<th style={{ width: '125px' }}>{__('Unit', 'doublescale')}</th>
						<th style={{ width: '135px' }}>{__('Rate', 'doublescale')}</th>
						<th style={{ width: '90px' }}>{__('Amount', 'doublescale')}</th>
						{showTax ? (
							<th style={{ width: '90px' }}>{__('Tax', 'doublescale')}</th>
						) : null}
					</tr>
				</thead>
				<tbody>
					{rows.map((item, index) => (
						<tr key={index}>
							<td>{index + 1}.</td>
							<td>
								{item.description || '—'}
								{item.long_description ? (
									<>
										<br />
										<span>{item.long_description}</span>
									</>
								) : null}
							</td>
							<td>
								{item.qty}
								{item.unit ? <span> {item.unit}</span> : null}
							</td>
							<td style={{ whiteSpace: 'nowrap' }}>
								{formatMoney(item.rate, currency)}
							</td>
							<td style={{ whiteSpace: 'nowrap' }}>
								{formatMoney(computeAmount(item), currency)}
							</td>
							{showTax ? (
								<td style={{ whiteSpace: 'nowrap' }}>
									{(item.tax || [])
										.map((t) => `${t.name} (${t.rate}%)`)
										.join(', ') || '—'}
								</td>
							) : null}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

const TotalTable: React.FC<
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
	const due =
		props.amountPaid !== undefined
			? Math.max(0, props.total - props.amountPaid)
			: undefined;

	return (
		<div className="pv-inv-total">
			<table>
				<tbody>
					<tr className="pv-inv-e-bold subtotal">
						<th>{__('Subtotal', 'doublescale')}</th>
						<td>{formatMoney(props.subtotal, props.currency)}</td>
					</tr>
					{(props.totalTax || 0) > 0 ? (
						<tr className="pv-inv-e-bold">
							<th>{__('Tax', 'doublescale')}</th>
							<td>{formatMoney(props.totalTax || 0, props.currency)}</td>
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
					<tr className="pv-inv-table-bg">
						<th>{__('Total', 'doublescale')}</th>
						<td>{formatMoney(props.total, props.currency)}</td>
					</tr>
					{props.amountPaid !== undefined && props.amountPaid > 0 ? (
						<tr>
							<th>{__('Amount Paid', 'doublescale')}</th>
							<td>{formatMoney(props.amountPaid, props.currency)}</td>
						</tr>
					) : null}
					{props.amountPaid !== undefined &&
					props.amountPaid > 0 &&
					due !== undefined &&
					due > 0 ? (
						<tr className="pv-inv-e-bold">
							<th>{__('Due', 'doublescale')}</th>
							<td>{formatMoney(due, props.currency)}</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	);
};

const BankInfo: React.FC<{ placeholder?: boolean }> = ({ placeholder }) => {
	if (!placeholder) {
		return null;
	}

	return (
		<div className="pv-inv-bank">
			<h4>{__('Bank info', 'doublescale')}</h4>
			<div className="pv-bank-info">
				<p>
					<strong>{__('Name:', 'doublescale')}</strong>
				</p>
				<p>
					<strong>{__('Account no:', 'doublescale')}</strong>
				</p>
				<p>
					<strong>{__('Bank info:', 'doublescale')}</strong>
				</p>
			</div>
		</div>
	);
};

const SignatureBlock: React.FC = () => (
	<div className="pv-inv-sign">
		<div className="pv-inv-sign__line" />
	</div>
);

const Sections: React.FC<{ sections?: DocumentDesignProps['sections'] }> = ({
	sections,
}) =>
	sections && sections.length ? (
		<div className="pv-inv-sections">
			{sections.map((section, i) => (
				<div className="pv-inv-section" key={i}>
					{section.title ? (
						<h4 className="pv-inv-section-title">{section.title}</h4>
					) : null}
					<div className="pv-inv-section-content">
						<p>{section.body}</p>
					</div>
				</div>
			))}
		</div>
	) : null;

/* ----------------------------------------------------------------------------
 * Main layout.
 * ------------------------------------------------------------------------- */

export const DoubleScaleLayout: React.FC<
	DocumentDesignProps & { designId: number }
> = ({ designId, ...props }) => {
	const variant = VARIANT_BY_ID[designId] || 'one';
	const numberLabel = props.docType === 'invoice'
		? __('Invoice No', 'doublescale')
		: __('Proposal No', 'doublescale');
	const title = docTypeLabel(props.docType);
	const billTo = props.parties[0];
	const from = props.from;

	const rootStyle = props.accentColor
		? ({ '--pv-inv-primary': props.accentColor } as React.CSSProperties)
		: undefined;

	const account = (
		<div className="pv-inv-account">
			<BankInfo />
			<TotalTable {...props} />
		</div>
	);

	const items = (
		<ItemsTable
			lineItems={props.lineItems}
			currency={props.currency}
			showTax={props.showTax}
		/>
	);

	// Templates with border frame on the outer .pv-inv element.
	const borderBottom = ['two', 'six', 'seven', 'eight'].includes(variant)
		? ' pv-inv--border-bottom'
		: '';
	const borderTop = variant === 'six' ? ' pv-inv--border-top' : '';

	/* ----- Template 1 ----- */
	if (variant === 'one') {
		return (
			<div className="pv-inv" style={rootStyle}>
				<div className="pv-inv-one">
					<div className="pv-inv-body">
						<div className="pv-inv-header">
							<div className="pv-inv-from">
								<FromLogo from={from} />
								<FromBlock from={from} />
								<div className="pv-inv-from-date">
									<DatesBlock
										number={props.number}
										numberLabel={numberLabel}
										dates={props.dates}
									/>
								</div>
							</div>
							<div className="pv-inv-to">
								<div className="pv-inv-title">
									<h2>{title}</h2>
								</div>
								<ToBlock party={billTo} />
							</div>
						</div>
						{items}
						{account}
						<Sections sections={props.sections} />
					</div>
				</div>
			</div>
		);
	}

	/* ----- Template 2 ----- */
	if (variant === 'two') {
		return (
			<div className={`pv-inv${borderBottom}`} style={rootStyle}>
				<div className="pv-inv-two">
					<TopShapeTwo />
					<div className="pv-inv-body">
						<div className="pv-inv-header">
							<div className="pv-inv-from">
								<FromLogo from={from} />
								<FromBlock from={from} />
								<div className="pv-inv-from-date">
									<DatesBlock
										number={props.number}
										numberLabel={numberLabel}
										dates={props.dates}
									/>
								</div>
							</div>
							<div className="pv-inv-to">
								<div className="pv-inv-title">
									<h2>{title}</h2>
								</div>
								<ToBlock party={billTo} />
							</div>
						</div>
						{items}
						{account}
						<Sections sections={props.sections} />
					</div>
					<FooterShapeTwo />
				</div>
			</div>
		);
	}

	/* ----- Template 3 ----- */
	if (variant === 'three') {
		return (
			<div className="pv-inv" style={rootStyle}>
				<div className="pv-inv-three">
					<div className="pv-inv-body">
						<CornerShapeThree />
						<div className="pv-inv-title">
							<h2>{title}</h2>
						</div>
						<div className="pv-inv-header">
							<div className="pv-inv-from">
								<FromLogo from={from} />
								<FromBlock from={from} />
								<div className="pv-inv-from-date">
									<DatesBlock
										number={props.number}
										numberLabel={numberLabel}
										dates={props.dates}
									/>
								</div>
							</div>
							<div className="pv-inv-to">
								<ToBlock party={billTo} />
							</div>
						</div>
						{items}
						{account}
						<Sections sections={props.sections} />
						<CornerShapeThree footer />
					</div>
				</div>
			</div>
		);
	}

	/* ----- Template 4 ----- */
	if (variant === 'four') {
		return (
			<div className="pv-inv" style={rootStyle}>
				<div className="pv-inv-four">
					<TopShapeFour />
					<div className="pv-inv-body">
						<div className="pv-inv-title">
							<h2>{title}</h2>
						</div>
						<div className="pv-inv-header">
							<div className="pv-inv-from">
								<FromLogo from={from} />
								<FromBlock from={from} />
								<div className="pv-inv-from-date">
									<DatesBlock
										number={props.number}
										numberLabel={numberLabel}
										dates={props.dates}
									/>
								</div>
							</div>
							<div className="pv-inv-to">
								<ToBlock party={billTo} />
							</div>
						</div>
						{items}
						<div className="pv-inv-four-bottom">
							<div className="pv-inv-four-bottom__left">
								<BankInfo placeholder />
								<Sections sections={props.sections} />
							</div>
							<TotalTable {...props} />
						</div>
						<SignatureBlock />
					</div>
					<FooterShapeFour />
				</div>
			</div>
		);
	}

	/* ----- Template 5 ----- */
	if (variant === 'five') {
		return (
			<div className="pv-inv" style={rootStyle}>
				<div className="pv-inv-five">
					<div className="pv-inv-body">
						<div className="pv-inv-header">
							<div className="pv-inv-head">
								<div className="pv-inv-from-logo">
									{from && from.logoUrl ? (
										<img src={from.logoUrl} alt="" />
									) : partyName(from) ? (
										<h6>{partyName(from)}</h6>
									) : null}
								</div>
								<div className="pv-inv-from-date">
									<div className="pv-inv-title">
										<h2>{title}</h2>
									</div>
									<DatesBlock
										number={props.number}
										numberLabel={numberLabel}
										dates={props.dates}
									/>
								</div>
							</div>
							<div className="pv-inv-shapes">
								<div className="pv-inv-shape1" />
								<div className="pv-inv-shape2" />
							</div>
							<div className="pv-inv-address">
								<div className="pv-inv-from">
									<FromBlock from={from} />
								</div>
								<div className="pv-inv-to">
									<ToBlock party={billTo} />
								</div>
							</div>
						</div>
						<div className="pv-inv-item-wrap">
							{items}
							{account}
							<Sections sections={props.sections} />
						</div>
					</div>
				</div>
			</div>
		);
	}

	/* ----- Template 6 ----- */
	if (variant === 'six') {
		return (
			<div className={`pv-inv${borderBottom}${borderTop}`} style={rootStyle}>
				<div className="pv-inv-six">
					<div className="pv-inv-body">
						<div className="pv-inv-header">
							<div className="pv-inv-head">
								<div className="pv-inv-from-logo">
									{from && from.logoUrl ? (
										<img src={from.logoUrl} alt="" />
									) : partyName(from) ? (
										<h6>{partyName(from)}</h6>
									) : null}
								</div>
								<div className="pv-inv-from-date">
									<div className="pv-inv-title">
										<h2>{title}</h2>
									</div>
									<DatesBlock
										number={props.number}
										numberLabel={numberLabel}
										dates={props.dates}
									/>
								</div>
							</div>
							<div className="pv-inv-shapes">
								<ShapeSixSvg />
								<div className="pv-inv-shape1" />
							</div>
							<div className="pv-inv-address">
								<div className="pv-inv-from">
									<FromBlock from={from} />
								</div>
								<div className="pv-inv-to">
									<ToBlock party={billTo} />
								</div>
							</div>
						</div>
						<div className="pv-inv-item-wrap">
							{items}
							{account}
							<Sections sections={props.sections} />
						</div>
					</div>
				</div>
			</div>
		);
	}

	/* ----- Template 7 ----- */
	if (variant === 'seven') {
		return (
			<div className={`pv-inv${borderBottom}`} style={rootStyle}>
				<div className="pv-inv-seven">
					<div className="pv-inv-body">
						<div className="pv-inv-header">
							<div className="pv-inv-head">
								<div className="pv-inv-from-logo">
									{from && from.logoUrl ? (
										<img src={from.logoUrl} alt="" />
									) : partyName(from) ? (
										<h6>{partyName(from)}</h6>
									) : null}
								</div>
								<div className="pv-inv-from">
									<FromBlock from={from} />
								</div>
							</div>
							<div className="pv-inv-shapes">
								<div className="pv-inv-shape1" />
								<div className="pv-inv-title">
									<h2>{title}</h2>
								</div>
								<div className="pv-inv-shape2" />
							</div>
							<div className="pv-inv-address">
								<div className="pv-inv-to">
									<ToBlock party={billTo} />
								</div>
								<div className="pv-inv-from-date">
									<DatesBlock
										number={props.number}
										numberLabel={numberLabel}
										dates={props.dates}
									/>
								</div>
							</div>
						</div>
						<div className="pv-inv-item-wrap">
							{items}
							{account}
							<Sections sections={props.sections} />
						</div>
					</div>
				</div>
			</div>
		);
	}

	/* ----- Template 8 ----- */
	return (
		<div className={`pv-inv${borderBottom}`} style={rootStyle}>
			<div className="pv-inv-eight">
				<div className="pv-inv-body">
					<div className="pv-inv-title">
						<h2>{title}</h2>
					</div>
					<div className="pv-inv-header">
						<div className="pv-inv-head">
							<div className="pv-inv-from-logo">
								{from && from.logoUrl ? (
									<img src={from.logoUrl} alt="" />
								) : partyName(from) ? (
									<h6>{partyName(from)}</h6>
								) : null}
							</div>
							<div className="pv-inv-from">
								<FromBlock from={from} />
							</div>
						</div>
						<div className="pv-inv-shapes" />
						<div className="pv-inv-address">
							<div className="pv-inv-to">
								<ToBlock party={billTo} />
							</div>
							<div className="pv-inv-from-date">
								<DatesBlock
									number={props.number}
									numberLabel={numberLabel}
									dates={props.dates}
								/>
							</div>
						</div>
					</div>
					<div className="pv-inv-item-wrap">
						{items}
						{account}
						<Sections sections={props.sections} />
					</div>
				</div>
			</div>
		</div>
	);
};
