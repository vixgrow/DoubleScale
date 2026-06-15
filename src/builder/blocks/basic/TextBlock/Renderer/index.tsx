/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React, { useLayoutEffect, useRef } from 'react';
/**
 * internal dependencies
 */
import { TextBlockProps } from '..';
import { generateRandomString } from '@/builder/utils/idGenerator';
import {
	getHeadingConfig,
	calculateFontSize,
} from '@/builder/utils/styleHelpers';
import { stripRichTextChromeColors } from '@/builder/utils/stripRichTextChromeColors';

function escapeHtml(raw: string): string {
	return raw
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export interface TextRendererProps {
	props: TextBlockProps;
	/** Email builder: edit copy on the canvas when the block is selected. */
	canvasEditable?: boolean;
	onCanvasContentChange?: (html: string) => void;
}

export const TextRenderer: React.FC<TextRendererProps> = ({
	props,
	canvasEditable,
	onCanvasContentChange,
}) => {
	const editRef = useRef<HTMLDivElement>(null);
	const editingRef = useRef(false);
	const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const rendererIdRef = useRef<string | null>(null);
	if (!rendererIdRef.current) {
		rendererIdRef.current = `text-block-renderer-${generateRandomString()}`;
	}
	const rendererId = rendererIdRef.current;
	const headingConfig = getHeadingConfig(props.headingStyle);
	const ElementType = headingConfig.element as keyof JSX.IntrinsicElements;
	const fontSize = calculateFontSize(props.headingStyle, props.fontSize);
	const textColor = props.color?.trim() || '#333';
	const linkColorResolved = props.linkColor?.trim() || '#458DC7';

	// Check if content is HTML
	const isHtmlContent =
		props.content &&
		props.content.includes('<') &&
		props.content.includes('>');

	// Clean content to remove conflicting font styles but preserve formatting
	const getCleanContent = () => {
		if (!isHtmlContent) return props.content;

		// If HTML formatting exists, preserve all styles and only clean up empty attributes
		if (hasHtmlFormatting()) {
			let cleanContent = props.content;
			// Only clean up empty style attributes
			cleanContent = cleanContent.replace(/style\s*=\s*""\s*/gi, '');
			cleanContent = cleanContent.replace(/style\s*=\s*''\s*/gi, '');
			cleanContent = cleanContent.replace(/\s*style\s*=\s*""/gi, '');
			cleanContent = cleanContent.replace(/\s*style\s*=\s*''/gi, '');
			return stripRichTextChromeColors(cleanContent, {
				blockColor: textColor,
			});
		}

		// If no HTML formatting, remove font-size and font-family to use props
		let cleanContent = props.content;
		cleanContent = cleanContent.replace(
			/style\s*=\s*"[^"]*font-size[^"]*"/gi,
			''
		);
		cleanContent = cleanContent.replace(
			/style\s*=\s*"[^"]*font-family[^"]*"/gi,
			''
		);
		cleanContent = cleanContent.replace(
			/style\s*=\s*'[^']*font-size[^']*'/gi,
			''
		);
		cleanContent = cleanContent.replace(
			/style\s*=\s*'[^']*font-family[^']*'/gi,
			''
		);

		// Clean up empty style attributes
		cleanContent = cleanContent.replace(/style\s*=\s*""\s*/gi, '');
		cleanContent = cleanContent.replace(/style\s*=\s*''\s*/gi, '');
		cleanContent = cleanContent.replace(/\s*style\s*=\s*""/gi, '');
		cleanContent = cleanContent.replace(/\s*style\s*=\s*''/gi, '');

		return stripRichTextChromeColors(cleanContent, {
			blockColor: textColor,
		});
	};

	// Check if HTML content has formatting that should override props
	const hasHtmlFormatting = () => {
		if (!isHtmlContent) return false;
		return (
			props.content.includes('<b>') ||
			props.content.includes('<strong>') ||
			props.content.includes('<i>') ||
			props.content.includes('<em>') ||
			props.content.includes('<u>') ||
			props.content.includes('<s>') ||
			props.content.includes('<strike>') ||
			props.content.includes('font-weight') ||
			props.content.includes('font-style') ||
			props.content.includes('text-decoration') ||
			props.content.includes('text-align')
		);
	};

	const getEditableHtml = (): string => {
		if (isHtmlContent) {
			return getCleanContent();
		}
		const raw = (props.content ?? '').trim();
		if (!raw) {
			return `<p style="color:${textColor}"><br></p>`;
		}
		return `<p style="color:${textColor}">${escapeHtml(raw)}</p>`;
	};

	// Commit the current contentEditable HTML to the store.
	// Used by both the debounced onInput path and the immediate onBlur flush so
	// the store (and therefore autosave's getFreshState snapshot) always reflects
	// what the user has typed — not just the last blurred value.
	const commitContent = () => {
		if (!onCanvasContentChange) return;
		// Guard against committing during teardown: when the block is
		// deselected the contentEditable unmounts and a blur fires with the ref
		// already detached. Reading `?? ''` there would persist an empty string
		// and wipe the block's text. Only commit when the live node exists.
		if (!editRef.current) return;
		const html = editRef.current.innerHTML;
		onCanvasContentChange(
			stripRichTextChromeColors(html, {
				blockColor: textColor,
			})
		);
	};

	const flushPendingCommit = () => {
		if (commitTimerRef.current) {
			clearTimeout(commitTimerRef.current);
			commitTimerRef.current = null;
		}
	};

	// Clear any pending debounced commit when the editor unmounts so it does not
	// fire against a detached node.
	useLayoutEffect(() => {
		return () => {
			flushPendingCommit();
		};
	}, []);

	const syncCanvasEditorColors = (root: HTMLElement) => {
		root.style.color = textColor;
		root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((node) => {
			const el = node as HTMLElement;
			if (!el.style.color?.trim()) {
				el.style.color = textColor;
			}
		});
	};

	useLayoutEffect(() => {
		if (
			!canvasEditable ||
			!onCanvasContentChange ||
			!editRef.current ||
			editingRef.current
		) {
			return;
		}
		const next = getEditableHtml();
		if (editRef.current.innerHTML !== next) {
			editRef.current.innerHTML = next;
		}
		syncCanvasEditorColors(editRef.current);
	}, [canvasEditable, onCanvasContentChange, props.content, textColor]); // sync store → canvas when not actively typing

	const content = (
		<>
			<style>{`
				.${rendererId} {
					font-size: ${fontSize}px !important;
					font-family: ${props.fontFamily} !important;
					color: ${textColor} !important;
					color-scheme: light;
				}
				.${rendererId} * {
					font-size: ${fontSize}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} p,
				.${rendererId} div,
				.${rendererId} span {
					font-size: ${fontSize}px !important;
					font-family: ${props.fontFamily} !important;
				}
				/* Only apply font size/family to formatting tags if no HTML formatting exists */
				${!hasHtmlFormatting()
					? `
				.${rendererId} strong,
				.${rendererId} em,
				.${rendererId} u,
				.${rendererId} strike {
					font-size: ${fontSize}px !important;
					font-family: ${props.fontFamily} !important;
				}
				`
					: ''
				}
				.${rendererId} ul {
					list-style-type: disc !important;
					padding-left: 20px !important;
					margin: 10px 0 !important;
					font-size: ${fontSize}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} ol {
					list-style-type: decimal !important;
					padding-left: 20px !important;
					margin: 10px 0 !important;
					font-size: ${fontSize}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} li {
					display: list-item !important;
					margin: 5px 0 !important;
					font-size: ${fontSize}px !important;
					font-family: ${props.fontFamily} !important;
				}
				.${rendererId} a,
				.${rendererId} a:link,
				.${rendererId} a:visited,
				.${rendererId} a:hover {
					color: ${linkColorResolved};
					text-decoration: underline !important;
				}
				/* Selected / contentEditable: headings must inherit block color (UA defaults are dark). */
				.${rendererId} [data-text-canvas-editor="true"] {
					color: ${textColor} !important;
					caret-color: ${textColor};
				}
				.${rendererId} [data-text-canvas-editor="true"] h1,
				.${rendererId} [data-text-canvas-editor="true"] h2,
				.${rendererId} [data-text-canvas-editor="true"] h3,
				.${rendererId} [data-text-canvas-editor="true"] h4,
				.${rendererId} [data-text-canvas-editor="true"] h5,
				.${rendererId} [data-text-canvas-editor="true"] h6,
				.${rendererId} [data-text-canvas-editor="true"] strong,
				.${rendererId} [data-text-canvas-editor="true"] em,
				.${rendererId} [data-text-canvas-editor="true"] p,
				.${rendererId} [data-text-canvas-editor="true"] li,
				.${rendererId} [data-text-canvas-editor="true"] div,
				.${rendererId} .text-block-html-root h1,
				.${rendererId} .text-block-html-root h2,
				.${rendererId} .text-block-html-root h3,
				.${rendererId} .text-block-html-root h4,
				.${rendererId} .text-block-html-root h5,
				.${rendererId} .text-block-html-root h6,
				.${rendererId} .text-block-html-root p,
				.${rendererId} .text-block-html-root li,
				.${rendererId} .text-block-html-root div {
					color: inherit;
					-webkit-text-fill-color: currentColor;
				}
				/* Only override font-size and font-family inline styles if no HTML formatting exists */
				${!hasHtmlFormatting()
					? `
				.${rendererId} [style*="font-size"] {
					font-size: ${fontSize}px !important;
				}
				.${rendererId} [style*="font-family"] {
					font-family: ${props.fontFamily} !important;
				}
				`
					: ''
				}
			`}</style>
			<div
				style={
					{
						fontSize: fontSize,
						color: textColor,
						// Only apply textAlign from props if HTML doesn't have its own text-align
						...(hasHtmlFormatting() &&
							props.content.includes('text-align')
							? {}
							: {
								textAlign:
									props.textAlign as React.CSSProperties['textAlign'],
							}),
						fontFamily: props.fontFamily,
						// Only apply formatting styles if no HTML formatting exists
						...(hasHtmlFormatting()
							? {}
							: {
								fontWeight: props.bold ? 'bold' : 'normal',
								fontStyle: props.italic
									? 'italic'
									: 'normal',
								textDecoration: (() => {
									if (
										props.underline &&
										props['line-through']
									)
										return 'underline line-through';
									if (props.underline) return 'underline';
									if (props['line-through'])
										return 'line-through';
									return 'none';
								})(),
							}),
						lineHeight: props.lineHeight,
						letterSpacing: props.letterSpacing,
						borderRadius: props.borderRadius,
						borderWidth: props.borderWidth,
						backgroundColor: props.backgroundColor,
						padding: `${props.padding?.top || 0}px ${props.padding?.right || 0}px ${props.padding?.bottom || 0}px ${props.padding?.left || 0}px`,
						margin: 0,
						// Overflow prevention properties like Button and Preheader renderers
						wordWrap: 'break-word',
						overflowWrap: 'break-word',
						maxWidth: '100%',
						whiteSpace: 'normal',
						width: '100%',
						boxSizing: 'border-box',
						overflow: 'hidden',
						forcedColorAdjust: 'none',
						// CSS custom properties for inheritance
						'--text-font-size': `${fontSize}px`,
						'--text-font-family': props.fontFamily,
					} as React.CSSProperties
				}
				className={rendererId}
			>
				{canvasEditable && onCanvasContentChange ? (
					<div
						ref={editRef}
						contentEditable
						suppressContentEditableWarning
						role="textbox"
						aria-multiline
						aria-label={__('Edit text', 'doublescale')}
						tabIndex={0}
						className="min-h-[1.25em] cursor-text outline-none"
						data-text-canvas-editor="true"
						style={{
							fontSize: 'inherit',
							fontFamily: 'inherit',
							color: textColor,
							caretColor: textColor,
							lineHeight: 'inherit',
							letterSpacing: 'inherit',
						}}
						onFocus={() => {
							editingRef.current = true;
							if (editRef.current) {
								syncCanvasEditorColors(editRef.current);
							}
						}}
						onInput={() => {
							// Persist edits to the store as the user types (debounced)
							// so autosave never snapshots stale, pre-edit content.
							// The store→canvas sync bails while editingRef is true,
							// so this does not disturb the caret.
							flushPendingCommit();
							commitTimerRef.current = setTimeout(() => {
								commitTimerRef.current = null;
								commitContent();
							}, 400);
						}}
						onBlur={() => {
							editingRef.current = false;
							// Final flush: cancel any pending debounce and commit
							// the latest content immediately.
							flushPendingCommit();
							commitContent();
						}}
						onKeyDown={(e) => {
							if (e.key === 'Escape') {
								(e.currentTarget as HTMLElement).blur();
							}
						}}
					/>
				) : isHtmlContent ? (
					<div
						className="text-block-html-root"
						dangerouslySetInnerHTML={{ __html: getCleanContent() }}
						style={{
							fontSize: 'inherit',
							fontFamily: 'inherit',
							color: textColor,
							lineHeight: 'inherit',
							letterSpacing: 'inherit',
						}}
					/>
				) : (
					<ElementType
						style={{
							margin: 0,
							fontSize: 'inherit',
							fontFamily: 'inherit',
							color: textColor,
						}}
					>
						{getCleanContent()}
					</ElementType>
				)}
			</div>
		</>
	);

	return content;
};
