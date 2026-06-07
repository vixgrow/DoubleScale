/**
 * Email-variant toolbar: the full email-builder control set — block formats,
 * text formats, link (with merge-tags), image, the standalone merge-tags button,
 * lists, and alignment.
 *
 * This composition imports the merge-tags pieces (`AddingShortCode`,
 * `LinkMergeTagsTrigger`), which in turn import `@doublescale/components`. It is
 * loaded by {@see ToolbarPlugin} via `React.lazy()` so it lands in a SEPARATE
 * async chunk; the support variant never requests it. Do not import this file
 * statically from a file that the public portal bundle reaches.
 */

/**
 * Internal dependencies
 */
import FontEditing from './font-editing';
import Attachments from './attachments';
import ListStyles from './list-styles';
import AlignmentStyles from './alignment-styles';
import AddingShortCode from './adding-shortcode';
import LinkMergeTagsTrigger from './attachments/link-merge-tags-trigger';
import { useToolbarState } from './use-toolbar-state';

export default function EmailToolbar() {
	const { activeEditor, paragraphFormat, handleFormatChange, updateToolbar } =
		useToolbarState();

	return (
		<div className="toolbar bg-white text-[#52525B] flex gap-4 items-center flex-wrap border-b border-b-[#e0e0e0] p-4 justify-center">
			<div className="flex gap-4 items-center">
				{/* Block + text formats */}
				<FontEditing
					activeEditor={activeEditor}
					paragraphFormat={paragraphFormat}
					handleFormatChange={handleFormatChange}
					updateToolbar={updateToolbar}
				/>

				{/* Link (with merge-tags), and image */}
				<Attachments
					activeEditor={activeEditor}
					renderLinkUrlExtra={(appendToUrl) => (
						<LinkMergeTagsTrigger appendToUrl={appendToUrl} />
					)}
				/>
			</div>

			<div className="flex gap-4 items-center">
				{/* Standalone merge-tags button */}
				<AddingShortCode activeEditor={activeEditor} />

				{/* Lists */}
				<ListStyles activeEditor={activeEditor} />

				{/* Alignment */}
				<AlignmentStyles activeEditor={activeEditor} />
			</div>
		</div>
	);
}
