/**
 *  External dependencies
 */
import { List, ListOrdered } from 'lucide-react';
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	REMOVE_LIST_COMMAND,
	$isListNode,
	ListNode,
} from '@lexical/list';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useState } from 'react';
import { $getSelection, $isRangeSelection } from 'lexical';

interface ListStylesProps {
	activeEditor: any;
}

export default function ListStyles({ activeEditor }: ListStylesProps) {
	const [isBulletList, setIsBulletList] = useState(false);
	const [isNumberedList, setIsNumberedList] = useState(false);

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
				let parentList: ListNode | null = null;
				let node: any = element;
				while (node !== null) {
					if ($isListNode(node)) {
						parentList = node as ListNode;
						break;
					}
					node = node.getParent();
				}

				// Update states based on list type
				if (parentList) {
					const listType = parentList.getListType();
					setIsBulletList(listType === 'bullet');
					setIsNumberedList(listType === 'number');
				} else {
					setIsBulletList(false);
					setIsNumberedList(false);
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
			(listType === 'number' && isNumberedList)
		) {
			activeEditor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
		} else {
			activeEditor.dispatchCommand(command, undefined);
		}
	};

	return (
		<div className="flex gap-2.5">
			<Button
				onClick={() =>
					toggleList(INSERT_UNORDERED_LIST_COMMAND, 'bullet')
				}
				title="Bullet List"
				variant="ghost"
				size="icon"
				className="h-8 w-8 p-0"
			>
				<List
					className={`w-5 h-5 hover:text-color-primary ${isBulletList ? 'text-color-primary' : 'text-[#52525B]'
						}`}
				/>
			</Button>

			<Button
				onClick={() =>
					toggleList(INSERT_ORDERED_LIST_COMMAND, 'number')
				}
				title="Numbered List"
				variant="ghost"
				size="icon"
				className="h-8 w-8 p-0"
			>
				<ListOrdered
					className={`w-5 h-5 hover:text-color-primary ${isNumberedList ? 'text-color-primary' : 'text-[#52525B]'
						}`}
				/>
			</Button>
		</div>
	);
}
