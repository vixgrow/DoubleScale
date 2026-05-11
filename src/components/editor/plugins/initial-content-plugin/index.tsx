/**
 *  External dependencies
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';

interface InitialContentPluginProps {
	initialContent: string;
}

export default function InitialContentPlugin({
	initialContent,
}: InitialContentPluginProps) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		if (!initialContent) return;

		editor.update(() => {
			try {
				const parser = new DOMParser();
				const dom = parser.parseFromString(initialContent, 'text/html');
				const hasContent = dom.body && dom.body.childNodes.length > 0;

				if (!hasContent) {
					const root = $getRoot();
					root.clear();
					root.append($createParagraphNode());
					return;
				}

				const root = $getRoot();
				const newNodes = $generateNodesFromDOM(editor, dom);

				root.clear();

				newNodes.forEach((node) => {
					if (node.getType() === 'text') {
						const paragraph = $createParagraphNode();
						paragraph.append(node);
						root.append(paragraph);
					} else {
						root.append(node);
					}
				});

				if (root.getChildrenSize() === 0) {
					root.append($createParagraphNode());
				}
			} catch (error) {
				console.error('Error initializing content:', error);
				const root = $getRoot();
				root.clear();
				root.append($createParagraphNode());
			}
		});
	}, [editor, initialContent]);

	return null;
}
