/**
 * Light / near-white colors that browsers often persist from a dark contentEditable
 * (computed text color copied into inline spans). They override block-level text color.
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

function cleanStyleAttribute(style: string): string | null {
	const parts = style
		.split(';')
		.map((s) => s.trim())
		.filter(Boolean);
	const kept = parts.filter((decl) => {
		if (/^-webkit-text-fill-color\s*:/i.test(decl)) return false;
		const m = decl.match(/^color\s*:\s*(.+)$/i);
		if (!m) return true;
		return !isChromeLikeTextColor(m[1]);
	});
	return kept.length ? kept.join('; ') : null;
}

/**
 * Strip accidental editor-chrome text colors from inline `style` attributes so block
 * `color` and email body styles apply as expected. Also drops `-webkit-text-fill-color`
 * (WebKit can persist it and paint white text after refresh).
 */
export function stripRichTextChromeColors(html: string): string {
	if (!html || !html.includes('style')) return html;

	let out = html.replace(/\sstyle\s*=\s*"([^"]*)"/gi, (_m, style: string) => {
		const next = cleanStyleAttribute(style);
		return next ? ` style="${next}"` : '';
	});
	out = out.replace(/\sstyle\s*=\s*'([^']*)'/gi, (_m, style: string) => {
		const next = cleanStyleAttribute(style);
		return next ? ` style='${next}'` : '';
	});
	return out;
}
