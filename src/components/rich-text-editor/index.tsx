/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Link,
	List,
	ListOrdered,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	Copy,
} from 'lucide-react';

/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LinkDialog, LinkData } from './LinkDialog';
import { MerageTagsIcon } from '@doublescale/components';
import MergeTagsSelector from '@/components/merge-tags';
import { stripListInlineTextAlign, stripRichTextChromeColors } from '@/builder/utils/stripRichTextChromeColors';
import { useIsProActive } from '@doublescale/shared/hooks/use-is-pro-active';
import {
	LinkTriggerPickerDialog,
	LinkTriggerToolbarButton,
	type PickedLinkTrigger,
} from '../link-trigger-picker';

interface RichTextEditorProps {
	content: string;
	onChange: (content: string) => void;
	className?: string;
	/** Hint shown inside the editing surface while it is empty. */
	placeholder?: string;
	fontSize?: number;
	fontFamily?: string;
	/** Builder sidebar: dashed toolbar, dark editing surface (Figma Text Settings). */
	theme?: 'default' | 'builderDark';
	/** Limits merge-tag picker to tags for this sales document (settings emails). */
	salesEmailDocumentType?: import('@/components/merge-tags/utils').SalesEmailDocumentType;
	/** @deprecated Use salesEmailDocumentType for sales settings emails. */
	mergeTagTriggerId?: string;
	/**
	 * `canvas` — toolbar applies to the selected text block on the canvas (no sidebar body field).
	 * Use with the email builder canvas `contentEditable` marked `data-text-canvas-editor`.
	 */
	formattingTarget?: 'local' | 'canvas';
	/** Default body text / foreColor for canvas mode (matches Text block). */
	defaultBodyColor?: string;
	/** Links with no inline `color` in `style` use this (block default). */
	defaultLinkColor?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
	content,
	onChange,
	className,
	placeholder,
	fontSize = 16,
	fontFamily = 'Arial',
	theme = 'default',
	formattingTarget = 'local',
	defaultBodyColor,
	defaultLinkColor,
	mergeTagTriggerId,
	salesEmailDocumentType,
}) => {
	const isPro = useIsProActive();
	const isBuilderDark = theme === 'builderDark';
	const isCanvasFormat = formattingTarget === 'canvas';
	const bodyColor = (defaultBodyColor ?? '#333').trim() || '#333';
	const defaultLinkColorResolved =
		(defaultLinkColor ?? '#458DC7').trim() || '#458DC7';
	const localEditorRef = useRef<HTMLDivElement>(null);

	const getEditorEl = (): HTMLDivElement | null => {
		if (isCanvasFormat) {
			return document.querySelector<HTMLDivElement>(
				'[data-text-canvas-editor="true"]'
			);
		}
		return localEditorRef.current;
	};

	const emitContent = (html: string) => {
		onChange(
			stripRichTextChromeColors(stripListInlineTextAlign(html), {
				blockColor: bodyColor,
			})
		);
	};
	const [selectedColor, setSelectedColor] = useState(bodyColor);
	useEffect(() => {
		setSelectedColor(bodyColor);
	}, [bodyColor]);

	const [isMergeTagsModalOpen, setIsMergeTagsModalOpen] = useState(false);
	const [showCopyNotification, setShowCopyNotification] = useState(false);
	const [editorId] = useState(
		() => `rich-text-editor-${Math.random().toString(36).substr(2, 9)}`
	);
	const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
	const [isLinkTriggerPickerOpen, setIsLinkTriggerPickerOpen] = useState(false);
	const [currentLinkData, setCurrentLinkData] = useState<{
		url: string;
	}>({ url: '' });
	const savedSelectionRef = useRef<{
		startContainer: Node;
		startOffset: number;
		endContainer: Node;
		endOffset: number;
	} | null>(null);
	const skipLinkTextStepRef = useRef(false);
	const [activeFormats, setActiveFormats] = useState({
		bold: false,
		italic: false,
		underline: false,
		strikeThrough: false,
		insertUnorderedList: false,
		insertOrderedList: false,
		justifyLeft: false,
		justifyCenter: false,
		justifyRight: false,
		justifyFull: false,
		link: false,
	});

	// Wrapper for deprecated queryCommandState (no modern alternative for contentEditable)
	const queryCommandState = (command: string): boolean => {
		// @ts-ignore - deprecated API but no modern alternative exists
		return document.queryCommandState(command);
	};

	// Check if selection is within a link
	const isLinkSelected = (): boolean => {
		const root = getEditorEl();
		if (!root) return false;
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const parentElement =
				range.commonAncestorContainer.nodeType === Node.TEXT_NODE
					? range.commonAncestorContainer.parentElement
					: (range.commonAncestorContainer as Element);

			const selectedLink = parentElement?.closest('a') as HTMLAnchorElement;
			return selectedLink !== null && root.contains(selectedLink);
		}
		return false;
	};

	// Update active formats based on current selection
	const updateActiveFormats = () => {
		setActiveFormats({
			bold: queryCommandState('bold'),
			italic: queryCommandState('italic'),
			underline: queryCommandState('underline'),
			strikeThrough: queryCommandState('strikeThrough'),
			insertUnorderedList: queryCommandState('insertUnorderedList'),
			insertOrderedList: queryCommandState('insertOrderedList'),
			justifyLeft: queryCommandState('justifyLeft'),
			justifyCenter: queryCommandState('justifyCenter'),
			justifyRight: queryCommandState('justifyRight'),
			justifyFull: queryCommandState('justifyFull'),
			link: isLinkSelected(),
		});
	};

	// Process all links to open in new tab.
	// Theme link color/underline apply in the builder; other editors
	// keep underline and only set color when unset.
	const anchorHasTextColor = (link: HTMLAnchorElement): boolean => {
		const attr = link.getAttribute('style') || '';
		if (/(?:^|;)\s*color\s*:/i.test(attr)) return true;
		if (link.style.color) return true;
		if (link.hasAttribute('color')) return true;
		return false;
	};

	const processLinks = () => {
		const root = getEditorEl();
		if (!root) return;
		const links = root.querySelectorAll('a');
		links.forEach((link) => {
			if (!link.hasAttribute('target')) {
				link.setAttribute('target', '_blank');
				link.setAttribute('rel', 'noopener noreferrer');
			}
			link.style.textDecoration = 'underline';
			if (isCanvasFormat) {
				link.style.color = defaultLinkColorResolved;
				return;
			}
			if (!anchorHasTextColor(link)) {
				link.style.color = defaultLinkColorResolved;
			}
		});
	};

	// Apply font changes when props change (sidebar editor only — canvas uses block styles)
	useEffect(() => {
		if (isCanvasFormat) return;
		const root = localEditorRef.current;
		if (!root) return;
		root.style.fontSize = `${fontSize}px`;
		root.style.fontFamily = fontFamily;

		root.style.setProperty('--editor-font-size', `${fontSize}px`);
		root.style.setProperty('--editor-font-family', fontFamily);

		const allElements = root.querySelectorAll('*');
		allElements.forEach((element: Element) => {
			const htmlElement = element as HTMLElement;
			htmlElement.style.fontSize = `${fontSize}px`;
			htmlElement.style.fontFamily = fontFamily;
		});
	}, [fontSize, fontFamily, isCanvasFormat]);

	// Listen for selection changes to update toolbar button states
	useEffect(() => {
		const handleSelectionChange = () => {
			const root = getEditorEl();
			const selection = window.getSelection();
			if (
				root &&
				selection?.anchorNode &&
				root.contains(selection.anchorNode)
			) {
				updateActiveFormats();
			}
		};

		document.addEventListener('selectionchange', handleSelectionChange);
		document.addEventListener('mouseup', handleSelectionChange);

		const local = localEditorRef.current;
		if (local && !isCanvasFormat) {
			local.addEventListener('keyup', updateActiveFormats);
		}

		return () => {
			document.removeEventListener(
				'selectionchange',
				handleSelectionChange
			);
			document.removeEventListener('mouseup', handleSelectionChange);
			if (local && !isCanvasFormat) {
				local.removeEventListener('keyup', updateActiveFormats);
			}
		};
	}, [isCanvasFormat]);

	// Handle content initialization (local editor only — canvas syncs via TextRenderer)
	useEffect(() => {
		if (isCanvasFormat) return;
		const root = localEditorRef.current;
		if (!root || content === root.innerHTML) return;

		const currentSelection = window.getSelection();
		const currentRange =
			currentSelection && currentSelection.rangeCount > 0
				? currentSelection.getRangeAt(0)
				: null;

		root.innerHTML = getInitialContent();

		processLinks();

		if (currentRange && currentSelection) {
			try {
				currentSelection.removeAllRanges();
				currentSelection.addRange(currentRange);
			} catch (e) {
				// Ignore cursor restoration errors
			}
		}
	}, [content, isCanvasFormat]);

	// Helper function to create properly formatted list items
	const createListItem = () => {
		const listItem = document.createElement('li');
		listItem.innerHTML = '<br>';
		// Apply current font styles
		listItem.style.fontSize = `${fontSize}px`;
		listItem.style.fontFamily = fontFamily;
		if (isCanvasFormat) {
			listItem.style.color = bodyColor;
		}
		return listItem;
	};

	const executeCommand = (command: string, value?: string) => {
		const root = getEditorEl();
		if (!root) return;

		// @ts-ignore - deprecated API but no modern alternative exists
		document.execCommand('defaultParagraphSeparator', false, 'div');
		// @ts-ignore - deprecated API but no modern alternative exists
		document.execCommand('styleWithCSS', false, 'true');

		// Special handling for list commands
		if (
			command === 'insertUnorderedList' ||
			command === 'insertOrderedList'
		) {
			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				const parentElement =
					range.commonAncestorContainer.nodeType === Node.TEXT_NODE
						? range.commonAncestorContainer.parentElement
						: (range.commonAncestorContainer as Element);

				// If we're already in a list, toggle it off
				const existingListItem = parentElement?.closest('li');
				if (existingListItem) {
					// @ts-ignore - deprecated API but no modern alternative exists
					document.execCommand(command, false, value);
				} else {
					// Create a new list
					// @ts-ignore - deprecated API but no modern alternative exists
					document.execCommand(command, false, value);

					// Ensure the new list item has proper content
					setTimeout(() => {
						const newSelection = window.getSelection();
						if (newSelection && newSelection.rangeCount > 0) {
							const newRange = newSelection.getRangeAt(0);
							const newParent =
								newRange.commonAncestorContainer.nodeType ===
									Node.TEXT_NODE
									? newRange.commonAncestorContainer
										.parentElement
									: (newRange.commonAncestorContainer as Element);

							const newListItem = newParent?.closest('li');
							if (
								newListItem &&
								!newListItem.textContent?.trim()
							) {
								newListItem.innerHTML = '<br>';
								// Apply font styles to new list item
								newListItem.style.fontSize = `${fontSize}px`;
								newListItem.style.fontFamily = fontFamily;
								if (isCanvasFormat) {
									newListItem.style.color = bodyColor;
								}
								// Position cursor at start of list item
								const listRange = document.createRange();
								listRange.setStart(newListItem, 0);
								listRange.collapse(true);
								newSelection.removeAllRanges();
								newSelection.addRange(listRange);
							}
						}
					}, 10);
				}
			}
		} else {
			// @ts-ignore - deprecated API but no modern alternative exists
			document.execCommand(command, false, value);
		}

		if (
			command === 'insertUnorderedList' ||
			command === 'insertOrderedList'
		) {
			root.querySelectorAll('ol, ul, li').forEach((el) => {
				(el as HTMLElement).style.removeProperty('text-align');
			});
		}

		emitContent(root.innerHTML);

		setTimeout(() => {
			if (!isCanvasFormat) {
				const allElements = root.querySelectorAll('*');
				allElements.forEach((element: Element) => {
					const htmlElement = element as HTMLElement;
					if (
						!htmlElement.style.fontSize ||
						htmlElement.style.fontSize === ''
					) {
						htmlElement.style.fontSize = `${fontSize}px`;
					}
					if (
						!htmlElement.style.fontFamily ||
						htmlElement.style.fontFamily === ''
					) {
						htmlElement.style.fontFamily = fontFamily;
					}
				});
			}
			processLinks();
			updateActiveFormats();
		}, 50);
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();

		const html = e.clipboardData.getData('text/html');
		const text = e.clipboardData.getData('text/plain');

		if (!html && !text) return;

		if (!html) {
			// @ts-ignore - deprecated API but no modern alternative exists
			document.execCommand('insertText', false, text);
			if (getEditorEl()) emitContent(getEditorEl()!.innerHTML);
			return;
		}

		// Tag mapping for supported formatting
		const tagMap: Record<
			string,
			(el: HTMLElement, content: string) => string
		> = {
			b: (_, content) => `<strong>${content}</strong>`,
			strong: (_, content) => `<strong>${content}</strong>`,
			i: (_, content) => `<em>${content}</em>`,
			em: (_, content) => `<em>${content}</em>`,
			u: (_, content) => `<u>${content}</u>`,
			s: (_, content) => `<s>${content}</s>`,
			strike: (_, content) => `<s>${content}</s>`,
			del: (_, content) => `<s>${content}</s>`,
			a: (el, content) =>
				`<a href="${el.getAttribute('href') || ''}">${content}</a>`,
			ul: (_, content) => `<ul>${content}</ul>`,
			ol: (_, content) => `<ol>${content}</ol>`,
			li: (_, content) => `<li>${content}</li>`,
			br: () => '<br>',
			span: (el, content) =>
				el.style.color
					? `<span style="color: ${el.style.color}">${content}</span>`
					: content,
			div: (el, content) =>
				el.style.textAlign
					? `<div style="text-align: ${el.style.textAlign}">${content}</div>`
					: `<div>${content}</div>`,
			p: (el, content) =>
				el.style.textAlign
					? `<div style="text-align: ${el.style.textAlign}">${content}</div>`
					: `<div>${content}</div>`,
		};

		const cleanHTML = (element: HTMLElement): string => {
			let result = '';
			element.childNodes.forEach((node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					result += node.textContent;
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					const el = node as HTMLElement;
					const tagName = el.tagName.toLowerCase();
					const content = cleanHTML(el);
					result += tagMap[tagName]
						? tagMap[tagName](el, content)
						: content;
				}
			});
			return result;
		};

		const temp = document.createElement('div');
		temp.innerHTML = html;
		const cleanedHTML = cleanHTML(temp);

		// @ts-ignore - deprecated API but no modern alternative exists
		document.execCommand('insertHTML', false, cleanedHTML);

		if (getEditorEl()) {
			processLinks();
			emitContent(getEditorEl()!.innerHTML);
		}
	};

	const handleInput = () => {
		if (getEditorEl()) {
			processLinks(); // Process links after any input
			emitContent(getEditorEl()!.innerHTML);
			// Update active formats when content changes
			updateActiveFormats();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0) return;

			const range = selection.getRangeAt(0);
			const parentElement =
				range.commonAncestorContainer.nodeType === Node.TEXT_NODE
					? range.commonAncestorContainer.parentElement
					: (range.commonAncestorContainer as Element);

			// Check if we're inside a list
			const listItem = parentElement?.closest('li');
			const list = parentElement?.closest('ul, ol');

			if (listItem && list) {
				e.preventDefault();

				if (e.shiftKey) {
					// Shift+Enter in list = line break within list item
					// @ts-ignore - deprecated API but no modern alternative exists
					document.execCommand('insertHTML', false, '<br>');
				} else {
					// Enter in list = new list item
					// Check if current list item is empty
					const listItemText = listItem.textContent?.trim();

					if (!listItemText || listItemText === '') {
						// Empty list item - exit the list
						const newParagraph = document.createElement('p');
						newParagraph.innerHTML = '<br>';
						if (isCanvasFormat) {
							newParagraph.style.color = bodyColor;
						}

						// Insert after the list
						if (list.nextSibling) {
							list.parentNode?.insertBefore(
								newParagraph,
								list.nextSibling
							);
						} else {
							list.parentNode?.appendChild(newParagraph);
						}

						// Remove empty list item
						listItem.remove();

						// Move cursor to new paragraph
						const newRange = document.createRange();
						newRange.setStart(newParagraph, 0);
						newRange.collapse(true);
						selection.removeAllRanges();
						selection.addRange(newRange);
					} else {
						// Create new list item with proper formatting
						const newListItem = createListItem();

						// Insert after current list item
						if (listItem.nextSibling) {
							list.insertBefore(
								newListItem,
								listItem.nextSibling
							);
						} else {
							list.appendChild(newListItem);
						}

						// Move cursor to new list item
						const newRange = document.createRange();
						newRange.setStart(newListItem, 0);
						newRange.collapse(true);
						selection.removeAllRanges();
						selection.addRange(newRange);
					}
				}
			} else {
				// Not in a list - use default behavior but prevent double line breaks
				if (e.shiftKey) {
					// Shift+Enter = single line break
					e.preventDefault();
					// @ts-ignore - deprecated API but no modern alternative exists
					document.execCommand('insertHTML', false, '<br>');
				}
				// Let normal Enter behavior work for paragraphs
			}

			if (getEditorEl()) {
				emitContent(getEditorEl()!.innerHTML);
			}
		}
	};

	// Enhanced link handling
	const saveEditorSelection = () => {
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			savedSelectionRef.current = {
				startContainer: range.startContainer,
				startOffset: range.startOffset,
				endContainer: range.endContainer,
				endOffset: range.endOffset,
			};
			return range;
		}
		savedSelectionRef.current = null;
		return null;
	};

	const restoreEditorSelection = (): Range | null => {
		const selection = window.getSelection();
		if (!selection || !savedSelectionRef.current) {
			return null;
		}

		getEditorEl()?.focus();

		const range = document.createRange();
		try {
			range.setStart(
				savedSelectionRef.current.startContainer,
				savedSelectionRef.current.startOffset
			);
			range.setEnd(
				savedSelectionRef.current.endContainer,
				savedSelectionRef.current.endOffset
			);
		} catch {
			savedSelectionRef.current = null;
			return null;
		}

		selection.removeAllRanges();
		selection.addRange(range);
		return range;
	};

	const applyLinkToSelection = (url: string, fallbackText: string) => {
		const range = restoreEditorSelection();
		const selection = window.getSelection();
		if (!range || !selection) {
			const root = getEditorEl();
			if (!root) {
				return;
			}
			root.focus();
			const linkElement = document.createElement('a');
			linkElement.href = url;
			linkElement.target = '_blank';
			linkElement.rel = 'noopener noreferrer';
			linkElement.style.textDecoration = 'underline';
			linkElement.style.color = isCanvasFormat
				? defaultLinkColorResolved
				: selectedColor;
			linkElement.textContent = fallbackText;
			root.appendChild(linkElement);
			processLinks();
			emitContent(root.innerHTML);
			savedSelectionRef.current = null;
			return;
		}

		const parentElement =
			range.commonAncestorContainer.nodeType === Node.TEXT_NODE
				? range.commonAncestorContainer.parentElement
				: (range.commonAncestorContainer as Element);

		const existingLink = parentElement?.closest('a') as HTMLAnchorElement;

		if (existingLink) {
			existingLink.href = url;
			existingLink.target = '_blank';
			existingLink.rel = 'noopener noreferrer';
			existingLink.style.textDecoration = 'underline';
			if (isCanvasFormat) {
				existingLink.style.color = defaultLinkColorResolved;
			}
		} else {
			const linkElement = document.createElement('a');
			linkElement.href = url;
			linkElement.target = '_blank';
			linkElement.rel = 'noopener noreferrer';
			linkElement.style.textDecoration = 'underline';
			linkElement.style.color = isCanvasFormat
				? defaultLinkColorResolved
				: selectedColor;

			const selectedText = range.toString();
			if (selectedText) {
				try {
					range.surroundContents(linkElement);
				} catch {
					range.deleteContents();
					linkElement.textContent = selectedText;
					range.insertNode(linkElement);
				}
			} else {
				linkElement.textContent = fallbackText;
				range.insertNode(linkElement);
			}
		}

		if (getEditorEl()) {
			processLinks();
			emitContent(getEditorEl()!.innerHTML);
			setTimeout(() => {
				updateActiveFormats();
			}, 50);
		}

		savedSelectionRef.current = null;
	};

	const handleLinkClick = () => {
		const range = saveEditorSelection();
		let existingUrl = '';

		if (range) {
			const parentElement =
				range.commonAncestorContainer.nodeType === Node.TEXT_NODE
					? range.commonAncestorContainer.parentElement
					: (range.commonAncestorContainer as Element);

			const existingLink = parentElement?.closest(
				'a'
			) as HTMLAnchorElement;
			if (existingLink) {
				existingUrl = existingLink.getAttribute('href') || '';
			}
		}

		setCurrentLinkData({ url: existingUrl });
		setIsLinkDialogOpen(true);
	};

	const handleLinkConfirm = (linkData: LinkData) => {
		applyLinkToSelection(linkData.url, linkData.url);
	};

	const handleLinkTriggerPick = (trigger: PickedLinkTrigger) => {
		applyLinkToSelection(trigger.url, trigger.linkText);
	};

	const handleOpenLinkTriggerPicker = () => {
		const range = saveEditorSelection();
		skipLinkTextStepRef.current = Boolean(range?.toString().trim());
		setIsLinkTriggerPickerOpen(true);
	};

	const handleInsertMergeTag = async (tagValue: string) => {
		// Copy to clipboard
		try {
			await navigator.clipboard.writeText(tagValue);
			setShowCopyNotification(true);

			// Hide notification after 5 seconds
			setTimeout(() => {
				setShowCopyNotification(false);
			}, 5000);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
		}

		if (getEditorEl()) {
			// Focus the editor first
			getEditorEl()?.focus();

			// Insert the merge tag at cursor position
			// @ts-ignore - deprecated API but no modern alternative exists
			document.execCommand('insertHTML', false, tagValue);

			// Update the content
			emitContent(getEditorEl()!.innerHTML);
		}

		// Close the modal
		setIsMergeTagsModalOpen(false);
	};

	// Convert HTML to text for initial display if needed
	const getInitialContent = () => {
		if (!content) return '';
		// If content looks like HTML, use it directly
		if (content.includes('<') && content.includes('>')) {
			return content;
		}
		// Otherwise, treat as plain text and wrap in paragraph
		return `<p>${content}</p>`;
	};

	const toolbarIconBtn = (active: boolean) =>
		cn(
			isBuilderDark
				? cn(
						'h-9 w-9 shrink-0 rounded-md border p-0 text-white shadow-none bg-transparent hover:bg-transparent active:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
						active ? 'border-white' : 'border-transparent'
				  )
				: cn('h-8 w-8 p-2', active && 'bg-accent')
		);

	const toolbarSep = isBuilderDark
		? 'mx-0.5 h-7 w-px shrink-0 bg-white/20'
		: 'mx-1 h-6 w-px shrink-0 bg-border';

	/** SVG dashed frame: short dash, longer gap */
	const toolbarDashPattern = '5 14';

	return (
		<div className={cn('relative w-full', className)}>
			{!isCanvasFormat && (
				<style>{`
				.${editorId} {
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
				}
				${
					placeholder
						? `.${editorId}:empty::before {
					content: ${JSON.stringify(placeholder)};
					color: #9ca3af;
					pointer-events: none;
					cursor: text;
				}`
						: ''
				}
				.${editorId} * {
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
				}
				.${editorId} p {
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
					margin: 0 !important;
				}
				.${editorId} div {
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
				}
				.${editorId} span {
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
				}
				.${editorId} ul {
					list-style-type: disc !important;
					padding-left: 20px !important;
					margin: 10px 0 !important;
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
				}
				.${editorId} ol {
					list-style-type: decimal !important;
					padding-left: 20px !important;
					margin: 10px 0 !important;
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
				}
				.${editorId} li {
					display: list-item !important;
					margin: 5px 0 !important;
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
				}
				.${editorId} a {
					position: relative !important;
					text-decoration: underline !important;
					color: ${defaultLinkColorResolved};
				}
				.${editorId} a:hover::after {
					content: attr(href) !important;
					position: absolute !important;
					bottom: 100% !important;
					left: 50% !important;
					transform: translateX(-50%) !important;
					background: rgba(0, 0, 0, 0.9) !important;
					color: white !important;
					padding: 6px 10px !important;
					border-radius: 6px !important;
					font-size: 12px !important;
					white-space: nowrap !important;
					z-index: 1000 !important;
					pointer-events: none !important;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
					margin-bottom: 5px !important;
				}
				.${editorId} a:hover::before {
					content: '' !important;
					position: absolute !important;
					top: 100% !important;
					left: 50% !important;
					transform: translateX(-50%) !important;
					border: 5px solid transparent !important;
					border-top-color: rgba(0, 0, 0, 0.9) !important;
					z-index: 1001 !important;
					margin-top: -5px !important;
				}
			`}</style>
			)}
			<div
				className={cn(
					'rich-text-toolbar relative mb-2 w-full rounded-xl [&_button_svg]:stroke-[2.5]',
					isBuilderDark
						? 'flex flex-col gap-2 bg-transparent p-2 [&_button]:text-white'
						: 'flex flex-wrap items-center gap-1 rounded-lg border border-border bg-white p-2 shadow-sm [&_button]:text-foreground'
				)}
			>
				{isBuilderDark && (
					<svg
						className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-white/45"
						aria-hidden
					>
						<rect
							x="1"
							y="1"
							width="calc(100% - 2px)"
							height="calc(100% - 2px)"
							rx="11"
							ry="11"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.25"
							strokeDasharray={toolbarDashPattern}
							strokeLinecap="round"
							vectorEffect="non-scaling-stroke"
						/>
					</svg>
				)}
				<div
					className={cn(
						isBuilderDark
							? 'relative z-[1] flex w-full flex-wrap items-center gap-1.5'
							: 'contents'
					)}
				>
					{/* Text formatting — B, U, I, S (Figma order) */}
					<Button
						variant="ghost"
						size="sm"
						className={toolbarIconBtn(activeFormats.bold)}
						onClick={() => executeCommand('bold')}
						onMouseDown={(e) => e.preventDefault()}
					>
						<Bold className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						className={toolbarIconBtn(activeFormats.underline)}
						onClick={() => executeCommand('underline')}
						onMouseDown={(e) => e.preventDefault()}
					>
						<Underline className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						className={toolbarIconBtn(activeFormats.italic)}
						onClick={() => executeCommand('italic')}
						onMouseDown={(e) => e.preventDefault()}
					>
						<Italic className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						className={toolbarIconBtn(activeFormats.strikeThrough)}
						onClick={() => executeCommand('strikeThrough')}
						onMouseDown={(e) => e.preventDefault()}
					>
						<Strikethrough className="h-4 w-4" />
					</Button>

					<div className={toolbarSep} />

					{!isCanvasFormat && (
						<>
							{/* Text alignment — block-level in the email builder */}
							<Button
								variant="ghost"
								size="sm"
								className={toolbarIconBtn(activeFormats.justifyLeft)}
								onClick={() => executeCommand('justifyLeft')}
								onMouseDown={(e) => e.preventDefault()}
							>
								<AlignLeft className="h-4 w-4" />
							</Button>

							<Button
								variant="ghost"
								size="sm"
								className={toolbarIconBtn(activeFormats.justifyCenter)}
								onClick={() => executeCommand('justifyCenter')}
								onMouseDown={(e) => e.preventDefault()}
							>
								<AlignCenter className="h-4 w-4" />
							</Button>

							<Button
								variant="ghost"
								size="sm"
								className={toolbarIconBtn(activeFormats.justifyRight)}
								onClick={() => executeCommand('justifyRight')}
								onMouseDown={(e) => e.preventDefault()}
							>
								<AlignRight className="h-4 w-4" />
							</Button>

							<Button
								variant="ghost"
								size="sm"
								className={toolbarIconBtn(activeFormats.justifyFull)}
								onClick={() => executeCommand('justifyFull')}
								onMouseDown={(e) => e.preventDefault()}
							>
								<AlignJustify className="h-4 w-4" />
							</Button>

							<div className={toolbarSep} />
						</>
					)}

					{/* Lists */}
					<Button
						variant="ghost"
						size="sm"
						className={toolbarIconBtn(
							activeFormats.insertUnorderedList
						)}
						onClick={() => executeCommand('insertUnorderedList')}
						onMouseDown={(e) => e.preventDefault()}
					>
						<List className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						className={toolbarIconBtn(
							activeFormats.insertOrderedList
						)}
						onClick={() => executeCommand('insertOrderedList')}
						onMouseDown={(e) => e.preventDefault()}
					>
						<ListOrdered className="h-4 w-4" />
					</Button>

					<div className={toolbarSep} />

					{/* Per-selection font color picker removed: the contentEditable
					    selection was unreliable (recolored the whole block) and the
					    feature was bug-prone. Block-level "Font Color" lives in the
					    Text block sidebar instead. Existing inline span colors in
					    saved content still render. */}

					{!isBuilderDark && (
						<>
							<Button
								variant="ghost"
								size="sm"
								className={toolbarIconBtn(activeFormats.link)}
								onClick={handleLinkClick}
								onMouseDown={(e) => e.preventDefault()}
							>
								<Link className="h-4 w-4" />
							</Button>

							{isPro ? (
								<LinkTriggerToolbarButton
									className={toolbarIconBtn(false)}
									onMouseDown={(e) => e.preventDefault()}
									onClick={handleOpenLinkTriggerPicker}
								/>
							) : null}

							<div className={toolbarSep} />

							<Button
								variant="ghost"
								size="sm"
								className={toolbarIconBtn(false)}
								onClick={() => setIsMergeTagsModalOpen(true)}
								onMouseDown={(e) => e.preventDefault()}
								title={__(
									'Insert Merge Tags',
									'doublescale'
								)}
							>
								<MerageTagsIcon />
							</Button>
						</>
					)}
				</div>

				{isBuilderDark && (
					<div className="relative z-[1] flex w-full items-stretch gap-2 pt-0.5">
						<Button
							variant="ghost"
							size="sm"
							className={toolbarIconBtn(activeFormats.link)}
							onClick={handleLinkClick}
							onMouseDown={(e) => e.preventDefault()}
							title={__('Insert link', 'doublescale')}
						>
							<Link className="h-4 w-4" />
						</Button>
						{isPro ? (
							<LinkTriggerToolbarButton
								className={toolbarIconBtn(false)}
								onMouseDown={(e) => e.preventDefault()}
								onClick={handleOpenLinkTriggerPicker}
							/>
						) : null}
						<div
							className="mx-1.5 w-px shrink-0 self-stretch bg-white/40"
							aria-hidden
						/>
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								'h-9 min-w-0 flex-1 gap-2 rounded-md border border-transparent bg-transparent px-3 text-left text-sm font-medium text-white shadow-none hover:bg-transparent hover:text-white [&_svg]:size-4'
							)}
							onClick={() => setIsMergeTagsModalOpen(true)}
							onMouseDown={(e) => e.preventDefault()}
						>
							<MerageTagsIcon />
							<span className="min-w-0 flex-1 truncate text-left">
								{__('Insert Merge Tags', 'doublescale')}
							</span>
						</Button>
					</div>
				)}
			</div>

			{!isCanvasFormat && (
				<div
					ref={localEditorRef}
					contentEditable
					suppressContentEditableWarning
					className={cn(
						editorId,
						'w-full rounded-lg border p-3 focus:outline-none',
						isBuilderDark ? 'min-h-[100px]' : 'min-h-[200px]',
						isBuilderDark
							? 'prose prose-sm prose-invert max-w-none border-white/10 bg-white/[0.06] text-zinc-100 focus:ring-1 focus:ring-white/25'
							: 'prose prose-sm max-w-none text-foreground focus:ring-1 focus:ring-ring'
					)}
					style={
						{
							borderColor: isBuilderDark
								? 'rgba(255, 255, 255, 0.12)'
								: '#e5e5e5',
							backgroundColor: isBuilderDark
								? 'rgba(255, 255, 255, 0.06)'
								: '#ffffff',
							fontSize: `${fontSize}px`,
							fontFamily: fontFamily,
							lineHeight: '1.5',
							width: '100%',
							maxWidth: '100%',
							overflowX: 'auto',
							color: isBuilderDark
								? '#f4f4f5'
								: 'hsl(var(--foreground))',
							'--font-size': `${fontSize}px`,
							'--font-family': fontFamily,
						} as React.CSSProperties
					}
					onInput={handleInput}
					onPaste={handlePaste}
					onKeyDown={handleKeyDown}
				/>
			)}

			{/* Link Dialog */}
			<LinkDialog
				isOpen={isLinkDialogOpen}
				onClose={() => {
					setIsLinkDialogOpen(false);
					savedSelectionRef.current = null;
				}}
				onConfirm={handleLinkConfirm}
				initialUrl={currentLinkData.url}
			/>

			<LinkTriggerPickerDialog
				open={isLinkTriggerPickerOpen}
				onOpenChange={setIsLinkTriggerPickerOpen}
				onPick={handleLinkTriggerPick}
				skipLinkTextStep={skipLinkTextStepRef.current}
			/>

			{/* Merge Tags Modal */}
			<MergeTagsSelector
				visible={isMergeTagsModalOpen}
				onClose={() => setIsMergeTagsModalOpen(false)}
				onInsertTag={handleInsertMergeTag}
				triggerId={mergeTagTriggerId}
				salesEmailDocumentType={salesEmailDocumentType}
			/>

			{/* Copy Notification - Rendered via Portal to document body */}
			{showCopyNotification &&
				typeof document !== 'undefined' &&
				createPortal(
					<div className="fixed bottom-2 right-4 z-[999999] bg-green-500 text-white text-base font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 ease-out">
						<Copy className="h-4 w-4" />
						<span>{__('Merge tag copied to clipboard', 'doublescale')}</span>
					</div>,
					document.body
				)}
		</div>
	);
};
