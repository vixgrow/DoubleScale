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
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
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
import './style.scss';

const theme = {
	paragraph: 'editor-paragraph',
	text: {
		bold: 'editor-text-bold',
		italic: 'editor-text-italic',
		underline: 'editor-text-underline',
		strikethrough: 'editor-text-linethrough',
		fontFamily: 'editor-text-font-family',
		lineHeight: 'editor-text-line-height',
	},
	list: {
		ul: 'editor-list-ul',
		ol: 'editor-list-ol',
		checklist: 'editor-list-checklist',
	},
};

interface EditorProps {
	message: string;
	onChange: (html: string) => void;
	type: string;
}

export default function Editor({ message, onChange, type }: EditorProps) {
	const [editorActive, setEditorActive] = useState(false);
	const [wordCount, setWordCount] = useState(0);
	// Snapshot the initial message at mount so InitialContentPlugin (rendered
	// unconditionally) only seeds the editor once. Updating this ref after
	// mount has no effect on InitialContentPlugin's effect dep array.
	const initialMessageRef = useRef(message);

	const initialConfig = {
		namespace: 'EmailBodyEditor',
		theme,
		onError: (error: Error) => console.error(error),
		// Lexical 0.38 requires either a serialized editorState or undefined
		// here — leaving it undefined lets the composer build a clean root
		// with a default paragraph, which InitialContentPlugin then replaces.
		editorState: undefined,
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
		if (onChange) onChange(html);
	};

	const handleWordCountChange = (count: number) => {
		setWordCount(count);
	};

	// Initialize word count from the first message we ever see.
	useEffect(() => {
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = initialMessageRef.current || '';
		const text = tempDiv.textContent || tempDiv.innerText || '';
		const words = text.split(/\s+/).filter((word) => word.length > 0);
		setWordCount(words.length);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
        <div className="email-body-editor">
            <LexicalComposer initialConfig={initialConfig}>
				<div className="editor-container">
					{type == 'email' && <ToolbarPlugin type={type} />}
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
						{type === 'email' && (
							<>
								<ListPlugin />
								<LinkPlugin />
								<AutoLinkMatchers />
								<CheckListPlugin />
							</>
						)}
						{/* InitialContentPlugin must mount unconditionally on the
						 *  first render of the composer; conditionally rendering it
						 *  via a ref races against React reconciliation and leaves
						 *  Lexical with no root paragraph (error #8). The plugin's
						 *  own useEffect dep array runs once per editor instance. */}
						<InitialContentPlugin
							initialContent={initialMessageRef.current}
						/>
					</div>
					<div
                        className='flex justify-between items-center bg-[#FCFCFC] border-t py-2 px-5 text-[#1A1A1AB2]'>
						<WordCountPlugin wordCount={wordCount} />
						{type == 'sms' && <ToolbarPlugin type={type} />}
					</div>
				</div>
			</LexicalComposer>
        </div>
    );
}
