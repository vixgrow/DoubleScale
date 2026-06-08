/**
 * The single public rich-text composer for the Support module — reply / note
 * composers in the admin SPA and the opening-message + reply composers in the
 * public portal renderer.
 *
 * Wraps the shared {@see EditorShell} with the slim `SupportToolbar` (text
 * formats B / I / U / S, link, and lists only). It imports the shell + support
 * toolbar DIRECTLY — never the email `Editor` — so it pulls NONE of the
 * merge-tags UI / `@doublescale/components` (the admin SPA tree). That is what
 * keeps the public support portal bundle free of the admin tree.
 */

/**
 * Internal dependencies
 */
import EditorShell from './editor-shell';
import SupportToolbar from './plugins/ToolbarPlugin/support-toolbar';

interface SupportRichTextProps {
	/** Current HTML value of the composer. */
	message: string;
	/** Fired with the serialized HTML whenever the content changes. */
	onChange: (html: string) => void;
	/** Placeholder shown when the composer is empty. */
	placeholder?: string;
}

export default function SupportRichText({
	message,
	onChange,
	placeholder = 'Type your message…',
}: SupportRichTextProps) {
	return (
		<EditorShell
			message={message}
			onChange={onChange}
			placeholder={placeholder}
			toolbar={<SupportToolbar />}
		/>
	);
}
