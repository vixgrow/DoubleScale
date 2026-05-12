/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import { cn } from '@/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { ExportProvider } from './contexts';
import ExportContent from './export-content';

export interface Props {
	open: boolean;
	onClose: () => void;
}

const ExportModal: React.FC<Props> = ({ open, onClose }) => {
	return (
		<ExportProvider open={open} onClose={onClose}>
			<Dialog
				open={open}
				onOpenChange={(value) => {
					if (!value) {
						onClose();
					}
				}}
			>
				<DialogContent
					className={cn(
						'z-[150000] gap-0 overflow-hidden p-0',
						'w-[calc(100vw-1rem)] max-w-[1200px]',
						'max-h-[min(94vh,960px)] rounded-xl border border-border/80',
						'bg-card shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)]',
						'data-[state=open]:animate-in data-[state=closed]:animate-out',
						'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
						'data-[state=closed]:zoom-out-[0.99] data-[state=open]:zoom-in-[0.99]',
						'data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-2'
					)}
				>
					<div className="relative flex max-h-[min(90vh,940px)] min-h-[min(52vh,520px)] flex-col overflow-hidden rounded-[inherit] bg-card">
						<div
							className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-primary via-primary/90 to-primary/60"
							aria-hidden
						/>

						<header className="relative shrink-0 border-b border-border/50 bg-card px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7 pr-14 sm:pr-16">
							<div className="min-w-0 space-y-1.5">
								<DialogTitle className="text-left text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
									{__('Export contacts', 'doublescale')}
								</DialogTitle>
								<DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground sm:max-w-[36rem]">
									{__(
										'Choose filters and columns, then download a CSV. Large lists export in the background.',
										'doublescale'
									)}
								</DialogDescription>
							</div>
						</header>

						<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
							<ExportContent />
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</ExportProvider>
	);
};

export default ExportModal;
