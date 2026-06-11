/**
 * WordPress dependencies
 */
import { createContext, useContext, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import ModulesSettings from './index';
import { ControlIcon, CustomDialogHeader } from '@doublescale/components';

type ModulesDialogContextValue = {
	openModulesDialog: () => void;
	closeModulesDialog: () => void;
};

const ModulesDialogContext = createContext<ModulesDialogContextValue | null>(
	null
);

export function ModulesDialogProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);

	const openModulesDialog = useCallback(() => setOpen(true), []);
	const closeModulesDialog = useCallback(() => setOpen(false), []);

	return (
		<ModulesDialogContext.Provider
			value={{ openModulesDialog, closeModulesDialog }}
		>
			{children}
			<Dialog
				open={open}
				onOpenChange={(value) => {
					if (!value) {
						closeModulesDialog();
					}
				}}
			>
				<DialogContent
					className={cn(
						'z-[150000] gap-0 overflow-hidden p-0',
						'w-[calc(100vw-1rem)] max-w-[960px]',
						'max-h-[min(94vh,900px)] rounded-xl border border-border/80',
						'bg-card shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)]'
					)}
				>
					<div className="flex max-h-[min(90vh,860px)] flex-col overflow-hidden rounded-[inherit] bg-card">
						<div className="px-4 pt-4 lg:px-6 lg:pt-6">
						<CustomDialogHeader
							icon={<ControlIcon />}
							title={__('Control Modules', 'doublescale')}
							subtitle={__(
								'Enable or disable optional features: SMTP, Pipelines, Forms, Automations, Tasks, Campaigns, Booking, and Support.',
								'doublescale'
								)}
							/>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
							<ModulesSettings showHeader={false} />
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</ModulesDialogContext.Provider>
	);
}

export function useModulesDialog(): ModulesDialogContextValue {
	const context = useContext(ModulesDialogContext);
	if (!context) {
		throw new Error(
			'useModulesDialog must be used within a ModulesDialogProvider'
		);
	}
	return context;
}
