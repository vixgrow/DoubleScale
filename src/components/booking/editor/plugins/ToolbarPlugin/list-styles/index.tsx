// @ts-nocheck — Lexical 0.30 → 0.38 API drift; types will be cleaned during Phase 3 page port
/**
 *  External dependencies
 */
import { FaListUl, FaListOl } from 'react-icons/fa6';
import { MdOutlineChecklist } from 'react-icons/md';
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	INSERT_CHECK_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { useCallback, useEffect, useState } from 'react';
import { $isListNode } from '@lexical/list';
import { $getSelection, $isRangeSelection } from 'lexical';
import { Button } from '@/components/ui/button';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

interface ListStylesProps {
	activeEditor: any;
}

export default function ListStyles({ activeEditor }: ListStylesProps) {
	const [isBulletList, setIsBulletList] = useState(false);
	const [isNumberedList, setIsNumberedList] = useState(false);
	const [isCheckList, setIsCheckList] = useState(false);

	// Update active state of list buttons based on current selection
	const updateListState = useCallback(() => {
		activeEditor.getEditorState().read(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				const anchorNode = selection.anchor.getNode();
				const element =
					anchorNode.getKey() === 'root'
						? anchorNode
						: anchorNode.getTopLevelElementOrThrow();

				// Find list node if exists
				let parentList = null;
				let node = element;
				while (node !== null) {
					if ($isListNode(node)) {
						parentList = node;
						break;
					}
					node = node.getParent();
				}

				// Update states based on list type
				if (parentList) {
					const listType = parentList.getListType();
					setIsBulletList(listType === 'bullet');
					setIsNumberedList(listType === 'number');
					setIsCheckList(listType === 'check');
				} else {
					setIsBulletList(false);
					setIsNumberedList(false);
					setIsCheckList(false);
				}
			}
		});
	}, [activeEditor]);

	// Register update listener
	useEffect(() => {
		return activeEditor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateListState();
			});
		});
	}, [activeEditor, updateListState]);

	const toggleList = (command, listType) => {
		if (
			(listType === 'bullet' && isBulletList) ||
			(listType === 'number' && isNumberedList) ||
			(listType === 'check' && isCheckList)
		) {
			activeEditor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
		} else {
			activeEditor.dispatchCommand(command, undefined);
		}
	};

	return (
        <div className='flex gap-2.5'>
            <Button
				onClick={() =>
					toggleList(INSERT_UNORDERED_LIST_COMMAND, 'bullet')
				}
				title={__('Bullet List', 'doublescale')}
				variant="ghost"
				size="icon"
				className="border-none shadow-none cursor-pointer [&_svg]:size-5"
			>
				<FaListUl
					className={`text-[20px] hover:text-primary ${
						isBulletList ? 'text-primary' : 'text-[#52525B]'
					}`}
				/>
			</Button>
            <Button
				onClick={() =>
					toggleList(INSERT_ORDERED_LIST_COMMAND, 'number')
				}
				title={__('Numbered List', 'doublescale')}
				variant="ghost"
				size="icon"
				className="border-none shadow-none cursor-pointer [&_svg]:size-5"
			>
				<FaListOl
					className={`text-[20px] hover:text-primary ${
						isNumberedList ? 'text-primary' : 'text-[#52525B]'
					}`}
				/>
			</Button>
            <Button
				onClick={() => toggleList(INSERT_CHECK_LIST_COMMAND, 'check')}
				title={__('Checklist', 'doublescale')}
				variant="ghost"
				size="icon"
				className="border-none shadow-none cursor-pointer [&_svg]:size-5"
			>
				<MdOutlineChecklist
					className={`text-[20px] hover:text-primary ${
						isCheckList ? 'text-primary' : 'text-[#52525B]'
					}`}
				/>
			</Button>
        </div>
    );
}
