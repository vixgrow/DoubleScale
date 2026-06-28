/**
 * Knowledge Base — embedded Gutenberg block editor (beta, opt-in via the
 * `editor: 'blocks'` KB setting). Mounts the WordPress block editor *inside* the
 * DoubleScale admin SPA (no eject to wp-admin) and mirrors the Lexical editor's
 * interface (`initialHTML` / `onChange`) so the swap in `article-editor.tsx` is a
 * one-line conditional.
 *
 * The `@wordpress/*` packages externalise to the `wp.*` globals at build time
 * (DependencyExtractionWebpackPlugin), so WordPress serves the editor scripts;
 * the matching stylesheets are enqueued in `includes/Admin/AdminLoader.php`. The
 * `.editor-styles-wrapper` container scopes those styles (phase-1 isolation; an
 * iframe canvas is the planned phase-2 hardening).
 *
 * Content round-trips as `post_content`: `parse()` hydrates stored HTML into
 * blocks (legacy Lexical HTML becomes a single classic block), `serialize()`
 * writes block-delimited HTML back out.
 */

import { useState } from '@wordpress/element';
import { parse, serialize } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	BlockEditorProvider,
	BlockList,
	BlockTools,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import { Popover, SlotFillProvider } from '@wordpress/components';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';

// Register the core block types once per page load (guarded — calling twice is a
// no-op warning we'd rather avoid).
let coreBlocksRegistered = false;
const ensureCoreBlocks = (): void => {
	if (!coreBlocksRegistered) {
		registerCoreBlocks();
		coreBlocksRegistered = true;
	}
};

interface KbBlockEditorProps {
	/** Stored body HTML (block-delimited or legacy plain HTML). */
	initialHTML: string;
	/** Fires with serialized block HTML on every edit. */
	onChange: (html: string) => void;
}

const KbBlockEditor = ({ initialHTML, onChange }: KbBlockEditorProps) => {
	ensureCoreBlocks();

	const [blocks, setBlocks] = useState(() => parse(initialHTML || ''));

	// Update local state on every change and push serialized HTML to the parent.
	// `onInput` = content edits (typing); `onChange` = structural (add/remove) —
	// both must serialize so `content` never goes stale.
	const handleChange = (next: ReturnType<typeof parse>): void => {
		setBlocks(next);
		onChange(serialize(next));
	};

	return (
		<div className="doublescale-kb-block-editor editor-styles-wrapper min-h-[360px] p-4">
			<ShortcutProvider>
				<SlotFillProvider>
					<BlockEditorProvider
						value={blocks}
						onInput={handleChange}
						onChange={handleChange}
						settings={{}}
					>
						<BlockTools>
							<WritingFlow>
								<ObserveTyping>
									<BlockList />
								</ObserveTyping>
							</WritingFlow>
						</BlockTools>
						{/* Floating UI (block toolbar, link popover, slash inserter). */}
						<Popover.Slot />
					</BlockEditorProvider>
				</SlotFillProvider>
			</ShortcutProvider>
		</div>
	);
};

export default KbBlockEditor;
