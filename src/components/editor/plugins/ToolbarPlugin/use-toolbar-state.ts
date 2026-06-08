/**
 * Shared toolbar state + behaviors used by both the email and support toolbar
 * compositions: the active Lexical editor, the current block format, the image
 * insertion command registration, and the block-format change handler.
 *
 * Extracted so the two toolbar variants ({@see EmailToolbar} / {@see SupportToolbar})
 * share this logic without either one importing the other's UI — keeping the
 * support variant free of `@doublescale/components`.
 */

/**
 * External dependencies
 */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
	$getSelection,
	$createParagraphNode,
	$getRoot,
	$isRangeSelection,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
	$createHeadingNode,
	$createQuoteNode,
	HeadingTagType,
} from '@lexical/rich-text';

/**
 * Internal dependencies
 */
import { $createImageNode } from '../../nodes/img-node';
import { INSERT_IMAGE_COMMAND } from '../../plugins/image-plugin';

export function useToolbarState() {
	const [editor] = useLexicalComposerContext();
	const [activeEditor] = useState(editor);
	const [paragraphFormat, setParagraphFormat] = useState('paragraph');

	// Register image insertion command (no-op for variants that hide the image
	// button — registering is harmless and keeps the hook variant-agnostic).
	useEffect(() => {
		if (!activeEditor) {
			return;
		}

		return activeEditor.registerCommand(
			INSERT_IMAGE_COMMAND,
			(payload) => {
				const { src, altText, width, height, id } = payload;

				if (!src) {
					console.error('Image source is undefined or empty');
					return false;
				}

				activeEditor.focus();

				try {
					activeEditor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							const imageNode = $createImageNode({
								src,
								altText: altText || 'Image',
								width: width || 'auto',
								height: height || 'auto',
								id: id || undefined,
							});
							selection.insertNodes([imageNode]);
						} else {
							const root = $getRoot();
							const lastChild = root.getLastChild();
							if (lastChild) {
								const imageNode = $createImageNode({
									src,
									altText: altText || 'Image',
									width: width || 'auto',
									height: height || 'auto',
									id: id || undefined,
								});
								lastChild.insertAfter(imageNode);
							}
						}
					});
					return true;
				} catch (error) {
					console.error('Error inserting image:', error);
					return false;
				}
			},
			0
		);
	}, [activeEditor]);

	// Reflect the selection's block format into the dropdown state.
	const updateToolbar = useCallback(() => {
		const selection = $getSelection();
		if ($isRangeSelection(selection)) {
			const anchorNode = selection.anchor.getNode();
			const element =
				anchorNode.getKey() === 'root'
					? anchorNode
					: anchorNode.getTopLevelElementOrThrow();

			const elementKey = element.getKey();
			const elementDOM = activeEditor.getElementByKey(elementKey);

			if (elementDOM) {
				if (elementDOM.tagName === 'P') {
					setParagraphFormat('paragraph');
				} else if (elementDOM.tagName === 'H1') {
					setParagraphFormat('heading-1');
				} else if (elementDOM.tagName === 'H2') {
					setParagraphFormat('heading-2');
				} else if (elementDOM.tagName === 'H3') {
					setParagraphFormat('heading-3');
				} else if (elementDOM.tagName === 'BLOCKQUOTE') {
					setParagraphFormat('quote');
				}
			}
		}
	}, [activeEditor]);

	useEffect(() => {
		return activeEditor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateToolbar();
			});
		});
	}, [activeEditor, updateToolbar]);

	const handleFormatChange = useCallback(
		(value) => {
			setParagraphFormat(value);

			activeEditor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					if (value === 'paragraph') {
						$setBlocksType(selection, () => $createParagraphNode());
					} else if (value.startsWith('heading')) {
						const headingLevel = parseInt(value.split('-')[1]);
						if (headingLevel >= 1 && headingLevel <= 6) {
							$setBlocksType(selection, () =>
								$createHeadingNode(
									`h${headingLevel}` as HeadingTagType
								)
							);
						}
					} else if (value === 'quote') {
						$setBlocksType(selection, () => $createQuoteNode());
					}
				}
			});
		},
		[activeEditor]
	);

	return {
		activeEditor,
		paragraphFormat,
		handleFormatChange,
		updateToolbar,
	};
}
