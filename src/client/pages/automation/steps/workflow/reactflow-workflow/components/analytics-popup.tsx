/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';
import { X } from 'lucide-react';

interface AnalyticsPopupProps {
	visible: boolean;
	onClose: () => void;
	actionType: 'email' | 'sms' | 'whatsapp';
	analytics?: {
		sent?: number;
		clickRate?: number;
		unsubscribed?: number;
		openRate?: number;
		clickToOpenRate?: number;
	};
}

const AnalyticsPopup: React.FC<AnalyticsPopupProps> = ({
	visible,
	onClose,
	actionType,
	analytics = {},
}) => {
	if (!visible) return null;

	const {
		sent = 1836,
		clickRate = 9.8,
		unsubscribed = 0.8,
		openRate = 72,
		clickToOpenRate = 9.3,
	} = analytics;

	// Get proper label based on action type
	const getActionLabel = () => {
		switch (actionType) {
			case 'email':
				return __('Email', 'quillcrm');
			case 'sms':
				return __('SMS', 'quillcrm');
			case 'whatsapp':
				return __('WhatsApp', 'quillcrm');
			default:
				return __('Message', 'quillcrm');
		}
	};

	const actionLabel = getActionLabel();

	// Render email-specific metrics
	const renderEmailMetrics = () => (
		<>
			<div className="qcrm-analytics-popup__metric" data-color="blue">
				<div className="qcrm-analytics-popup__metric-icon qcrm-analytics-popup__metric-icon--blue">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M14 12L18 16M18 12L14 16"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div>
					<div className="qcrm-analytics-popup__metric-value">
						{sent.toLocaleString()}
					</div>
					<div className="qcrm-analytics-popup__metric-label">
						{__('Sent Emails', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="qcrm-analytics-popup__metric" data-color="purple">
				<div className="qcrm-analytics-popup__metric-icon qcrm-analytics-popup__metric-icon--purple">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M9 11L12 14L15 11"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div>
					<div className="qcrm-analytics-popup__metric-value">
						{clickRate.toFixed(1)}%
					</div>
					<div className="qcrm-analytics-popup__metric-label">
						{__('Click Rate', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="qcrm-analytics-popup__metric" data-color="red">
				<div className="qcrm-analytics-popup__metric-icon qcrm-analytics-popup__metric-icon--red">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M9 12H15"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div>
					<div className="qcrm-analytics-popup__metric-value">
						{unsubscribed.toFixed(2)}%
					</div>
					<div className="qcrm-analytics-popup__metric-label">
						{__('Unsubscribed', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="qcrm-analytics-popup__metric" data-color="green">
				<div className="qcrm-analytics-popup__metric-icon qcrm-analytics-popup__metric-icon--green">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div>
					<div className="qcrm-analytics-popup__metric-value">
						{openRate}%
					</div>
					<div className="qcrm-analytics-popup__metric-label">
						{__('Open Rate', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="qcrm-analytics-popup__metric" data-color="orange">
				<div className="qcrm-analytics-popup__metric-icon qcrm-analytics-popup__metric-icon--orange">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							x="3"
							y="5"
							width="18"
							height="14"
							rx="2"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M3 9H21"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<text
							x="12"
							y="15"
							fontSize="8"
							fill="currentColor"
							textAnchor="middle"
							fontWeight="bold"
						>
							CTR
						</text>
					</svg>
				</div>
				<div>
					<div className="qcrm-analytics-popup__metric-value">
						{clickToOpenRate.toFixed(1)}%
					</div>
					<div className="qcrm-analytics-popup__metric-label">
						{__('Click to open rate', 'quillcrm')}
					</div>
				</div>
			</div>
		</>
	);

	// Render SMS/WhatsApp metrics
	const renderSMSMetrics = () => (
		<>
			<div className="qcrm-analytics-popup__metric" data-color="blue">
				<div className="qcrm-analytics-popup__metric-icon qcrm-analytics-popup__metric-icon--blue">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M22 2L11 13"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M22 2L15 22L11 13L2 9L22 2Z"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div>
					<div className="qcrm-analytics-popup__metric-value">
						{sent.toLocaleString()}
					</div>
					<div className="qcrm-analytics-popup__metric-label">
						{__('Sent Emails', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="qcrm-analytics-popup__metric" data-color="purple">
				<div className="qcrm-analytics-popup__metric-icon qcrm-analytics-popup__metric-icon--purple">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							x="5"
							y="2"
							width="14"
							height="20"
							rx="2"
							stroke="currentColor"
							strokeWidth="2"
						/>
						<path
							d="M9 18H15"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
						<circle cx="12" cy="9" r="2" fill="currentColor" />
						<path
							d="M8 11C8 11 9 13 12 13C15 13 16 11 16 11"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
				</div>
				<div>
					<div className="qcrm-analytics-popup__metric-value">
						{clickRate.toFixed(1)}%
					</div>
					<div className="qcrm-analytics-popup__metric-label">
						{__('Click Rate', 'quillcrm')}
					</div>
				</div>
			</div>

			<div className="qcrm-analytics-popup__metric" data-color="red">
				<div className="qcrm-analytics-popup__metric-icon qcrm-analytics-popup__metric-icon--red">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<circle
							cx="12"
							cy="10"
							r="2"
							stroke="currentColor"
							strokeWidth="2"
						/>
						<path
							d="M9 14H15"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
						<path
							d="M12 10V14"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
						/>
					</svg>
				</div>
				<div>
					<div className="qcrm-analytics-popup__metric-value">
						{unsubscribed.toFixed(2)}%
					</div>
					<div className="qcrm-analytics-popup__metric-label">
						{__('Unsubscribed', 'quillcrm')}
					</div>
				</div>
			</div>
		</>
	);

	return (
		<div className="qcrm-analytics-popup">
			<div className="qcrm-analytics-popup__overlay" onClick={onClose} />
			<div
				className={`qcrm-analytics-popup__content ${actionType === 'email' ? 'qcrm-analytics-popup__content--email' : ''}`}
			>
				<div className="qcrm-analytics-popup__header">
					<h3 className="qcrm-analytics-popup__title">
						{__('View Analytics', 'quillcrm')} ({actionLabel})
					</h3>
					<button
						className="qcrm-analytics-popup__close"
						onClick={onClose}
						aria-label={__('Close', 'quillcrm')}
					>
						<X size={20} />
					</button>
				</div>
				<div
					className={`qcrm-analytics-popup__body ${actionType === 'email' ? 'qcrm-analytics-popup__body--grid' : ''}`}
				>
					{actionType === 'email'
						? renderEmailMetrics()
						: renderSMSMetrics()}
				</div>
			</div>
		</div>
	);
};

export default AnalyticsPopup;
