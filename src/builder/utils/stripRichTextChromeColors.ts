export interface StripRichTextChromeColorsOptions {
	/** Block-level text color — matching inline white is kept (templates on dark backgrounds). */
	blockColor?: string;
}

/**
 * Light / near-white colors that browsers often persist from a dark contentEditable
 * (computed text color copied into inline spans). They override block-level text color
 * when the block color is dark — but must be kept when the block is intentionally white.
 */
function isChromeLikeTextColor(raw: string): boolean {
	const v = raw.trim().toLowerCase().replace(/\s+/g, '');
	if (!v) return false;
	if (v === '#fff' || v === '#ffffff' || v === 'white') return true;
	if (v === '#f4f4f5' || v === '#fafafa' || v === '#f5f5f5') return true;
	if (v === 'rgb(244,244,245)' || v === 'rgb(255,255,255)') return true;
	if (/^rgba\(255,255,255,1\)$/.test(v)) return true;
	if (/^hsl\(0,0%,9[6-9]/.test(v) || /^hsl\(0,0%,100/.test(v)) return true;
	return false;
}

function normalizeCssColor(raw: string): string {
	const v = raw.trim().toLowerCase().replace(/\s+/g, '');
	if (v === 'white') return '#ffffff';
	const short = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
	if (short) {
		return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
	}
	const rgb = v.match(/^rgba?\((\d+),(\d+),(\d+)/);
	if (rgb) {
		const hex = (n: string) =>
			parseInt(n, 10).toString(16).padStart(2, '0');
		return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
	}
	return v;
}

function colorsMatch(a: string, b: string): boolean {
	return normalizeCssColor(a) === normalizeCssColor(b);
}

function cleanStyleAttribute(
	style: string,
	blockColor?: string
): string | null {
	const parts = style
		.split(';')
		.map((s) => s.trim())
		.filter(Boolean);
	const kept = parts.filter((decl) => {
		if (/^-webkit-text-fill-color\s*:/i.test(decl)) return false;
		const m = decl.match(/^color\s*:\s*(.+)$/i);
		if (!m) return true;
		if (!isChromeLikeTextColor(m[1])) return true;
		if (blockColor && colorsMatch(m[1], blockColor)) return true;
		return false;
	});
	return kept.length ? kept.join('; ') : null;
}

function mapStyleAttributes(
	html: string,
	clean: (style: string) => string | null
): string {
	let out = html.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (_m, style: string) => {
		const next = clean(style);
		return next ? ` style="${next}"` : '';
	});
	out = out.replace(/\sstyle\s*=\s*'([^']*)'/gi, (_m, style: string) => {
		const next = clean(style);
		return next ? ` style='${next}'` : '';
	});
	return out;
}

function unwrapBareSpans(html: string): string {
	return html.replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1');
}

/**
 * Strip accidental editor-chrome text colors from inline `style` attributes so block
 * `color` and email body styles apply as expected. Also drops `-webkit-text-fill-color`
 * (WebKit can persist it and paint white text after refresh).
 *
 * When `blockColor` is white (or another light chrome-like value), inline colors that
 * match it are preserved so template headings stay visible on dark section backgrounds.
 */
export function stripRichTextChromeColors(
	html: string,
	options: StripRichTextChromeColorsOptions = {}
): string {
	if (!html || !html.includes('style')) return html;

	const blockColor = options.blockColor?.trim() || undefined;

	return mapStyleAttributes(html, (style) =>
		cleanStyleAttribute(style, blockColor)
	);
}

const DROP_BLOCK_STYLE = /^(color|font-size|-webkit-text-fill-color)\s*:/i;

/**
 * Remove per-word `color` and `font-size` so the text-block Font Color and size
 * controls the whole block. Other inline styles (align, weight, decoration,
 * coupon badge layout) are kept.
 */
export function stripInlineColorAndFontSize(html: string): string {
	if (!html) return html;

	let out = html;
	if (html.includes('style')) {
		out = mapStyleAttributes(html, (style) => {
			const kept = style
				.split(';')
				.map((s) => s.trim())
				.filter(Boolean)
				.filter((decl) => !DROP_BLOCK_STYLE.test(decl));
			return kept.length ? kept.join('; ') : null;
		});
	}

	return unwrapBareSpans(out);
}
