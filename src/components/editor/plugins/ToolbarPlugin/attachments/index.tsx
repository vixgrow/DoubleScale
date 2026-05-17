/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { Link as LinkIcon, Image } from 'lucide-react';
import { useCallback, useState, useEffect, useRef } from 'react';
import {
	$getSelection,
	$createTextNode,
	$isRangeSelection,
	$getRoot,
	$createRangeSelection,
	$setSelection,
	$findMatchingParent,
} from 'lexical';
import { $createLinkNode, $isLinkNode, $toggleLink, LinkNode } from '@lexical/link';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPortal,
	DialogTitle,
	DialogOverlay,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
/**
 * Internal dependencies
 */
import { INSERT_IMAGE_COMMAND } from '../../../plugins/image-plugin';
import { MergeTagsModal, MergeTagsIcon } from '@doublescale/components';

interface AttachmentsProps {
	activeEditor: any;
}

export default function Attachments({ activeEditor }: AttachmentsProps) {
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [mergeTagModalVisible, setMergeTagModalVisible] = useState(false);
	const [linkUrl, setLinkUrl] = useState('');
	const [linkText, setLinkText] = useState('');
	const [selectedText, setSelectedText] = useState('');
	const [isEditingExistingLink, setIsEditingExistingLink] = useState(false);
	const [isLinkActive, setIsLinkActive] = useState(false);
	const storedSelectionRef = useRef<{
		anchor: { key: string; offset: number; type: 'text' | 'element' };
		focus: { key: string; offset: number; type: 'text' | 'element' };
	} | null>(null);
	const editorRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		const rootElement = activeEditor.getRootElement();
		if (!rootElement) return;

		editorRef.current = rootElement;

		const handleLinkClick = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			const linkElement = target.closest('a');

			if (!linkElement) return;

			event.preventDefault();
			event.stopPropagation();

			const text = linkElement.textContent || '';

			let foundUrl = '';
			activeEditor.update(() => {
				const root = $getRoot();
				const allNodes = root.getAllTextNodes();
				for (const textNode of allNodes) {
					const parent = textNode.getParent();
					if (
						$isLinkNode(parent) &&
						textNode.getTextContent() === text
					) {
						foundUrl = parent.getURL();
						textNode.select(0, textNode.getTextContentSize());
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							storedSelectionRef.current = {
								anchor: {
									key: selection.anchor.key,
									offset: selection.anchor.offset,
									type: selection.anchor.type,
								},
								focus: {
									key: selection.focus.key,
									offset: selection.focus.offset,
									type: selection.focus.type,
								},
							};
						}
						break;
					}
				}
			});

			if (!foundUrl) return;

			setLinkUrl(foundUrl);
			setLinkText(text);
			setSelectedText(text);
			setIsEditingExistingLink(true);
			setLinkModalOpen(true);
		};

		rootElement.addEventListener('click', handleLinkClick);

		return () => {
			rootElement.removeEventListener('click', handleLinkClick);
		};
	}, [activeEditor]);

	// Update link button active state when selection changes (cursor/selection inside a link)
	const updateLinkState = useCallback(() => {
		activeEditor.getEditorState().read(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchorNode = selection.anchor.getNode();
				const linkParent = $findMatchingParent(anchorNode, $isLinkNode);
				setIsLinkActive(linkParent !== null);
			} else {
				setIsLinkActive(false);
			}
		});
	}, [activeEditor]);

	useEffect(() => {
		return activeEditor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateLinkState();
			});
		});
	}, [activeEditor, updateLinkState]);

	const openMediaLibrary = useCallback(() => {
		if (window.wp && window.wp.media) {
			activeEditor.focus();

			const mediaFrame = window.wp.media({
				title: 'Select or Upload Media',
				button: {
					text: 'Use this media',
				},
				multiple: false,
			});

			mediaFrame.on('select', () => {
				try {
					const attachment = mediaFrame
						.state()
						.get('selection')
						.first()
						.toJSON();

					if (!attachment || !attachment.url) {
						console.error('Invalid attachment data:', attachment);
						return;
					}

					const width = attachment.width
						? `${attachment.width}px`
						: 'auto';
					const height = attachment.height
						? `${attachment.height}px`
						: 'auto';

					const imageData = {
						src: attachment.url || '/api/placeholder/400/300',
						altText: attachment.alt || attachment.title || 'Image',
						width: width,
						height: height,
						id: attachment.id ? attachment.id.toString() : null,
					};

					activeEditor.dispatchCommand(
						INSERT_IMAGE_COMMAND,
						imageData
					);
				} catch (error) {
					console.error('Error processing media selection:', error);
					alert(
						'Failed to insert the selected image. Please try again.'
					);
				}
			});

			mediaFrame.open();
		} else {
			console.error('WordPress Media Library not available');
			const mockImageData = {
				src: '/api/placeholder/400/300',
				altText: 'Placeholder Image',
				width: '400px',
				height: '300px',
				id: undefined,
			};
			activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, mockImageData);
		}
	}, [activeEditor]);

	const handleMergeTagClick = useCallback((tagValue: string) => {
		setLinkUrl((prev) => prev + tagValue);
		setMergeTagModalVisible(false);
	}, []);

	const openLinkModal = useCallback((e?: React.MouseEvent) => {
		// Prevent editor from losing focus (and thus selection) when clicking the button
		e?.preventDefault();
		activeEditor.focus();
		activeEditor.update(() => {
			const selection = $getSelection();
			// Only open modal when text is selected (not collapsed)
			if ($isRangeSelection(selection) && !selection.isCollapsed()) {
				const text = selection.getTextContent();
				setSelectedText(text);
				setLinkText(text || '');
				setIsEditingExistingLink(false);
				// Store selection to restore when inserting (selection is lost when modal input gets focus)
				storedSelectionRef.current = {
					anchor: {
						key: selection.anchor.key,
						offset: selection.anchor.offset,
						type: selection.anchor.type,
					},
					focus: {
						key: selection.focus.key,
						offset: selection.focus.offset,
						type: selection.focus.type,
					},
				};
				setLinkUrl('');
				setLinkModalOpen(true);
			} else {
				storedSelectionRef.current = null;
			}
		});
	}, [activeEditor]);

	const insertLink = useCallback(() => {
		if (!linkUrl) return;

		const normalizedUrl = linkUrl.startsWith('http') || linkUrl.startsWith('mailto:') || linkUrl.startsWith('tel:') || /\{\{.*?\}\}/.test(linkUrl)
			? linkUrl
			: `https://${linkUrl}`;

		activeEditor.focus();
		activeEditor.update(() => {
			let selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			// Restore selection if it was lost when modal input took focus
			const stored = storedSelectionRef.current;
			if (stored) {
				try {
					const newSelection = $createRangeSelection();
					newSelection.anchor.set(stored.anchor.key, stored.anchor.offset, stored.anchor.type);
					newSelection.focus.set(stored.focus.key, stored.focus.offset, stored.focus.type);
					$setSelection(newSelection);
					selection = newSelection;
				} catch {
					// Nodes may have changed, fall through with current selection
				}
				storedSelectionRef.current = null;
			}

			if (isEditingExistingLink) {
				const nodes = selection.getNodes();
				let existingLinkNode: LinkNode | null = null;

				for (const node of nodes) {
					const parent = node.getParent();
					if ($isLinkNode(parent)) {
						existingLinkNode = parent;
						break;
					}
					if ($isLinkNode(node)) {
						existingLinkNode = node as LinkNode;
						break;
					}
				}

				if (existingLinkNode) {
					const newLinkNode = $createLinkNode(normalizedUrl, {
						rel: 'noopener noreferrer',
						target: '_blank',
					});
					const textContent = linkText || existingLinkNode.getTextContent();
					const newTextNode = $createTextNode(textContent);
					newLinkNode.append(newTextNode);
					existingLinkNode.replace(newLinkNode);
					newTextNode.select();
				}
			} else if (!selection.isCollapsed()) {
				// Text selected: use $toggleLink to wrap selection in a link (proper Lexical API)
				$toggleLink(normalizedUrl, {
					rel: 'noopener noreferrer',
					target: '_blank',
				});
			}
		});

		setLinkUrl('');
		setLinkText('');
		setSelectedText('');
		setIsEditingExistingLink(false);
		setLinkModalOpen(false);
	}, [activeEditor, linkUrl, linkText, selectedText, isEditingExistingLink]);

	const closeLinkModal = useCallback(() => {
		setLinkModalOpen(false);
		setLinkUrl('');
		setLinkText('');
		setSelectedText('');
		setIsEditingExistingLink(false);
		storedSelectionRef.current = null;
	}, []);

	return (
		<>
			<div className="flex gap-2.5 border-r pr-5">
				<Button
					onMouseDown={(e) => openLinkModal(e)}
					title="Insert Link"
					variant="ghost"
					size="icon"
					className="h-8 w-8 p-0"
				>
					<LinkIcon
						className={`w-5 h-5 hover:text-primary ${isLinkActive ? 'text-primary' : 'text-[#52525B]'}`}
					/>
				</Button>
				<Button
					onClick={openMediaLibrary}
					title="Insert Image from Media Library"
					variant="ghost"
					size="icon"
					className="h-8 w-8 p-0"
				>
					<Image className="w-5 h-5 text-[#52525B] hover:text-primary" />
				</Button>
			</div>

			<Dialog open={linkModalOpen} onOpenChange={(open) => { if (!open) closeLinkModal(); }}>
				<DialogPortal>
					<DialogOverlay className="z-[150200]" />
					<DialogContent className="sm:max-w-[500px] z-[150500]">
						<DialogHeader>
							<DialogTitle>
								{isEditingExistingLink
									? __('Edit Link', 'doublescale')
									: __('Add Link', 'doublescale')}
							</DialogTitle>
							<DialogDescription>
								{__(
									'Enter the URL of the link you want to add.',
									'doublescale'
								)}
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col gap-4">
							<div>
								<label className="text-[#09090B] text-base font-semibold">
									{__('Link', 'doublescale')}
									<span className="text-red-500 ml-1">*</span>
								</label>
								<div className="relative mt-2">
									<Input
										value={linkUrl}
										onChange={(e) =>
											setLinkUrl(e.target.value)
										}
										placeholder="https://example.com"
										className="h-12 pr-12"
										autoFocus
									/>
									<button
										type="button"
										title="Add Merge Tags"
										aria-label="Add Merge Tags"
										className="absolute right-0 top-0 h-full px-3 bg-[#EEEEEE] rounded-r-lg cursor-pointer hover:bg-[#E0E0E0] flex items-center"
										onClick={() =>
											setMergeTagModalVisible(true)
										}
									>
										<MergeTagsIcon width={20} height={20} />
									</button>
								</div>
							</div>
						</div>
						<DialogFooter>
							<Button
								onClick={insertLink}
								className="w-full mt-4"
								variant="gradient"
								size="xl"
							>
								{isEditingExistingLink
									? __('Update', 'doublescale')
									: __('Insert', 'doublescale')}
							</Button>
						</DialogFooter>
					</DialogContent>
				</DialogPortal>
			</Dialog>

			<MergeTagsModal
				visible={mergeTagModalVisible}
				onClose={() => setMergeTagModalVisible(false)}
				onInsertTag={handleMergeTagClick}
			/>
		</>
	);
}
