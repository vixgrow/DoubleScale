/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import React, { useState, useEffect } from 'react';

/**
 * internal dependencies
 */
import { TimerBlockProps } from '..';
import { TimerBlockIcon } from '@quillcrm/components';

export interface TimerBlockRendererProps {
	props: TimerBlockProps;
}

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export const TimerBlockRenderer: React.FC<TimerBlockRendererProps> = ({ props }) => {
	const [timeLeft, setTimeLeft] = useState<TimeLeft>({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	const [isExpired, setIsExpired] = useState(false);

	useEffect(() => {
		const calculateTimeLeft = (): TimeLeft => {
			if (!props.targetDate) {
				return { days: 0, hours: 0, minutes: 0, seconds: 0 };
			}

			// Create target date with time
			const targetDateTime = new Date(props.targetDate);
			targetDateTime.setHours(props.targetHour, props.targetMinute, 0, 0);

			// Convert to target timezone
			const targetInTimezone = new Date(targetDateTime.toLocaleString('en-US', { timeZone: props.timezone }));

			// Get current time in target timezone
			const now = new Date();
			const nowInTimezone = new Date(now.toLocaleString('en-US', { timeZone: props.timezone }));

			const difference = targetInTimezone.getTime() - nowInTimezone.getTime();

			if (difference > 0) {
				// Reset expired state if we now have a future time
				setIsExpired(false);
				const days = Math.floor(difference / (1000 * 60 * 60 * 24));
				const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
				const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
				const seconds = Math.floor((difference % (1000 * 60)) / 1000);

				return { days, hours, minutes, seconds };
			} else {
				setIsExpired(true);
				return { days: 0, hours: 0, minutes: 0, seconds: 0 };
			}
		};

		// Calculate initial time
		setTimeLeft(calculateTimeLeft());

		// Update timer every second
		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft());
		}, 1000);

		return () => clearInterval(timer);
	}, [props.targetDate, props.targetHour, props.targetMinute, props.timezone]);

	// Format numbers with leading zeros
	const formatNumber = (num: number): string => {
		return num.toString().padStart(2, '0');
	};

	// Get primary color (you can adjust this based on your theme)
	const getPrimaryColor = (): string => {
		// Default primary color - you can replace this with your theme's primary color
		return '#1E3A8A';
	};

	// Determine if we should use primary color (when no custom colors are set)
	const usePrimaryColor = props.digitsColor === '#333333' && props.separatorColor === '#333333';

	// Helper function to format width value
	const formatWidth = (width: string): string => {
		if (!width) return '100%';
		// If width already has a unit, return as is
		if (width.includes('%') || width.includes('px')) {
			return width;
		}
		// If it's just a number, add % suffix
		return `${width}%`;
	};

	const timerStyle: React.CSSProperties = {
		width: formatWidth(props.width),
		backgroundColor: props.backgroundColor,
		textAlign: props.align as React.CSSProperties['textAlign'],
		padding: `${props.padding?.top || 20}px ${props.padding?.right || 20}px ${props.padding?.bottom || 20}px ${props.padding?.left || 20}px`,
		borderRadius: '8px',
		display: 'inline-block',
	};

	const digitStyle: React.CSSProperties = {
		fontFamily: props.digitsFontFamily,
		fontSize: `${props.digitsFontSize}px`,
		color: usePrimaryColor ? getPrimaryColor() : props.digitsColor,
		fontWeight: 'bold',
		margin: '0 4px',
	};

	const separatorStyle: React.CSSProperties = {
		fontFamily: props.separatorFontFamily,
		fontSize: `${props.separatorFontSize}px`,
		color: usePrimaryColor ? getPrimaryColor() : props.separatorColor,
		fontWeight: 'bold',
		margin: '0 4px',
	};

	const timeUnitStyle: React.CSSProperties = {
		display: 'inline-block',
		textAlign: 'center',
		margin: '0 8px',
	};

	// Placeholder style for when no target date is set
	const placeholderStyle: React.CSSProperties = {
		width: formatWidth(props.width),
		backgroundColor: props.backgroundColor,
		textAlign: props.align as React.CSSProperties['textAlign'],
		padding: `${props.padding?.top || 40}px ${props.padding?.right || 20}px ${props.padding?.bottom || 40}px ${props.padding?.left || 20}px`,
		borderRadius: '8px',
		display: 'inline-block',
		border: '2px dashed #e5e5e5',
	};

	const placeholderContentStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '16px',
	};

	const placeholderTextStyle: React.CSSProperties = {
		fontFamily: props.digitsFontFamily,
		fontSize: `${props.digitsFontSize}px`,
		color: getPrimaryColor(),
		fontWeight: 'bold',
		textAlign: 'center',
	};

	const placeholderIconStyle: React.CSSProperties = {
		opacity: 0.6,
	};

	const renderTimer = () => {
		if (isExpired) {
			return (
				<div style={timerStyle}>
					<div style={{ ...digitStyle, fontSize: `${props.digitsFontSize * 0.8}px` }}>
						{__('Time Expired', 'quillcrm')}
					</div>
				</div>
			);
		}

		return (
			<div style={timerStyle}>
				<div>
					<div style={timeUnitStyle}>
						<div style={digitStyle}>{formatNumber(timeLeft.days)}</div>
					</div>
					<span style={separatorStyle}>:</span>
					<div style={timeUnitStyle}>
						<div style={digitStyle}>{formatNumber(timeLeft.hours)}</div>
					</div>
					<span style={separatorStyle}>:</span>
					<div style={timeUnitStyle}>
						<div style={digitStyle}>{formatNumber(timeLeft.minutes)}</div>
					</div>
					<span style={separatorStyle}>:</span>
					<div style={timeUnitStyle}>
						<div style={digitStyle}>{formatNumber(timeLeft.seconds)}</div>
					</div>
				</div>
			</div>
		);
	};

	// If no target date is set, show placeholder with icon and sample text
	if (!props.targetDate) {
		const placeholderElement = (
			<div style={placeholderStyle}>
				<div style={placeholderContentStyle}>
					<div style={placeholderIconStyle}>
						<TimerBlockIcon width={48} height={48} />
					</div>
					<div style={placeholderTextStyle}>
						00 : 00 : 00 : 00
					</div>
				</div>
			</div>
		);

		// Wrap in link if provided
		if (props.link) {
			return (
				<a
					href={props.link}
					style={{ textDecoration: 'none', display: 'block' }}
					title={props.altText || __('Countdown Timer', 'quillcrm')}
				>
					{placeholderElement}
				</a>
			);
		}

		return placeholderElement;
	}

	// Wrap in link if provided
	if (props.link) {
		return (
			<a
				href={props.link}
				style={{ textDecoration: 'none', display: 'block' }}
				title={props.altText || __('Countdown Timer', 'quillcrm')}
			>
				{renderTimer()}
			</a>
		);
	}

	return renderTimer();
};