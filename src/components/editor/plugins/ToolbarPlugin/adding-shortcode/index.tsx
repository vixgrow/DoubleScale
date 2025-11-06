/**
 *  Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 *  External dependencies
 */
import { useCallback, useState } from 'react';
import { $getSelection, $isRangeSelection } from 'lexical';
import { Button } from '@/components/ui/button';
/**
 *  Internal dependencies
 */
import { $createMentionNode } from '../../../nodes/mention-node';
import { MergeTagsIcon, MergeTagsModal } from '@quillcrm/components';

interface AddingShortCodeProps {
	activeEditor: any;
}

export default function AddingShortCode({
	activeEditor,
}: AddingShortCodeProps) {
	const [mentionModalVisible, setMentionModalVisible] = useState(false);

	// Add a function to handle adding a mention
	const handleAddMention = useCallback(
		(tagValue: string) => {
			// Extract mention and category from the tag value
			// Tag value format: {{category:mention}}
			const match = tagValue.match(/\{\{(\w+):(.+?)\}\}/);
			if (match) {
				const category = match[1];
				const mention = match[2];
				activeEditor.focus();
				activeEditor.update(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						const mentionNode = $createMentionNode(mention, category);
						selection.insertNodes([mentionNode]);
					}
				});
			}
			setMentionModalVisible(false);
		},
		[activeEditor]
	);

	return (
		<>
			{/* Add Shortcodes Button - Positioned to the right */}
			<Button
				onClick={() => {
					setMentionModalVisible(true);
				}}
				className="bg-transparent border-none shadow-none p-0 hover:bg-transparent hover:border-none text-muted-foreground"
			>
				<MergeTagsIcon width={24} height={24} />
			</Button>

			{/* Mentions Modal */}
			<MergeTagsModal
				visible={mentionModalVisible}
				onClose={() => setMentionModalVisible(false)}
				onInsertTag={handleAddMention}
			/>
		</>
	);
}
