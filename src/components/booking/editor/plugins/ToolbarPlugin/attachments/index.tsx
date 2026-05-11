/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { IoLinkOutline } from 'react-icons/io5';
import { LiaImageSolid } from 'react-icons/lia';
import { useCallback, useState, useMemo, useEffect } from 'react';
import { $getSelection, $createTextNode, $isRangeSelection, $isElementNode, $createParagraphNode, $getRoot, $isTextNode } from 'lexical';
import { $wrapNodes } from '@lexical/selection';
import { $createLinkNode, $isLinkNode } from '@lexical/link';
/**
 * Internal dependencies
 */
import { INSERT_IMAGE_COMMAND } from '../../../plugins/image-plugin';
import {
	MergeTagModal,
	Header,
	UrlIcon,
	WebhookListIcon,
} from '@/components/booking';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Dialog,
	DialogContent,
	DialogFooter,
} from '@/components/ui/dialog';

interface AttachmentsProps {
	activeEditor: any;
}

export default function Attachments({ activeEditor }: AttachmentsProps) {
	// State for managing modals
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [mergeTagModal, setMergeTagModal] = useState(false);
	const [linkUrl, setLinkUrl] = useState('');
	const [linkText, setLinkText] = useState('');
	const [selectedText, setSelectedText] = useState('');
	const [isEditingExistingLink, setIsEditingExistingLink] = useState(false);

	// Add click handler for links in the editor
	useEffect(() => {
		const handleLinkClick = (event: Event) => {
			const target = event.target as HTMLElement;
			const linkElement = target.closest('a');

			if (linkElement) {
				event.preventDefault();
				event.stopPropagation();

				const href = linkElement.getAttribute('href');
				const text = linkElement.textContent || '';

				if (href) {
					// Set the selection to the clicked link
					activeEditor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							// Find the link node and select it
							const linkNode = selection.anchor.getNode();
							if (linkNode) {
								selection.focus.set(linkNode.getKey(), 0, 'text');
								selection.anchor.set(linkNode.getKey(), linkNode.getTextContentSize(), 'text');
							}
						}
					});

					setLinkUrl(href);
					setLinkText(text);
					setSelectedText(text);
					setIsEditingExistingLink(true);
					setLinkModalOpen(true);
				}
			}
		};

		// Add click listener to the editor container
		const editorElement = document.querySelector('.editor-input');
		if (editorElement) {
			editorElement.addEventListener('click', handleLinkClick as EventListener);
		}

		return () => {
			if (editorElement) {
				editorElement.removeEventListener('click', handleLinkClick as EventListener);
			}
		};
	}, [activeEditor]);

	// Function to open WordPress media library
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

	// Function to handle merge tag selection for URLs
	const handleMergeTagClick = useCallback((tagValue: string) => {
		setLinkUrl((prev) => prev + tagValue);
		setMergeTagModal(false);
	}, []);

	// Function to open the link modal and capture selected text
	const openLinkModal = useCallback(() => {
		activeEditor.focus();
		activeEditor.update(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const text = selection.getTextContent();
				setSelectedText(text);
				setLinkText(text || '');
				setIsEditingExistingLink(false);
			}
		});
		setLinkModalOpen(true);
	}, [activeEditor]);

	// Function to insert the link into the editor
	const insertLink = useCallback(() => {
		if (linkUrl) {
			activeEditor.focus();
			activeEditor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					let linkNode;

					if (isEditingExistingLink) {
						// If editing existing link, remove the old link first
						const nodes = selection.getNodes();
						nodes.forEach(node => {
							if ($isLinkNode(node)) {
								// Create a new text node with the same content
								const textNode = $createTextNode(node.getTextContent());
								// Replace the link node with the text node
								node.replace(textNode);
							}
						});
					}

					// Get the current paragraph node or create a new one
					let paragraphNode = selection.anchor.getNode().getParent();
					if (!paragraphNode || !$isElementNode(paragraphNode)) {
						paragraphNode = $createParagraphNode();
						const root = $getRoot();
						root.append(paragraphNode);
					}

					if (selection.isCollapsed() || !selectedText) {
						const textToUse = linkText || linkUrl;
						const linkTextNode = $createTextNode(textToUse);
						linkNode = $createLinkNode(linkUrl, {
							rel: 'noopener noreferrer',
							target: '_blank',
						});
						linkNode.append(linkTextNode);

						// Insert the link node at the current selection
						if (selection.isCollapsed()) {
							// If we're at the end of a paragraph, append to current paragraph
							if (selection.anchor.offset === paragraphNode.getTextContentSize()) {
								paragraphNode.append(linkNode);
							} else {
								// Get the current text node
								const currentNode = selection.anchor.getNode();
								if ($isTextNode(currentNode)) {
									// Split the text node at the cursor position
									const splitPoint = selection.anchor.offset;
									const textContent = currentNode.getTextContent();
									const beforeText = textContent.slice(0, splitPoint);
									const afterText = textContent.slice(splitPoint);

									// Create new text nodes for before and after
									const beforeNode = $createTextNode(beforeText);
									const afterNode = $createTextNode(afterText);

									// Replace the current node with the new structure
									currentNode.replace(beforeNode);
									beforeNode.insertAfter(linkNode);
									linkNode.insertAfter(afterNode);
								} else {
									// If we're not in a text node, ensure we're in a paragraph
									const parentNode = currentNode.getParent();
									if (parentNode) {
										// Create a new text node for the link
										const newTextNode = $createTextNode(textToUse);
										linkNode.append(newTextNode);

										// Insert the link node after the current node
										currentNode.insertAfter(linkNode);
									} else {
										// If no parent node, create a new paragraph
										const newParagraph = $createParagraphNode();
										newParagraph.append(linkNode);
										const root = $getRoot();
										root.append(newParagraph);
									}
								}
							}
						} else {
							// If text is selected, wrap it in a link
							linkNode = $createLinkNode(linkUrl, {
								rel: 'noopener noreferrer',
								target: '_blank',
							});
							$wrapNodes(selection, () => linkNode);
						}
					} else {
						linkNode = $createLinkNode(linkUrl, {
							rel: 'noopener noreferrer',
							target: '_blank',
						});
						$wrapNodes(selection, () => linkNode);
					}

					// Ensure the link is in a paragraph node
					if (linkNode) {
						const linkParent = linkNode.getParent();
						if (!linkParent || !$isElementNode(linkParent)) {
							const newParagraph = $createParagraphNode();
							newParagraph.append(linkNode);
							const root = $getRoot();
							root.append(newParagraph);
						}
					}

					// Clean up empty paragraphs
					const root = $getRoot();
					const children = root.getChildren();
					children.forEach(child => {
						if (child.getTextContentSize() === 0) {
							child.remove();
						}
					});
				}
			});

			setLinkUrl('');
			setLinkText('');
			setIsEditingExistingLink(false);
			setLinkModalOpen(false);
		}
	}, [activeEditor, linkUrl, linkText, selectedText, isEditingExistingLink]);

	// Memoized Link Modal component
	const LinkModal = useMemo(
		() => (
			<Dialog
                open={linkModalOpen}
                onOpenChange={open => {
                    if (!open) (() => {
                        setLinkModalOpen(false);
                        setLinkUrl('');
                        setLinkText('');
                    })();
                }}><DialogContent className='z-[150250]'>
                    <div className='flex flex-col gap-4'>
                        <div className='flex gap-2.5 items-center'>
                            <span className="bg-[#EDEDED] p-2 rounded">
                                <WebhookListIcon width={24} height={24} />
                            </span>
                            <Header
                                header={__('Add Link', 'doublescale')}
                                subHeader={__(
                                    'Choose your Merge tags type and Select one of them related to your input.',
                                    'doublescale'
                                )}
                            />
                        </div>
                        <div className="mb-6">
                            <span className="text-[#09090B] text-[16px] font-semibold">
                                {__('Link', 'doublescale')}
                                <span className="text-red-500">*</span>
                            </span>
                            {/* shadcn Input has no `suffix` prop (antd did) — the
                              * inline merge-tag button has to be a sibling node
                              * inside a flex wrapper instead. */}
                            <div className="flex items-stretch mt-2 border rounded-lg overflow-hidden">
                                <Input
                                    value={linkUrl}
                                    onChange={(e) =>
                                        setLinkUrl(e.target.value)
                                    }
                                    placeholder="https://example.com"
                                    className="h-[48px] border-0 shadow-none focus-visible:ring-0 px-3"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    aria-label={__(
                                        'Insert merge tag',
                                        'doublescale'
                                    )}
                                    className="bg-[#EEEEEE] px-3 hover:bg-[#E0E0E0] cursor-pointer"
                                    onClick={() => setMergeTagModal(true)}
                                >
                                    <UrlIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setLinkModalOpen(false);
                                setLinkUrl('');
                                setLinkText('');
                            }}
                        >
                            {__('Cancel', 'doublescale')}
                        </Button>
                        <Button
                            onClick={insertLink}
                            disabled={!linkUrl}
                            className="bg-primary text-white"
                        >
                            {__('Insert Link', 'doublescale')}
                        </Button>
                    </DialogFooter>
                </DialogContent></Dialog>
		),
		[linkModalOpen, linkUrl, linkText, selectedText, insertLink]
	);

	const MergeTagsModal = useMemo(
		() => (
			<Dialog
                open={mergeTagModal}
                onOpenChange={open => {
                    if (!open)
                        (() => setMergeTagModal(false))();
                }}><DialogContent className='max-w-[1000px] z-[150300] h-[90vh] overflow-y-auto'>
                    <div className='flex gap-2.5 items-center border-b pb-4 mb-4'>
                        <div className="bg-[#EDEDED] rounded-lg p-3 mt-2">
                            <UrlIcon />
                        </div>
                        <Header
                            header={__('Link with Merge Tags', 'doublescale')}
                            subHeader={__(
                                'Choose your Merge tags type and Select one of them to insert into your link URL.',
                                'doublescale'
                            )}
                        />
                    </div>
                    <MergeTagModal onMentionClick={handleMergeTagClick} />
                </DialogContent></Dialog>
		),
		[mergeTagModal, handleMergeTagClick]
	);

	return (
        <>
            {/* Link and Image buttons */}
            <div className='flex gap-2.5 border-r pr-5'>
				<Button
					onClick={openLinkModal}
					title="Insert Link"
					variant="ghost"
					size="icon"
					className="border-none shadow-none cursor-pointer [&_svg]:size-5"
				>
					<IoLinkOutline className="text-[20px] text-[#52525B] hover:text-primary" />
				</Button>
				<Button
					onClick={openMediaLibrary}
					title="Insert Image from Media Library"
					variant="ghost"
					size="icon"
					className="border-none shadow-none cursor-pointer [&_svg]:size-5"
				>
					<LiaImageSolid className="text-[20px] text-[#52525B] hover:text-primary" />
				</Button>
			</div>
            {/* Render modals */}
            {LinkModal}
            {MergeTagsModal}
        </>
    );
}
