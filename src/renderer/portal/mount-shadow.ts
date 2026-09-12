/**
 * Mount the Client Portal inside an open Shadow DOM so host-theme CSS cannot
 * restyle colors, padding, or typography. Theme header/footer outside the
 * shortcode host remain untouched.
 *
 * Two theme leaks Shadow DOM alone does not stop:
 * 1. CSS custom properties inherit across the shadow boundary.
 * 2. `rem` units always resolve against the document `<html>` font-size.
 *    We rewrite rem → px (16px root) when inlining portal stylesheets.
 */

const PORTAL_STYLE_HREF_RE =
	/\/build\/renderer\/portal\/|doublescale-portal-renderer/i;

/** Design tokens + box reset on the host — cuts theme variable inheritance. */
const HOST_RESET_CSS = `
:host {
	all: initial;
	display: block !important;
	box-sizing: border-box !important;
	width: 100% !important;
	max-width: 100%;
	margin: 0 !important;
	padding: 0 !important;
	border: 0 !important;
	background: transparent !important;
	color-scheme: light;
	font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
	font-size: 16px !important;
	line-height: 1.5 !important;
	font-weight: 400 !important;
	letter-spacing: normal !important;
	text-align: left !important;
	text-transform: none !important;
	color: #29292e !important;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;

	--background: 228 25% 97%;
	--foreground: 240 6% 17%;
	--card: 0 0% 100%;
	--card-foreground: 240 6% 17%;
	--popover: 0 0% 100%;
	--popover-foreground: 240 6% 17%;
	--primary: 240 45% 41%;
	--primary-foreground: 0 0% 100%;
	--secondary: 254 76% 94%;
	--secondary-foreground: 240 45% 41%;
	--secondary-background: 220 23% 97%;
	--muted: 220 23% 97%;
	--muted-foreground: 233 5% 44%;
	--accent: 220 23% 97%;
	--accent-foreground: 240 6% 17%;
	--tertiary: 220 23% 97%;
	--tertiary-foreground: 240 6% 17%;
	--destructive: 0 90% 40%;
	--destructive-foreground: 0 0% 98%;
	--border: 0 0% 82%;
	--input: 0 0% 82%;
	--ring: 240 45% 41%;
	--radius: 8px;
}

/* :where() keeps specificity at 0 so Tailwind utilities still win. */
:where(:host) *,
:where(:host) *::before,
:where(:host) *::after {
	box-sizing: border-box;
	border-width: 0;
	border-style: solid;
	border-color: hsl(var(--border));
}
:where(:host) :where(h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd) {
	margin: 0;
}
:where(:host) :where(h1, h2, h3, h4, h5, h6) {
	font-size: inherit;
	font-weight: inherit;
}
:where(:host) :where(ol, ul, menu) {
	list-style: none;
	margin: 0;
	padding: 0;
}
:where(:host) :where(a) {
	color: inherit;
	text-decoration: inherit;
}
:where(:host) :where(img, video) {
	max-width: 100%;
	height: auto;
	display: block;
}
:where(:host) :where(svg) {
	display: block;
	max-width: none;
	flex-shrink: 0;
}
:where(:host) :where(button, input, optgroup, select, textarea) {
	font: inherit;
	font-size: 16px;
	line-height: 1.5;
	color: inherit;
	margin: 0;
	padding: 0;
	background: none;
	/* Width only — the shorthand \`border: 0\` also sets style:none and hides
	   Tailwind \`border\` utilities on checkboxes, inputs, and selects. */
	border-width: 0;
	border-radius: 0;
	box-shadow: none;
	letter-spacing: inherit;
	appearance: none;
	-webkit-appearance: none;
}
:where(:host) :where(button, [type='button'], [type='reset'], [type='submit']) {
	cursor: pointer;
	background: none;
}
:where(:host) :where(input[type='search']::-webkit-search-decoration),
:where(:host) :where(input[type='search']::-webkit-search-cancel-button),
:where(:host) :where(input[type='search']::-webkit-search-results-button),
:where(:host) :where(input[type='search']::-webkit-search-results-decoration) {
	-webkit-appearance: none;
	display: none;
}
:where(:host) :where(table) {
	border-collapse: collapse;
	border-color: inherit;
}
[data-doublescale-portal-container] {
	display: block;
	width: 100%;
	position: relative;
	font-family: inherit;
	font-size: 16px;
	line-height: 1.5;
	color: inherit;
}
[data-radix-popper-content-wrapper] {
	z-index: 2000000 !important;
	font-family: inherit;
	font-size: 16px;
	line-height: 1.5;
}

/* Status filter trigger (All Status) — lives in the shadow tree. */
#doublescale-client-portal .doublescale-portal-status-trigger {
	font-family: inherit !important;
	font-size: 14px !important;
	line-height: 1.5 !important;
	font-weight: 500 !important;
	color: #29292e !important;
	background-color: #ffffff !important;
	border: 1px solid #d1d1d1 !important;
	border-radius: 8px !important;
	box-shadow: none !important;
	appearance: none !important;
	-webkit-appearance: none !important;
}
#doublescale-client-portal .doublescale-portal-status-trigger:hover,
#doublescale-client-portal .doublescale-portal-status-trigger:focus {
	background-color: #ffffff !important;
	color: #29292e !important;
	border-color: #d1d1d1 !important;
	outline: none !important;
}
#doublescale-client-portal .doublescale-portal-status-trigger .text-muted-foreground {
	color: #6a6c75 !important;
}
`;

const REM_ROOT_PX = 16;

const isPortalStylesheetHref = (href: string): boolean =>
	PORTAL_STYLE_HREF_RE.test(href || '');

const isPortalStylesheet = (link: HTMLLinkElement): boolean => {
	const id = link.id || '';
	const href = link.href || '';
	return (
		id.includes('doublescale-portal-renderer') ||
		isPortalStylesheetHref(href)
	);
};

/** Resolve relative url(...) against the stylesheet URL (inlined <style> loses the CSS base). */
const absolutizeCssUrls = (css: string, cssHref: string): string => {
	let base: URL;
	try {
		base = new URL(cssHref, window.location.href);
	} catch {
		return css;
	}

	return css.replace(
		/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
		(match, quote: string, raw: string) => {
			const value = raw.trim();
			if (
				!value ||
				/^(data:|https?:|blob:|\/\/)/i.test(value) ||
				value.startsWith('#')
			) {
				return match;
			}
			try {
				const absolute = new URL(value, base).href;
				return `url(${quote}${absolute}${quote})`;
			} catch {
				return match;
			}
		}
	);
};

/**
 * Lock spacing to a 16px root so theme `html { font-size }` cannot change
 * paddings. Only rewrite rem in declaration values and @rule conditions —
 * never in selectors (Tailwind class names must keep matching the HTML).
 */
const remToPx = (css: string): string => {
	const rewrite = (chunk: string): string =>
		chunk.replace(/(-?[\d.]+)rem\b/g, (_, n: string) => {
			const px = parseFloat(n) * REM_ROOT_PX;
			return Number.isFinite(px) ? `${px}px` : `${n}rem`;
		});

	let out = css.replace(/\{([^{}]*)\}/g, (_m, body: string) => `{${rewrite(body)}}`);
	out = out.replace(
		/(@(?:media|container|supports)[^{]+)\{/g,
		(_m, prelude: string) => `${rewrite(prelude)}{`
	);
	return out;
};

const preparePortalCss = (css: string, cssHref: string): string =>
	remToPx(absolutizeCssUrls(css, cssHref));

export interface PortalShadowMountOptions {
	/** Absolute URLs for portal stylesheets (from wp_localize_script). */
	styleUrls?: string[];
}

export interface PortalShadowMount {
	/** Element React should mount onto (inside the shadow tree). */
	appRoot: HTMLElement;
	/** Shadow root — use as Radix portal container when needed. */
	shadowRoot: ShadowRoot;
	/** Preferred portal container for dialogs/selects (inside shadow). */
	portalContainer: HTMLElement;
}

const injectedHrefs = new WeakMap<ShadowRoot, Set<string>>();

const getInjectedSet = (shadow: ShadowRoot): Set<string> => {
	let set = injectedHrefs.get(shadow);
	if (!set) {
		set = new Set();
		injectedHrefs.set(shadow, set);
	}
	return set;
};

const appendPreparedStyle = (
	shadow: ShadowRoot,
	css: string,
	href: string
): void => {
	const style = document.createElement('style');
	style.setAttribute('data-doublescale-portal-style', href);
	style.textContent = preparePortalCss(css, href);
	shadow.appendChild(style);
};

/**
 * Fetch a portal stylesheet and inline it (rem→px). Falls back to a cloned
 * <link> if fetch fails (spacing may still follow theme rem).
 */
const injectStylesheetByHref = async (
	shadow: ShadowRoot,
	href: string
): Promise<void> => {
	const set = getInjectedSet(shadow);
	if (!href || set.has(href)) {
		return;
	}
	set.add(href);

	try {
		const response = await fetch(href, { credentials: 'same-origin' });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const css = await response.text();
		appendPreparedStyle(shadow, css, href);
	} catch {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		link.setAttribute('data-doublescale-portal-style-fallback', href);
		shadow.appendChild(link);
	}
};

const collectStyleUrls = (extra: string[] = []): string[] => {
	const urls: string[] = [];
	const seen = new Set<string>();

	const push = (href: string) => {
		if (!href || seen.has(href)) {
			return;
		}
		seen.add(href);
		urls.push(href);
	};

	extra.forEach(push);

	document.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
		const link = node as HTMLLinkElement;
		if (isPortalStylesheet(link) && link.href) {
			push(link.href);
		}
	});

	return urls;
};

/**
 * Watch for lazy section chunk CSS (webpack injects <link> into document.head)
 * and mirror it into the shadow root with the same rem→px treatment.
 */
const observeDocumentStylesheets = (shadow: ShadowRoot): void => {
	if (typeof MutationObserver === 'undefined') {
		return;
	}

	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (!(node instanceof HTMLLinkElement)) {
					return;
				}
				if (
					node.rel === 'stylesheet' &&
					isPortalStylesheet(node) &&
					node.href
				) {
					void injectStylesheetByHref(shadow, node.href);
				}
			});
		});
	});

	observer.observe(document.head || document.documentElement, {
		childList: true,
		subtree: true,
	});
};

/**
 * Dialogs/dropdowns portal to document.body (shared UI is not modified).
 * Moving those nodes into a Shadow Root breaks React clicks. Keep them on
 * the page and inject a hard theme-isolation layer + portal CSS so overlays
 * keep DoubleScale styling.
 */
const OVERLAY_RESET_CSS = `
[data-doublescale-dialog-layer],
[data-radix-popper-content-wrapper] {
	--background: 228 25% 97% !important;
	--foreground: 240 6% 17% !important;
	--card: 0 0% 100% !important;
	--card-foreground: 240 6% 17% !important;
	--popover: 0 0% 100% !important;
	--popover-foreground: 240 6% 17% !important;
	--primary: 240 45% 41% !important;
	--primary-foreground: 0 0% 100% !important;
	--secondary: 254 76% 94% !important;
	--secondary-foreground: 240 45% 41% !important;
	--secondary-background: 220 23% 97% !important;
	--muted: 220 23% 97% !important;
	--muted-foreground: 233 5% 44% !important;
	--accent: 220 23% 97% !important;
	--accent-foreground: 240 6% 17% !important;
	--tertiary: 220 23% 97% !important;
	--tertiary-foreground: 240 6% 17% !important;
	--destructive: 0 90% 40% !important;
	--destructive-foreground: 0 0% 98% !important;
	--border: 0 0% 82% !important;
	--input: 0 0% 82% !important;
	--ring: 240 45% 41% !important;
	--radius: 8px !important;
	font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
	font-size: 16px !important;
	line-height: 1.5 !important;
	font-weight: 400 !important;
	letter-spacing: normal !important;
	text-transform: none !important;
	color: #29292e !important;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

[data-doublescale-dialog-layer] *,
[data-doublescale-dialog-layer] *::before,
[data-doublescale-dialog-layer] *::after,
[data-radix-popper-content-wrapper] *,
[data-radix-popper-content-wrapper] *::before,
[data-radix-popper-content-wrapper] *::after {
	box-sizing: border-box !important;
	border-width: 0;
	border-style: solid;
	border-color: hsl(var(--border));
}

[data-doublescale-dialog-layer] :where(h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd),
[data-radix-popper-content-wrapper] :where(h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd) {
	margin: 0 !important;
	font-size: inherit;
	font-weight: inherit;
	line-height: inherit;
}

[data-doublescale-dialog-layer] :where(ol, ul, menu),
[data-radix-popper-content-wrapper] :where(ol, ul, menu) {
	list-style: none !important;
	margin: 0 !important;
	padding: 0 !important;
}

[data-doublescale-dialog-layer] :where(a),
[data-radix-popper-content-wrapper] :where(a) {
	color: inherit !important;
	text-decoration: none !important;
}

[data-doublescale-dialog-layer] :where(img, video),
[data-radix-popper-content-wrapper] :where(img, video) {
	max-width: 100%;
	height: auto;
	display: block;
}

[data-doublescale-dialog-layer] :where(svg),
[data-radix-popper-content-wrapper] :where(svg) {
	display: block;
	max-width: none;
	flex-shrink: 0;
}

/* Beat theme form chrome (buttons/inputs/selects) without touching shared UI.
   Avoid !important on background/padding/border-width so Tailwind utilities still win. */
[data-doublescale-dialog-layer] :where(button, input, optgroup, select, textarea),
[data-radix-popper-content-wrapper] :where(button, input, optgroup, select, textarea) {
	font-family: inherit !important;
	font-size: 16px !important;
	line-height: 1.5 !important;
	font-weight: inherit !important;
	letter-spacing: normal !important;
	text-transform: none !important;
	color: inherit !important;
	margin: 0;
	padding: 0;
	background: transparent;
	background-image: none;
	border-width: 0;
	border-style: solid;
	border-color: hsl(var(--border));
	border-radius: 0;
	box-shadow: none !important;
	outline: none;
	appearance: none !important;
	-webkit-appearance: none !important;
}

[data-doublescale-dialog-layer] :where(button, [type='button'], [type='reset'], [type='submit']),
[data-radix-popper-content-wrapper] :where(button, [type='button'], [type='reset'], [type='submit']) {
	cursor: pointer !important;
}

[data-doublescale-dialog-layer] :where(label),
[data-radix-popper-content-wrapper] :where(label) {
	font-family: inherit !important;
	font-size: inherit !important;
	font-weight: inherit !important;
	line-height: inherit !important;
	color: inherit !important;
	margin: 0;
	padding: 0;
}

[data-doublescale-dialog-layer] :where(input[type='search']::-webkit-search-decoration),
[data-doublescale-dialog-layer] :where(input[type='search']::-webkit-search-cancel-button),
[data-doublescale-dialog-layer] :where(input[type='search']::-webkit-search-results-button),
[data-doublescale-dialog-layer] :where(input[type='search']::-webkit-search-results-decoration) {
	-webkit-appearance: none !important;
	display: none !important;
}

[data-radix-popper-content-wrapper] {
	--background: 228 25% 97% !important;
	--foreground: 240 6% 17% !important;
	--popover: 0 0% 100% !important;
	--popover-foreground: 240 6% 17% !important;
	--primary: 240 45% 41% !important;
	--primary-foreground: 0 0% 100% !important;
	--secondary: 254 76% 94% !important;
	--muted: 220 23% 97% !important;
	--muted-foreground: 233 5% 44% !important;
	--accent: 220 23% 97% !important;
	--accent-foreground: 240 6% 17% !important;
	--border: 0 0% 82% !important;
	--ring: 240 45% 41% !important;
	--radius: 8px !important;
	z-index: 2000000 !important;
	font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
	font-size: 16px !important;
	line-height: 1.5 !important;
	color: #29292e !important;
}

/* Status dropdown / select menus portaled to body (Documents + Tickets). */
[data-radix-popper-content-wrapper] [role='menu'],
[data-radix-popper-content-wrapper] [role='listbox'],
.doublescale-portal-menu {
	font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
	font-size: 14px !important;
	line-height: 1.5 !important;
	color: #29292e !important;
	background-color: #ffffff !important;
	border: 1px solid #d1d1d1 !important;
	border-radius: 12px !important;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12) !important;
	padding: 4px !important;
}

[data-radix-popper-content-wrapper] .text-foreground,
.doublescale-portal-menu .text-foreground {
	color: #29292e !important;
}
[data-radix-popper-content-wrapper] .text-muted-foreground,
.doublescale-portal-menu .text-muted-foreground {
	color: #6a6c75 !important;
}
[data-radix-popper-content-wrapper] .text-popover-foreground,
.doublescale-portal-menu .text-popover-foreground {
	color: #29292e !important;
}
[data-radix-popper-content-wrapper] .bg-popover,
.doublescale-portal-menu.bg-popover {
	background-color: #ffffff !important;
}
[data-radix-popper-content-wrapper] .bg-accent,
.doublescale-portal-menu .bg-accent,
[data-radix-popper-content-wrapper] .hover\\:bg-accent:hover,
.doublescale-portal-menu .hover\\:bg-accent:hover,
.doublescale-portal-menu button:hover {
	background-color: #f4f5f7 !important;
	color: #29292e !important;
}

[data-radix-popper-content-wrapper] button,
.doublescale-portal-menu button,
[data-radix-popper-content-wrapper] [role='menuitem'],
[data-radix-popper-content-wrapper] [role='option'],
.doublescale-portal-menu [role='menuitem'],
.doublescale-portal-menu [role='option'] {
	font-family: inherit !important;
	font-size: 14px !important;
	line-height: 1.5 !important;
	color: #29292e !important;
	background: transparent !important;
	border: 0 !important;
	box-shadow: none !important;
	text-align: left !important;
	margin: 0 !important;
}

[data-radix-popper-content-wrapper] button:hover,
.doublescale-portal-menu button:hover,
[data-radix-popper-content-wrapper] [role='menuitem']:hover,
[data-radix-popper-content-wrapper] [role='option']:hover,
[data-radix-popper-content-wrapper] [role='option'][data-highlighted],
.doublescale-portal-menu [role='option'][data-highlighted] {
	background-color: #f4f5f7 !important;
	color: #29292e !important;
	text-decoration: none !important;
}

/* Checkbox in Documents All Status menu */
[data-radix-popper-content-wrapper] button[role='checkbox'],
.doublescale-portal-menu button[role='checkbox'] {
	width: 20px !important;
	height: 20px !important;
	min-width: 20px !important;
	border: 1px solid #d1d1d1 !important;
	border-radius: 6px !important;
	background-color: #ffffff !important;
	padding: 0 !important;
	flex-shrink: 0 !important;
}
[data-radix-popper-content-wrapper] button[role='checkbox'][data-state='checked'],
.doublescale-portal-menu button[role='checkbox'][data-state='checked'] {
	background-color: #3a3a99 !important;
	border-color: #3a3a99 !important;
	color: #ffffff !important;
}
[data-radix-popper-content-wrapper] button[role='checkbox'] svg,
.doublescale-portal-menu button[role='checkbox'] svg {
	color: #ffffff !important;
	width: 16px !important;
	height: 16px !important;
}

[data-radix-popper-content-wrapper] [role='separator'],
.doublescale-portal-menu [role='separator'] {
	background-color: #e5e5e5 !important;
	height: 1px !important;
	margin: 4px 0 !important;
	border: 0 !important;
}

/* Triggers stay in the shadow tree — reinforce borders/colors there too. */
#doublescale-client-portal .doublescale-portal-status-trigger,
.doublescale-portal-status-trigger {
	font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
	font-size: 14px !important;
	line-height: 1.5 !important;
	color: #29292e !important;
	background-color: #ffffff !important;
	border: 1px solid #d1d1d1 !important;
	border-radius: 8px !important;
	box-shadow: none !important;
}
#doublescale-client-portal .doublescale-portal-status-trigger:hover,
.doublescale-portal-status-trigger:hover {
	background-color: #ffffff !important;
	color: #29292e !important;
	border-color: #d1d1d1 !important;
}
#doublescale-client-portal .doublescale-portal-status-trigger .text-muted-foreground,
.doublescale-portal-status-trigger .text-muted-foreground {
	color: #6a6c75 !important;
}

.doublescale-portal-dialog {
	--ds-brand-primary: 58 58 153;
	font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
		'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
	font-size: 16px !important;
	line-height: 1.5 !important;
	color: #29292e !important;
	background-color: #ffffff !important;
	border-color: #d1d1d1 !important;
	box-shadow: 0 10px 40px rgba(15, 23, 42, 0.18) !important;
}

/* Lock portal text tokens so theme link/paragraph colors cannot win. */
[data-doublescale-dialog-layer] .text-foreground,
.doublescale-portal-dialog .text-foreground,
.doublescale-portal-dialog {
	color: #29292e !important;
}
[data-doublescale-dialog-layer] .text-muted-foreground,
.doublescale-portal-dialog .text-muted-foreground {
	color: #6a6c75 !important;
}
[data-doublescale-dialog-layer] .text-primary,
.doublescale-portal-dialog .text-primary {
	color: #3a3a99 !important;
}
[data-doublescale-dialog-layer] .text-primary-foreground,
.doublescale-portal-dialog .text-primary-foreground,
.doublescale-portal-dialog .text-white {
	color: #ffffff !important;
}
[data-doublescale-dialog-layer] .bg-secondary,
.doublescale-portal-dialog .bg-secondary {
	background-color: #ebe6fe !important;
}
[data-doublescale-dialog-layer] .bg-white,
.doublescale-portal-dialog .bg-white {
	background-color: #ffffff !important;
}
[data-doublescale-dialog-layer] .bg-accent,
.doublescale-portal-dialog .bg-accent {
	background-color: #f4f5f7 !important;
}
[data-doublescale-dialog-layer] .hover\\:bg-accent:hover,
.doublescale-portal-dialog .hover\\:bg-accent:hover {
	background-color: #f4f5f7 !important;
}
[data-doublescale-dialog-layer] .hover\\:text-accent-foreground:hover,
.doublescale-portal-dialog .hover\\:text-accent-foreground:hover {
	color: #29292e !important;
}
[data-doublescale-dialog-layer] .hover\\:bg-secondary:hover,
.doublescale-portal-dialog .hover\\:bg-secondary:hover {
	background-color: #ebe6fe !important;
}
[data-doublescale-dialog-layer] .hover\\:text-primary:hover,
.doublescale-portal-dialog .hover\\:text-primary:hover {
	color: #3a3a99 !important;
}
[data-doublescale-dialog-layer] .hover\\:bg-brandPrimary\\/10:hover,
.doublescale-portal-dialog .hover\\:bg-brandPrimary\\/10:hover {
	background-color: rgba(58, 58, 153, 0.1) !important;
}
[data-doublescale-dialog-layer] .hover\\:bg-primary\\/90:hover,
.doublescale-portal-dialog .hover\\:bg-primary\\/90:hover,
.doublescale-portal-dialog .hover\\:bg-\\[\\#2D3282\\]\\/90:hover {
	background-color: rgba(45, 50, 130, 0.9) !important;
	color: #ffffff !important;
}
[data-doublescale-dialog-layer] .text-brandPrimary,
.doublescale-portal-dialog .text-brandPrimary {
	color: #3a3a99 !important;
}
[data-doublescale-dialog-layer] .border-brandPrimary,
.doublescale-portal-dialog .border-brandPrimary {
	border-color: #3a3a99 !important;
}
[data-doublescale-dialog-layer] .border-primary,
.doublescale-portal-dialog .border-primary {
	border-color: #3a3a99 !important;
}
[data-doublescale-dialog-layer] .border-border,
.doublescale-portal-dialog .border-border {
	border-color: #d1d1d1 !important;
}

/* Custom dialog header — title / subtitle / icon chip. */
.doublescale-portal-dialog .doublescale-control-modules-dialog-header-icon {
	background-color: #ebe6fe !important;
	color: #3a3a99 !important;
}
.doublescale-portal-dialog .doublescale-control-modules-dialog-header-icon svg {
	color: #3a3a99 !important;
}
.doublescale-portal-dialog p.text-lg,
.doublescale-portal-dialog .text-lg.font-semibold {
	color: #29292e !important;
}
.doublescale-portal-dialog p.text-sm.font-normal,
.doublescale-portal-dialog .text-sm.font-normal.leading-snug {
	color: #6a6c75 !important;
}

/* Close (X) control — keep dark, not theme link blue. */
.doublescale-portal-dialog > button[type='button'],
[data-doublescale-dialog-layer] [data-doublescale-dialog-center] > button.absolute {
	color: #111827 !important;
	background: transparent !important;
}
.doublescale-portal-dialog > button[type='button']:hover,
[data-doublescale-dialog-layer] [data-doublescale-dialog-center] > button.absolute:hover {
	color: #111827 !important;
	opacity: 1 !important;
	background: transparent !important;
}

.doublescale-portal-dialog input:not([type='checkbox']):not([type='radio']),
.doublescale-portal-dialog textarea,
.doublescale-portal-dialog [role='combobox'] {
	background-color: #ffffff !important;
	border-width: 1px !important;
	border-style: solid !important;
	border-color: #d1d1d1 !important;
	border-radius: 8px !important;
	color: #29292e !important;
	box-shadow: none !important;
}
.doublescale-portal-dialog input::placeholder,
.doublescale-portal-dialog textarea::placeholder {
	color: #6a6c75 !important;
	opacity: 1 !important;
}

.doublescale-portal-dialog button {
	font-family: inherit !important;
	box-shadow: none !important;
}
.doublescale-portal-dialog button:hover {
	text-decoration: none !important;
}
`;

const lightDomInjected = new Set<string>();
const OVERLAY_STYLE_ATTR = 'data-doublescale-portal-overlay-style';
const OVERLAY_RESET_ATTR = 'data-doublescale-portal-overlay-reset';

/** Keep portal overlay CSS after theme stylesheets so ours win the cascade. */
const bumpOverlayStylesToEnd = (): void => {
	const head = document.head;
	if (!head) {
		return;
	}
	head.querySelectorAll(
		`[${OVERLAY_RESET_ATTR}], [${OVERLAY_STYLE_ATTR}]`
	).forEach((node) => {
		if (node.parentNode === head && head.lastElementChild === node) {
			return;
		}
		head.appendChild(node);
	});
};

const injectOverlayStylesToDocument = async (
	styleUrls: string[]
): Promise<void> => {
	if (!document.querySelector(`[${OVERLAY_RESET_ATTR}]`)) {
		const reset = document.createElement('style');
		reset.setAttribute(OVERLAY_RESET_ATTR, '');
		// Fonts via <link> — @import inside <style> can block/paint forever.
		if (!document.querySelector('link[data-doublescale-portal-font]')) {
			const font = document.createElement('link');
			font.rel = 'stylesheet';
			font.href =
				'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
			font.setAttribute('data-doublescale-portal-font', '');
			document.head.appendChild(font);
		}
		reset.textContent = OVERLAY_RESET_CSS;
		document.head.appendChild(reset);
	}

	const urls = collectStyleUrls(styleUrls);
	await Promise.all(
		urls.map(async (href) => {
			if (!href || lightDomInjected.has(href)) {
				return;
			}
			lightDomInjected.add(href);
			try {
				const response = await fetch(href, {
					credentials: 'same-origin',
				});
				if (!response.ok) {
					return;
				}
				const style = document.createElement('style');
				style.setAttribute(OVERLAY_STYLE_ATTR, href);
				style.textContent = preparePortalCss(
					await response.text(),
					href
				);
				document.head.appendChild(style);
			} catch {
				/* Shadow already has the CSS; reset still protects overlays. */
			}
		})
	);

	bumpOverlayStylesToEnd();

	if (
		typeof MutationObserver !== 'undefined' &&
		!document.documentElement.hasAttribute(
			'data-doublescale-overlay-cascade'
		)
	) {
		document.documentElement.setAttribute(
			'data-doublescale-overlay-cascade',
			''
		);
		const observer = new MutationObserver((mutations) => {
			const foreign = mutations.some((mutation) =>
				Array.from(mutation.addedNodes).some(
					(node) =>
						node instanceof Element &&
						!node.hasAttribute(OVERLAY_RESET_ATTR) &&
						!node.hasAttribute(OVERLAY_STYLE_ATTR) &&
						!node.hasAttribute('data-doublescale-portal-font')
				)
			);
			if (foreign) {
				bumpOverlayStylesToEnd();
			}
		});
		observer.observe(document.head || document.documentElement, {
			childList: true,
		});
	}
};

/**
 * Inject host reset + portal stylesheet(s) into the shadow root.
 * Resolves when the initial (non-lazy) stylesheets are inlined.
 */
const injectPortalStyles = async (
	shadow: ShadowRoot,
	styleUrls: string[] = []
): Promise<void> => {
	if (!shadow.querySelector('[data-doublescale-portal-host-reset]')) {
		const hostReset = document.createElement('style');
		hostReset.setAttribute('data-doublescale-portal-host-reset', '');
		hostReset.textContent = HOST_RESET_CSS;
		shadow.appendChild(hostReset);
	}

	const urls = collectStyleUrls(styleUrls);
	await Promise.all(urls.map((href) => injectStylesheetByHref(shadow, href)));

	observeDocumentStylesheets(shadow);
};

/**
 * Attach an open shadow root to the shortcode host and return the inner app
 * mount node. Safe to call once; subsequent calls reuse the existing shadow.
 * Structure is sync so React can mount immediately — CSS loads in the background.
 */
export const createPortalShadowMount = (
	host: HTMLElement,
	options: PortalShadowMountOptions = {}
): PortalShadowMount => {
	const existing = host.shadowRoot;
	const shadow =
		existing ??
		host.attachShadow({
			mode: 'open',
			delegatesFocus: true,
		});

	if (!shadow.querySelector('[data-doublescale-portal-host-reset]')) {
		const hostReset = document.createElement('style');
		hostReset.setAttribute('data-doublescale-portal-host-reset', '');
		hostReset.textContent = HOST_RESET_CSS;
		shadow.appendChild(hostReset);
	}

	let portalContainer = shadow.querySelector(
		'[data-doublescale-portal-container]'
	) as HTMLElement | null;
	if (!portalContainer) {
		portalContainer = document.createElement('div');
		portalContainer.setAttribute('data-doublescale-portal-container', '');
		portalContainer.style.cssText =
			'display:block;width:100%;position:relative;';
		shadow.appendChild(portalContainer);
	}

	let appRoot = shadow.getElementById(
		'doublescale-client-portal'
	) as HTMLElement | null;
	if (!appRoot) {
		// Same id as the light-DOM host is OK — shadow trees are separate, and
		// the compiled portal CSS targets `#doublescale-client-portal`.
		appRoot = document.createElement('div');
		appRoot.id = 'doublescale-client-portal';
		appRoot.className = 'doublescale-client-portal-root';
		portalContainer.appendChild(appRoot);
	}

	const styleUrls = options.styleUrls || [];
	// Do not block the SPA on CSS fetch — a hung request left the portal blank.
	void injectPortalStyles(shadow, styleUrls).catch(() => undefined);
	void injectOverlayStylesToDocument(styleUrls).catch(() => undefined);

	return {
		appRoot,
		shadowRoot: shadow,
		portalContainer,
	};
};
