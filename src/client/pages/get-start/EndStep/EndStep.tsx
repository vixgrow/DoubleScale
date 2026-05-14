import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import config from '@doublescale/config';
import type { ModuleInfo } from '@doublescale/config';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { pickToggleableModulePayload } from '@doublescale/shared/lib/optional-marketing-modules';

function getDashboardUrl(): string {
	const pathname = document.location.pathname;
	const basename = pathname.substring(0, pathname.lastIndexOf('/'));
	const menuSlug =
		(window as unknown as { doublescaleConfig?: { menuSlug?: string } })
			.doublescaleConfig?.menuSlug || 'doublescale';
	return `${basename}/admin.php?page=${menuSlug}`;
}

interface ModulesResponse {
	success: boolean;
	modules: ModuleInfo[];
}

interface EndStepProps {
	readonly pendingModuleChanges: Record<string, boolean>;
}

type Phase = 'installing' | 'ready' | 'error';

export default function EndStep({ pendingModuleChanges }: EndStepProps) {
	const { createNotice } = useDispatch('doublescale/core');
	const [phase, setPhase] = useState<Phase>('installing');
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		let cancelled = false;
		const install = async () => {
			try {
				const apiModules = config.getModules();
				const payload = pickToggleableModulePayload(pendingModuleChanges, apiModules);

				if (Object.keys(payload).length > 0) {
					await apiFetch<ModulesResponse>({
						path: '/doublescale/v1/modules',
						method: 'POST',
						data: { modules: payload },
					});
					// Intentionally NOT calling `config.setModules` here. That
					// dispatches `doublescale:modules-updated`, which bumps the
					// router's `<Routes key={modulesTick}>` and remounts the
					// wizard back to step 1 — wiping the EndStep success view
					// the user is about to see. The hard reload triggered by
					// "Go to Dashboard" re-bootstraps `window.doublescaleConfig`
					// from PHP, picking up the new module state cleanly.
				}

				if (!cancelled) {
					setPhase('ready');
				}
			} catch (error: unknown) {
				const err = error as { message?: string; data?: { message?: string } };
				const msg =
					err?.message ||
					err?.data?.message ||
					__('Failed to install selected modules.', 'doublescale');
				if (!cancelled) {
					createNotice({ type: 'error', message: msg });
					setPhase('error');
				}
			}
		};
		void install();
		return () => {
			cancelled = true;
		};
	}, [pendingModuleChanges, createNotice, retryCount]);

	const goToDashboard = useCallback(() => {
		window.location.href = getDashboardUrl();
	}, []);

	const retry = useCallback(() => {
		setPhase('installing');
		setRetryCount((n) => n + 1);
	}, []);

	if (phase === 'installing') {
		return (
			<div className="flex flex-col items-center justify-center gap-5 mx-auto min-h-[60vh] text-center max-w-lg px-4">
				<div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-primary mb-2">
					<Loader2 size={32} className="animate-spin" />
				</div>
				<h3 className="text-foreground text-2xl font-semibold">
					{__('Setting up your modules...', 'doublescale')}
				</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{__(
						'We are installing the modules you selected. This only takes a moment.',
						'doublescale'
					)}
				</p>
			</div>
		);
	}

	if (phase === 'error') {
		return (
			<div className="flex flex-col items-center justify-center gap-5 mx-auto min-h-[60vh] text-center max-w-lg px-4">
				<div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-2">
					<AlertCircle size={32} />
				</div>
				<h3 className="text-foreground text-2xl font-semibold">
					{__('Setup did not finish', 'doublescale')}
				</h3>
				<p className="text-muted-foreground text-sm leading-relaxed">
					{__(
						'We could not finish installing the modules you selected. Try again, or skip to the dashboard and enable modules later from Settings.',
						'doublescale'
					)}
				</p>
				<div className="flex items-center gap-3">
					<Button size="lg" variant="secondaryDeepBlue" onClick={retry}>
						<RotateCcw size={16} className="mr-1.5" />
						{__('Retry', 'doublescale')}
					</Button>
					<Button size="lg" onClick={goToDashboard}>
						{__('Skip to Dashboard', 'doublescale')}
						<ArrowRight size={16} className="ml-1.5" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center gap-5 mx-auto min-h-[60vh] text-center max-w-lg px-4">
			<div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-2">
				<CheckCircle2 size={32} />
			</div>

			<h3 className="text-foreground text-2xl font-semibold">
				{__("You're All Set!", 'doublescale')}
			</h3>

			<p className="text-muted-foreground text-sm leading-relaxed">
				{__(
					'Your CRM setup is complete. Start managing relationships, automating tasks, and tracking performance from your dashboard.',
					'doublescale'
				)}
			</p>

			<Button size="lg" onClick={goToDashboard}>
				{__('Go to Dashboard', 'doublescale')}
				<ArrowRight size={16} className="ml-1.5" />
			</Button>
		</div>
	);
}
