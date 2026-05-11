/**
 *  External dependencies
 */
import { useEffect, useState, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TextNode } from 'lexical';

/**
 *  Internal dependencies
 */
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { MentionNode } from './nodes/mention-node';
import { ImageNode } from './nodes/img-node';
import AutoLinkMatchers from './plugins/autolink-plugin';
import HtmlSerializer from './html-serializer';
import InitialContentPlugin from './plugins/initial-content-plugin';
import WordCountPlugin from './word-count';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import './style.scss';

function ExternalContentPlugin({
	content,
	onApplied,
}: {
	content: string;
	onApplied: () => void;
}) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		editor.update(() => {
			try {
				const root = $getRoot();
				root.clear();

				if (!content) {
					root.append($createParagraphNode());
					onApplied();
					return;
				}

				const parser = new DOMParser();
				const dom = parser.parseFromString(content, 'text/html');
				const newNodes = $generateNodesFromDOM(editor, dom);

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
				console.error('Error setting external content:', error);
				const root = $getRoot();
				root.clear();
				root.append($createParagraphNode());
			}
		});
		onApplied();
	}, [editor, content, onApplied]);

	return null;
}

const theme = {
	paragraph: 'editor-paragraph',
	text: {
		bold: 'editor-text-bold',
		italic: 'editor-text-italic',
		underline: 'editor-text-underline',
		strikethrough: 'editor-text-linethrough',
	},
	list: {
		ul: 'editor-list-ul',
		ol: 'editor-list-ol',
	},
};

interface EditorProps {
	message: string;
	onChange: (html: string) => void;
}

function Editor({ message, onChange }: EditorProps) {
	const [editorActive, setEditorActive] = useState(false);
	const [wordCount, setWordCount] = useState(0);
	const initialLoadRef = useRef(true);
	const lastMessageRef = useRef(message);
	const initialMessageRef = useRef(message);
	const [externalContent, setExternalContent] = useState<string | null>(null);

	const initialConfig = {
		namespace: 'EmailBodyEditor',
		theme,
		onError: (error: Error) => console.error(error),
		nodes: [
			HeadingNode,
			ListNode,
			AutoLinkNode,
			ListItemNode,
			TextNode,
			QuoteNode,
			TableNode,
			TableCellNode,
			TableRowNode,
			LinkNode,
			MentionNode,
			ImageNode,
		],
	};

	const handleHtmlChange = (html: string) => {
		lastMessageRef.current = html;
		if (onChange) onChange(html);
	};

	const handleWordCountChange = (count: number) => {
		setWordCount(count);
	};

	// Set initial word count from initial message
	useEffect(() => {
		if (initialLoadRef.current) {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = message || '';
			const text = tempDiv.textContent || tempDiv.innerText || '';
			const words = text.split(/\s+/).filter((word) => word.length > 0);
			setWordCount(words.length);
		}
	}, [message]);

	// Detect external message changes and push them to the editor
	useEffect(() => {
		if (initialLoadRef.current) {
			initialLoadRef.current = false;
			return;
		}

		if (message !== lastMessageRef.current) {
			lastMessageRef.current = message;
			setExternalContent(message);

			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = message || '';
			const text = tempDiv.textContent || tempDiv.innerText || '';
			const words = text.split(/\s+/).filter((word) => word.length > 0);
			setWordCount(words.length);
		}
	}, [message]);

	return (
		<div className="email-body-editor">
			<LexicalComposer initialConfig={initialConfig}>
				<div className="editor-container">
					<ToolbarPlugin />
					<div className="editor-inner">
						<RichTextPlugin
							contentEditable={
								<ContentEditable
									className="editor-input"
									onFocus={() => setEditorActive(true)}
									onBlur={() => setEditorActive(false)}
								/>
							}
							placeholder={
								<div className="editor-placeholder">
									Enter content here...
								</div>
							}
							ErrorBoundary={() => (
								<div className="editor-error"></div>
							)}
						/>
						<HtmlSerializer
							onChange={handleHtmlChange}
							onWordCountChange={handleWordCountChange}
						/>
						<HistoryPlugin />
						<ListPlugin />
						<LinkPlugin
							validateUrl={(url: string) => {
								if (/\{\{.*?\}\}/.test(url)) return true;
								return /^https?:\/\//.test(url) || /^mailto:/.test(url) || /^tel:/.test(url);
							}}
						/>
						<AutoLinkMatchers />
						<InitialContentPlugin
							initialContent={initialMessageRef.current}
						/>
						{externalContent !== null && (
							<ExternalContentPlugin
								content={externalContent}
								onApplied={() => setExternalContent(null)}
							/>
						)}
					</div>
					<div className="flex justify-between items-center bg-[#FCFCFC] border-t py-2 px-5 text-[#1A1A1AB2]">
						<WordCountPlugin wordCount={wordCount} />
					</div>
				</div>
			</LexicalComposer>
		</div>
	);
}

export default Editor;
