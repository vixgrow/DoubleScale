/**
 * Support-variant toolbar: a slim set of controls for support reply / note /
 * opening-message composers — text formats (B / I / U / S), link, and lists.
 *
 * IMPORTANT: this composition imports NO merge-tags UI and therefore never pulls
 * `@doublescale/components` (the admin SPA tree). That is what keeps the public
 * support portal bundle lean. Do not add an import that reaches the admin tree
 * here — put email-only controls in {@see EmailToolbar} instead.
 */

/**
 * Internal dependencies
 */
import FontEditing from './font-editing';
import Attachments from './attachments';
import ListStyles from './list-styles';
import { useToolbarState } from './use-toolbar-state';

export default function SupportToolbar() {
	const { activeEditor, paragraphFormat, handleFormatChange, updateToolbar } =
		useToolbarState();

	return (
		<div className="toolbar bg-white text-[#52525B] flex gap-4 items-center flex-wrap border-b border-b-[#e0e0e0] p-4 justify-center">
			<div className="flex gap-4 items-center">
				{/* Inline text formats only — no block-format dropdown. */}
				<FontEditing
					activeEditor={activeEditor}
					paragraphFormat={paragraphFormat}
					handleFormatChange={handleFormatChange}
					updateToolbar={updateToolbar}
					showBlockFormat={false}
				/>

				{/* Link only — no image, no merge-tags-in-link. */}
				<Attachments activeEditor={activeEditor} showImage={false} />
			</div>

			<div className="flex gap-4 items-center">
				{/* Lists */}
				<ListStyles activeEditor={activeEditor} />
			</div>
		</div>
	);
}
