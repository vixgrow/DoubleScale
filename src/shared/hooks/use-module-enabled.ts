/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import Config from '@doublescale/config';

const MODULES_UPDATED = 'doublescale:modules-updated';

/**
 * Whether a toggleable module is enabled (reads SPA bootstrap config from PHP).
 * Re-renders when {@link Config.setModules} runs (e.g. after saving Settings → Modules).
 */
export function useModuleEnabled(slug: string): boolean {
	const [enabled, setEnabled] = useState(() => Config.isModuleEnabled(slug));

	useEffect(() => {
		const sync = () => setEnabled(Config.isModuleEnabled(slug));
		sync();
		window.addEventListener(MODULES_UPDATED, sync);
		return () => window.removeEventListener(MODULES_UPDATED, sync);
	}, [slug]);

	return enabled;
}

/**
 * Enabled flags for several module slugs at once.
 */
export function useModulesEnabled(slugs: string[]): Record<string, boolean> {
	const [flags, setFlags] = useState(() => {
		const out: Record<string, boolean> = {};
		for (const s of slugs) {
			out[s] = Config.isModuleEnabled(s);
		}
		return out;
	});

	useEffect(() => {
		const sync = () => {
			const out: Record<string, boolean> = {};
			for (const s of slugs) {
				out[s] = Config.isModuleEnabled(s);
			}
			setFlags(out);
		};
		sync();
		window.addEventListener(MODULES_UPDATED, sync);
		return () => window.removeEventListener(MODULES_UPDATED, sync);
	}, [slugs.join(',')]);

	return flags;
}
