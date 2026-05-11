/**
 *  Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 *  External dependencies
 */
import { HiOutlineCodeBracketSquare } from 'react-icons/hi2';
import { useCallback, useState } from 'react';
import { $getSelection, $isRangeSelection } from 'lexical';
/**
 *  Internal dependencies
 */
import { $createMentionNode } from '../../../nodes/mention-node';
import { Header, UrlIcon, MergeTagModal } from '@/components/booking';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface AddingShortCodeProps {
	activeEditor: any;
}

export default function AddingShortCode({
	activeEditor,
}: AddingShortCodeProps) {
	const [mentionModalVisible, setMentionModalVisible] = useState(false);

	// Add a function to handle adding a mention
	const handleAddMention = useCallback(
		(mention, category) => {
			activeEditor.focus();
			activeEditor.update(() => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const mentionNode = $createMentionNode(mention, category);
					selection.insertNodes([mentionNode]);
				}
			});
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
				className="bg-[#E3DFF1] border rounded-lg border-[#333333] text-[#52525B] cursor-pointer flex items-center hover:bg-primary hover:text-white hover:border-none"
			>
				<HiOutlineCodeBracketSquare className="text-[20px]" />
				<span>Add Shortcodes</span>
			</Button>
            {/* Mentions Modal */}
            <Dialog
                open={mentionModalVisible}
                onOpenChange={open => {
                    if (!open)
                        (() => setMentionModalVisible(false))();
                }}><DialogContent className='max-w-[1000px] z-[150300] h-[90vh] overflow-y-auto'>
                    <div className='flex gap-2.5 items-center border-b pb-4 mb-4'>
                        <div className="bg-[#EDEDED] rounded-lg p-3 mt-2">
                            <UrlIcon />
                        </div>
                        <Header
                            header={__('Email Notification', 'doublescale')}
                            subHeader={__(
                                'Customize the email notifications sent to attendees and organizers',
                                'doublescale'
                            )}
                        />
                    </div>
                    <MergeTagModal
                        onMentionClick={(mention, category) =>
                            handleAddMention(mention, category)
                        }
                    />
                </DialogContent></Dialog>
        </>
    );
}
