/**
 * Shared helpers for the Lexical editor and its consumers.
 */

/**
 * True when Lexical HTML has visible text (not only empty blocks).
 *
 * Lexical serializes an empty editor as `<p><br></p>`, which a naive
 * `.trim()` wrongly treats as non-empty. This strips markup and non-breaking
 * spaces so send/submit guards can tell "looks formatted but empty" from real
 * content. Used by the SMTP test composer and every support composer.
 *
 * @param html Serialized editor HTML.
 * @return Whether the HTML contains any visible text.
 */
export function htmlEditorHasMeaningfulContent(html: string): boolean {
	if (!html || !html.trim()) {
		return false;
	}
	const div = document.createElement('div');
	div.innerHTML = html;
	const text = (div.textContent || '').replace(/\u00a0/g, ' ').trim();
	return text.length > 0;
}
