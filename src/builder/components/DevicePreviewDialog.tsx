/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

/**
 * Viewport widths the preview frame is resized to.
 *
 * The email's own responsive CSS stacks columns below 480px (see the media
 * query in EmailRenderer), so `mobile` sits under that breakpoint on purpose —
 * otherwise the mobile preview would look identical to the tablet one and the
 * stacking behaviour would stay invisible until the email was actually sent.
 */
const DEVICE_WIDTHS: Record<PreviewDevice, number> = {
	desktop: 900,
	tablet: 768,
	mobile: 375,
};

const DEVICE_LABELS: Record<PreviewDevice, string> = {
	desktop: __('Desktop', 'doublescale'),
	tablet: __('Tablet', 'doublescale'),
	mobile: __('Mobile', 'doublescale'),
};

export interface DevicePreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Rendered email HTML, or empty while loading. */
	html: string;
	loading?: boolean;
	error?: string | null;
	/** Retry callback for a failed render. */
	onRetry?: () => void;
}

export const DevicePreviewDialog: React.FC<DevicePreviewDialogProps> = ({
	open,
	onOpenChange,
	html,
	loading = false,
	error = null,
	onRetry,
}) => {
	const [device, setDevice] = useState<PreviewDevice>('desktop');

	// Always reopen on desktop — carrying the previous device over makes the
	// dialog look broken when someone reopens it after checking mobile.
	useEffect(() => {
		if (open) {
			setDevice('desktop');
		}
	}, [open]);

	const width = DEVICE_WIDTHS[device];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="text-center">
						{__('Preview email', 'doublescale')}
					</DialogTitle>
				</DialogHeader>

				<div
					className="flex items-center justify-center gap-2 mt-2"
					role="group"
					aria-label={__('Preview device', 'doublescale')}
				>
					{(
						Object.keys(DEVICE_WIDTHS) as PreviewDevice[]
					).map((key) => (
						<Button
							key={key}
							type="button"
							variant={device === key ? 'default' : 'secondary'}
							className="px-4"
							aria-pressed={device === key}
							onClick={() => setDevice(key)}
						>
							{DEVICE_LABELS[key]}
						</Button>
					))}
				</div>

				<p className="text-center text-xs text-muted-foreground mt-1">
					{/* translators: %d: viewport width in pixels. */}
					{`${DEVICE_LABELS[device]} — ${width}px`}
				</p>

				<div className="flex-1 overflow-auto mt-3 flex justify-center bg-muted/40 rounded-lg p-4">
					{loading ? (
						<div className="flex flex-col items-center justify-center min-h-[400px]">
							<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
							<p className="text-muted-foreground mt-4">
								{__('Loading preview…', 'doublescale')}
							</p>
						</div>
					) : error ? (
						<div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
							<p className="text-destructive text-center">
								{error}
							</p>
							{onRetry && (
								<Button
									variant="secondary"
									onClick={onRetry}
									type="button"
								>
									{__('Try again', 'doublescale')}
								</Button>
							)}
						</div>
					) : (
						<iframe
							/*
							 * Keyed on width so the frame remounts per device:
							 * email clients load the document at a fixed
							 * viewport, and remounting re-evaluates the media
							 * query the same way rather than reflowing a live
							 * document.
							 */
							key={width}
							srcDoc={html}
							title={__('Email preview', 'doublescale')}
							sandbox="allow-same-origin"
							className="border-0 bg-white shadow-sm"
							style={{
								width: `${width}px`,
								maxWidth: '100%',
								height: '70vh',
							}}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DevicePreviewDialog;
