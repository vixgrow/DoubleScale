/**
 * Email-only: the merge-tags trigger that lives inside the link dialog's URL
 * field. Isolated in its own module because it is the ONLY thing in the editor
 * toolbar that imports `@doublescale/components` (the admin SPA tree). Keeping it
 * here — and importing it only from the email toolbar composition — lets the
 * support toolbar stay import-clean so the public portal bundle never pulls the
 * admin tree.
 */

/**
 * External dependencies
 */
import { useState } from 'react';

/**
 * Internal dependencies
 */
import { MergeTagsModal, MergeTagsIcon } from '@doublescale/components';

interface LinkMergeTagsTriggerProps {
	/** Appends the chosen merge tag onto the current link URL. */
	appendToUrl: ( value: string ) => void;
}

/**
 * Renders the merge-tags button (absolutely positioned at the right edge of the
 * link URL input) plus the picker modal. Passed to `Attachments` via its
 * `renderLinkUrlExtra` slot.
 */
export default function LinkMergeTagsTrigger( {
	appendToUrl,
}: LinkMergeTagsTriggerProps ) {
	const [ visible, setVisible ] = useState( false );

	return (
		<>
			<button
				type="button"
				title="Add Merge Tags"
				aria-label="Add Merge Tags"
				className="absolute right-0 top-0 h-full px-3 bg-[#EEEEEE] rounded-r-lg cursor-pointer hover:bg-[#E0E0E0] flex items-center"
				onClick={ () => setVisible( true ) }
			>
				<MergeTagsIcon width={ 20 } height={ 20 } />
			</button>

			<MergeTagsModal
				visible={ visible }
				onClose={ () => setVisible( false ) }
				onInsertTag={ ( tagValue: string ) => {
					appendToUrl( tagValue );
					setVisible( false );
				} }
			/>
		</>
	);
}
