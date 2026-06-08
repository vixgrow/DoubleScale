/**
 * Email-variant rich text editor — the full email-builder composer used by the
 * email settings, double opt-in, campaign/send-email, and booking notification
 * pages. Wraps the shared {@see EditorShell} with the heavy `EmailToolbar`
 * (block formats, image, merge tags, alignment).
 *
 * Support composers must NOT import this module — it pulls the merge-tags UI
 * (`@doublescale/components`, the admin SPA tree). They use
 * {@see SupportRichText}, which injects the import-clean `SupportToolbar` into
 * the same shell.
 */

/**
 *  Internal dependencies
 */
import EditorShell from './editor-shell';
import EmailToolbar from './plugins/ToolbarPlugin/email-toolbar';

interface EditorProps {
	message: string;
	onChange: (html: string) => void;
	/** Placeholder shown when the editor is empty. */
	placeholder?: string;
}

function Editor({ message, onChange, placeholder }: EditorProps) {
	return (
		<EditorShell
			message={message}
			onChange={onChange}
			placeholder={placeholder}
			toolbar={<EmailToolbar />}
		/>
	);
}

export default Editor;
