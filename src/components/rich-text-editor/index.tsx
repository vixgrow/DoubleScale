/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * external dependencies
 */
import React, { useState, useRef, useEffect } from 'react';
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Link,
	Palette,
	List,
	ListOrdered,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
} from 'lucide-react';

/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover-dialog';
import { LinkDialog, LinkData } from './LinkDialog';
import { MerageTagsIcon } from '@quillcrm/components';
import MergeTagsSelector from '@/components/merge-tags';

interface RichTextEditorProps {
	content: string;
	onChange: (content: string) => void;
	className?: string;
	fontSize?: number;
	fontFamily?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
	content,
	onChange,
	className,
	fontSize = 16,
	fontFamily = 'Arial',
}) => {
	const editorRef = useRef<HTMLDivElement>(null);
	const [selectedColor, setSelectedColor] = useState('#000000');
	const [isMergeTagsModalOpen, setIsMergeTagsModalOpen] = useState(false);
	const [editorId] = useState(
		() => `rich-text-editor-${Math.random().toString(36).substr(2, 9)}`
	);
	const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
	const [currentLinkData, setCurrentLinkData] = useState<{
		url: string;
	}>({ url: '' });
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
	});

	// Wrapper for deprecated queryCommandState (no modern alternative for contentEditable)
	const queryCommandState = (command: string): boolean => {
		// @ts-ignore - deprecated API but no modern alternative exists
		return document.queryCommandState(command);
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
		});
	};

	// Process all links to open in new tab
	const processLinks = () => {
		if (editorRef.current) {
			const links = editorRef.current.querySelectorAll('a');
			links.forEach((link) => {
				if (!link.hasAttribute('target')) {
					link.setAttribute('target', '_blank');
					link.setAttribute('rel', 'noopener noreferrer');
				}
			});
		}
	};

	// Apply font changes when props change
	useEffect(() => {
		if (editorRef.current) {
			// Set the base font styles on the editor
			editorRef.current.style.fontSize = `${fontSize}px`;
			editorRef.current.style.fontFamily = fontFamily;

			// Use CSS to ensure all content inherits the font
			editorRef.current.style.setProperty(
				'--editor-font-size',
				`${fontSize}px`
			);
			editorRef.current.style.setProperty(
				'--editor-font-family',
				fontFamily
			);

			// Apply font styles to existing content
			const allElements = editorRef.current.querySelectorAll('*');
			allElements.forEach((element: Element) => {
				const htmlElement = element as HTMLElement;
				htmlElement.style.fontSize = `${fontSize}px`;
				htmlElement.style.fontFamily = fontFamily;
			});
		}
	}, [fontSize, fontFamily]);

	// Listen for selection changes to update toolbar button states
	useEffect(() => {
		const handleSelectionChange = () => {
			// Only update if the selection is within our editor
			const selection = window.getSelection();
			if (
				selection &&
				editorRef.current?.contains(selection.anchorNode)
			) {
				updateActiveFormats();
			}
		};

		// Listen for selection changes
		document.addEventListener('selectionchange', handleSelectionChange);

		// Also update on mouseup and keyup within the editor
		const editor = editorRef.current;
		if (editor) {
			editor.addEventListener('mouseup', updateActiveFormats);
			editor.addEventListener('keyup', updateActiveFormats);
		}

		return () => {
			document.removeEventListener(
				'selectionchange',
				handleSelectionChange
			);
			if (editor) {
				editor.removeEventListener('mouseup', updateActiveFormats);
				editor.removeEventListener('keyup', updateActiveFormats);
			}
		};
	}, []);

	// Handle content initialization
	useEffect(() => {
		if (editorRef.current && content !== editorRef.current.innerHTML) {
			const currentSelection = window.getSelection();
			const currentRange =
				currentSelection && currentSelection.rangeCount > 0
					? currentSelection.getRangeAt(0)
					: null;

			editorRef.current.innerHTML = getInitialContent();

			// Process all links to open in new tab
			processLinks();

			// Restore cursor position if it existed
			if (currentRange && currentSelection) {
				try {
					currentSelection.removeAllRanges();
					currentSelection.addRange(currentRange);
				} catch (e) {
					// Ignore cursor restoration errors
				}
			}
		}
	}, [content]);

	// Helper function to create properly formatted list items
	const createListItem = () => {
		const listItem = document.createElement('li');
		listItem.innerHTML = '<br>';
		// Apply current font styles
		listItem.style.fontSize = `${fontSize}px`;
		listItem.style.fontFamily = fontFamily;
		return listItem;
	};

	const executeCommand = (command: string, value?: string) => {
		// Set default font styles before executing commands
		if (editorRef.current) {
			// @ts-ignore - deprecated API but no modern alternative exists
			document.execCommand('defaultParagraphSeparator', false, 'div');
			// @ts-ignore - deprecated API but no modern alternative exists
			document.execCommand('styleWithCSS', false, 'true');
		}

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

		if (editorRef.current) {
			onChange(editorRef.current.innerHTML);

			// Apply font styles to any newly created content
			setTimeout(() => {
				const allElements = editorRef.current!.querySelectorAll('*');
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
				// Process links to open in new tab
				processLinks();
				// Update active formats after command execution
				updateActiveFormats();
			}, 50);
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();

		const html = e.clipboardData.getData('text/html');
		const text = e.clipboardData.getData('text/plain');

		if (!html && !text) return;

		if (!html) {
			// @ts-ignore - deprecated API but no modern alternative exists
			document.execCommand('insertText', false, text);
			if (editorRef.current) onChange(editorRef.current.innerHTML);
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

		if (editorRef.current) {
			processLinks();
			onChange(editorRef.current.innerHTML);
		}
	};

	const handleInput = () => {
		if (editorRef.current) {
			processLinks(); // Process links after any input
			onChange(editorRef.current.innerHTML);
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

			if (editorRef.current) {
				onChange(editorRef.current.innerHTML);
			}
		}
	};

	const handleColorChange = (color: string) => {
		setSelectedColor(color);
		executeCommand('foreColor', color);
	};

	// Enhanced link handling
	const handleLinkClick = () => {
		const selection = window.getSelection();
		let existingUrl = '';

		// Check if selected text is already a link
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			const parentElement =
				range.commonAncestorContainer.nodeType === Node.TEXT_NODE
					? range.commonAncestorContainer.parentElement
					: (range.commonAncestorContainer as Element);

			const existingLink = parentElement?.closest(
				'a'
			) as HTMLAnchorElement;
			if (existingLink) {
				existingUrl = existingLink.href || '';
			}
		}

		// Set the current link data and open dialog
		setCurrentLinkData({ url: existingUrl });
		setIsLinkDialogOpen(true);
	};

	const handleLinkConfirm = (linkData: LinkData) => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		const parentElement =
			range.commonAncestorContainer.nodeType === Node.TEXT_NODE
				? range.commonAncestorContainer.parentElement
				: (range.commonAncestorContainer as Element);

		const existingLink = parentElement?.closest('a') as HTMLAnchorElement;

		if (existingLink) {
			// Update existing link
			existingLink.href = linkData.url;
			existingLink.target = '_blank';
			existingLink.rel = 'noopener noreferrer';
		} else {
			// Create new link
			const linkElement = document.createElement('a');
			linkElement.href = linkData.url;
			linkElement.target = '_blank';
			linkElement.rel = 'noopener noreferrer';

			try {
				range.surroundContents(linkElement);
			} catch (e) {
				// Fallback for complex selections
				const selectedText = range.toString();
				range.deleteContents();
				linkElement.textContent = selectedText;
				range.insertNode(linkElement);
			}
		}

		if (editorRef.current) {
			onChange(editorRef.current.innerHTML);
		}
	};

	const handleInsertMergeTag = (tagValue: string) => {
		if (editorRef.current) {
			// Focus the editor first
			editorRef.current.focus();

			// Insert the merge tag at cursor position
			// @ts-ignore - deprecated API but no modern alternative exists
			document.execCommand('insertHTML', false, tagValue);

			// Update the content
			onChange(editorRef.current.innerHTML);
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

	return (
		<div className={cn('relative', className)}>
			{/* Inline styles for comprehensive font control - scoped to this editor instance */}
			<style>{`
				.${editorId} {
					font-family: ${fontFamily} !important;
					font-size: ${fontSize}px !important;
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
					color: #333 !important;
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

			{/* Toolbar - Always visible */}
			<div className="rich-text-toolbar border rounded-lg p-2 mb-2 bg-white shadow-sm flex flex-wrap gap-1 items-center [&_button]:text-foreground [&_button_svg]:stroke-[2.5]">
				{/* Text Formatting */}
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.bold && 'bg-accent'
					)}
					onClick={() => executeCommand('bold')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<Bold className="h-4 w-4" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.italic && 'bg-accent'
					)}
					onClick={() => executeCommand('italic')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<Italic className="h-4 w-4" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.underline && 'bg-accent'
					)}
					onClick={() => executeCommand('underline')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<Underline className="h-4 w-4" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.strikeThrough && 'bg-accent'
					)}
					onClick={() => executeCommand('strikeThrough')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<Strikethrough className="h-4 w-4" />
				</Button>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Text Alignment */}
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.justifyLeft && 'bg-accent'
					)}
					onClick={() => executeCommand('justifyLeft')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<AlignLeft className="h-4 w-4" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.justifyCenter && 'bg-accent'
					)}
					onClick={() => executeCommand('justifyCenter')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<AlignCenter className="h-4 w-4" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.justifyRight && 'bg-accent'
					)}
					onClick={() => executeCommand('justifyRight')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<AlignRight className="h-4 w-4" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.justifyFull && 'bg-accent'
					)}
					onClick={() => executeCommand('justifyFull')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<AlignJustify className="h-4 w-4" />
				</Button>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Lists */}
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.insertUnorderedList && 'bg-accent'
					)}
					onClick={() => executeCommand('insertUnorderedList')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<List className="h-4 w-4" />
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						activeFormats.insertOrderedList && 'bg-accent'
					)}
					onClick={() => executeCommand('insertOrderedList')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<ListOrdered className="h-4 w-4" />
				</Button>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Color Picker */}
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="p-2 h-8 w-8"
							onMouseDown={(e) => e.preventDefault()}
						>
							<Palette className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-2">
						<div className="flex items-center gap-2">
							<Input
								type="color"
								value={selectedColor}
								onChange={(e) =>
									handleColorChange(e.target.value)
								}
								className="w-10 h-8 p-1 rounded"
							/>
							<Input
								type="text"
								value={selectedColor}
								onChange={(e) =>
									handleColorChange(e.target.value)
								}
								className="w-20 h-8 text-xs"
								placeholder="#000000"
							/>
						</div>
					</PopoverContent>
				</Popover>

				{/* Link */}
				<Button
					variant="ghost"
					size="sm"
					className="p-2 h-8 w-8"
					onClick={handleLinkClick}
					onMouseDown={(e) => e.preventDefault()}
				>
					<Link className="h-4 w-4" />
				</Button>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Merge Tags */}
				<Button
					variant="ghost"
					size="sm"
					className="p-2 h-8 w-8"
					onClick={() => setIsMergeTagsModalOpen(true)}
					onMouseDown={(e) => e.preventDefault()}
					title={__('Insert Merge Tags', 'quillcrm')}
				>
					<MerageTagsIcon />
				</Button>
			</div>

			{/* Editor */}
			<div
				ref={editorRef}
				contentEditable
				suppressContentEditableWarning
				className={cn(
					editorId,
					'min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring',
					'prose prose-sm max-w-none text-foreground',
					className
				)}
				style={
					{
						borderColor: '#e5e5e5',
						fontSize: `${fontSize}px`,
						fontFamily: fontFamily,
						lineHeight: '1.5',
						maxWidth: '287.2px',
						overflowX: 'scroll',
						color: 'hsl(var(--foreground))',
						// Force font inheritance for all child elements
						'--font-size': `${fontSize}px`,
						'--font-family': fontFamily,
					} as React.CSSProperties
				}
				onInput={handleInput}
				onPaste={handlePaste}
				onKeyDown={handleKeyDown}
			/>

			{/* Link Dialog */}
			<LinkDialog
				isOpen={isLinkDialogOpen}
				onClose={() => setIsLinkDialogOpen(false)}
				onConfirm={handleLinkConfirm}
				initialUrl={currentLinkData.url}
			/>

			{/* Merge Tags Modal */}
			<MergeTagsSelector
				visible={isMergeTagsModalOpen}
				onClose={() => setIsMergeTagsModalOpen(false)}
				onInsertTag={handleInsertMergeTag}
			/>
		</div>
	);
};
