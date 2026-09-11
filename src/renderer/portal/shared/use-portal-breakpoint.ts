/**
 * Portal layout breakpoints — same pixel thresholds as Tailwind defaults
 * (sm/md/lg/xl), but measured from the shortcode / theme content column width.
 *
 * Example: theme Customize content max-width = 768px → `md` layout
 * (same as a responsive screen between sm and lg).
 */

import {
	createContext,
	useContext,
	useEffect,
	useState,
	type RefObject,
} from '@wordpress/element';

/** Tailwind default screens (px). */
export const PORTAL_SCREENS = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536,
} as const;

export type PortalBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface PortalBreakpointState {
	width: number;
	bp: PortalBreakpoint;
	/** ≥ 640 — Tailwind `sm` */
	sm: boolean;
	/** ≥ 768 — Tailwind `md` */
	md: boolean;
	/** ≥ 1024 — Tailwind `lg` */
	lg: boolean;
	/** ≥ 1280 — Tailwind `xl` */
	xl: boolean;
	/** ≥ 1536 — Tailwind `2xl` */
	'2xl': boolean;
}

const resolveBreakpoint = (width: number): PortalBreakpoint => {
	if (width >= PORTAL_SCREENS['2xl']) {
		return '2xl';
	}
	if (width >= PORTAL_SCREENS.xl) {
		return 'xl';
	}
	if (width >= PORTAL_SCREENS.lg) {
		return 'lg';
	}
	if (width >= PORTAL_SCREENS.md) {
		return 'md';
	}
	if (width >= PORTAL_SCREENS.sm) {
		return 'sm';
	}
	return 'xs';
};

const stateFromWidth = (width: number): PortalBreakpointState => {
	const w = Math.max(0, Math.round(width));
	return {
		width: w,
		bp: resolveBreakpoint(w),
		sm: w >= PORTAL_SCREENS.sm,
		md: w >= PORTAL_SCREENS.md,
		lg: w >= PORTAL_SCREENS.lg,
		xl: w >= PORTAL_SCREENS.xl,
		'2xl': w >= PORTAL_SCREENS['2xl'],
	};
};

/** Until the shortcode is measured, assume md (768) — not the viewport. */
const DEFAULT_STATE = stateFromWidth(PORTAL_SCREENS.md);

export const PortalBreakpointContext =
	createContext<PortalBreakpointState>(DEFAULT_STATE);

export const usePortalBreakpoint = (): PortalBreakpointState =>
	useContext(PortalBreakpointContext);

/**
 * Prefer the light-DOM shadow host width (theme content column) over the
 * inner node when the portal is mounted in a Shadow Root.
 */
const resolveMeasureTarget = (
	el: HTMLElement | null
): HTMLElement | null => {
	if (!el) {
		return null;
	}
	const root = el.getRootNode();
	if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
		return root.host;
	}
	return el;
};

/**
 * Observe the shortcode column width and publish Tailwind-equivalent breakpoints.
 */
export const usePortalBreakpointObserver = (
	ref: RefObject<HTMLElement | null>
): PortalBreakpointState => {
	const [state, setState] = useState<PortalBreakpointState>(DEFAULT_STATE);

	useEffect(() => {
		const measureEl = resolveMeasureTarget(ref.current);
		if (!measureEl || typeof ResizeObserver === 'undefined') {
			return;
		}

		const update = (width: number) => {
			setState((prev) => {
				const next = stateFromWidth(width);
				if (prev.width === next.width && prev.bp === next.bp) {
					return prev;
				}
				return next;
			});
		};

		update(measureEl.getBoundingClientRect().width);

		const ro = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}
			// contentBoxSize is more accurate when padding is present on the host.
			const box = entry.contentBoxSize?.[0];
			const width = box
				? box.inlineSize
				: entry.contentRect.width;
			update(width);
		});
		ro.observe(measureEl);
		return () => ro.disconnect();
	}, [ref]);

	return state;
};
