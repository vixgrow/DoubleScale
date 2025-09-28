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
	const [editorId] = useState(() => `rich-text-editor-${Math.random().toString(36).substr(2, 9)}`);

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

	// Handle content initialization
	useEffect(() => {
		if (editorRef.current && content !== editorRef.current.innerHTML) {
			const currentSelection = window.getSelection();
			const currentRange =
				currentSelection && currentSelection.rangeCount > 0
					? currentSelection.getRangeAt(0)
					: null;

			editorRef.current.innerHTML = getInitialContent();

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
			document.execCommand('defaultParagraphSeparator', false, 'div');
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
					document.execCommand(command, false, value);
				} else {
					// Create a new list
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
			}, 50);
		}
	};

	const handleInput = () => {
		if (editorRef.current) {
			onChange(editorRef.current.innerHTML);
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
					document.execCommand('insertHTML', false, '<br>');
				}
				// Let normal Enter behavior work for paragraphs
			}

			if (editorRef.current) {
				onChange(editorRef.current.innerHTML);
			}
		}
	};

	const isCommandActive = (command: string) => {
		return document.queryCommandState(command);
	};

	const handleColorChange = (color: string) => {
		setSelectedColor(color);
		executeCommand('foreColor', color);
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
			`}</style>

			{/* Toolbar - Always visible */}
			<div className="rich-text-toolbar border rounded-lg p-2 mb-2 bg-white shadow-sm flex flex-wrap gap-1 items-center">
				{/* Text Formatting */}
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						isCommandActive('bold') && 'bg-accent'
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
						isCommandActive('italic') && 'bg-accent'
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
						isCommandActive('underline') && 'bg-accent'
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
						isCommandActive('strikeThrough') && 'bg-accent'
					)}
					onClick={() => executeCommand('strikeThrough')}
					onMouseDown={(e) => e.preventDefault()}
				>
					<Strikethrough className="h-4 w-4" />
				</Button>

				<div className="w-px h-6 bg-border mx-1" />

				{/* Lists */}
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'p-2 h-8 w-8',
						isCommandActive('insertUnorderedList') && 'bg-accent'
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
						isCommandActive('insertOrderedList') && 'bg-accent'
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
					onClick={() => {
						const url = prompt(__('Enter URL:', 'quillcrm'));
						if (url) {
							executeCommand('createLink', url);
						}
					}}
					onMouseDown={(e) => e.preventDefault()}
				>
					<Link className="h-4 w-4" />
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
					'prose prose-sm max-w-none',
					className
				)}
				style={
					{
						borderColor: '#e5e5e5',
						fontSize: `${fontSize}px`,
						fontFamily: fontFamily,
						lineHeight: '1.5',
						maxWidth: '287.2px',
						// Force font inheritance for all child elements
						'--font-size': `${fontSize}px`,
						'--font-family': fontFamily,
					} as React.CSSProperties
				}
				onInput={handleInput}
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
};
