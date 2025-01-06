import { DragDropContext } from "react-beautiful-dnd";
import { useDispatch, useSelect } from "@wordpress/data";
import { createPortal, useEffect, useState } from "@wordpress/element"; 1
import type {
	OnDragUpdateResponder,
	OnDragEndResponder,
	OnBeforeCaptureResponder,
	OnDragStartResponder,
} from 'react-beautiful-dnd';
import BlocksPanel from "./blocks-panel";
import DropArea from "./drop-area";
import "./style.scss";
import { keys } from "lodash";
import { sanitizeBlockAttributes } from "../../api/email-editor-blocks";
import React from "react";

const TemplateBuilder = () => {
	const [targetIndex, setTargetIndex] = useState<number>();
	const [isDraggingContent, setIsDraggingContent] =
		useState<boolean>(false);
	const [sourceContentIndex, setSourceContentIndex] = useState<number>();
	const [isDragging, setIsDragging] = useState<boolean>(false);

	const { blockTypes, formBlocks } = useSelect(
		(select) => {
			const { getBlockTypes } = select('quillcrm/email-editor-blocks')

			const { getBlocks } = select('quillcrm/email-editor');
			return {
				blockTypes: getBlockTypes(),
				formBlocks: getBlocks(),
			};
		}
	);

	useEffect(() => {
		document.body.classList.add('qcrm-template-builder-open');
		return () => {
			document.body.classList.remove('qcrm-template-builder-open');
		};
	}, []);

	const { __experimentalReorderBlocks, setCurrentBlock, __experimentalInsertBlock } = useDispatch(
		'quillcrm/email-editor'
	);


	const onDragStart: OnDragStartResponder = ({
		source,
	}: {
		source: {
			index?: number;
			droppableId?: string;
		};
	}) => {
		setIsDragging(true);
		// if (source?.droppableId !== 'DROP_AREA') return;
		setSourceContentIndex(source.index);
	};

	const onDragUpdate: OnDragUpdateResponder = ({ destination }) => {
		if (destination?.droppableId !== 'DROP_AREA') {
			setTargetIndex(undefined);
			return;
		}
		let next = destination?.index;

		if (isDraggingContent && next && sourceContentIndex !== undefined) {
			next = next >= sourceContentIndex ? next + 1 : next;
		}

		setTargetIndex(next);
	};

	const generateId = () => {
		return Math.random().toString(36).substr(2, 9);
	};

	const onDragEnd: OnDragEndResponder = (result) => {
		setIsDragging(false);
		setTargetIndex(undefined);
		setIsDraggingContent(false);

		const { source, destination } = result;

		// dropped outside the list or source and destination are the same
		if (!destination) {
			return;
		}

		if (source.droppableId && destination.droppableId) {

			if (source.droppableId === 'BLOCKS_LIST' && destination.droppableId === 'DROP_AREA') {


				const blockName = keys(blockTypes)[source.index];
				const block = {
					id: generateId(),
					name: blockName,
					attributes: sanitizeBlockAttributes(blockName, {}),
				};
				console.log(block);
				__experimentalInsertBlock(block, destination.index);
				return;

			}
			let parentSourceIndex;
			let parentDestIndex;

			if (source.droppableId !== 'DROP_AREA') {
				parentSourceIndex = source.droppableId.substr(
					source.droppableId.lastIndexOf('_') + 1
				);
			}

			if (destination.droppableId !== 'DROP_AREA') {
				parentDestIndex = destination.droppableId.substr(
					destination.droppableId.lastIndexOf('_') + 1
				);
			}
			__experimentalReorderBlocks(
				source.index,
				destination.index,
				parentSourceIndex,
				parentDestIndex
			);
		}
	}

	const onBeforeCapture: OnBeforeCaptureResponder = ({ draggableId }) => {
		const contentListItem = formBlocks.find(
			(block) => block.id === draggableId
		);
		const isDraggingContentList = !!contentListItem;

		if (isDraggingContentList) {
			setIsDraggingContent(true);
		}

		const el = document.querySelector(
			`[data-rbd-draggable-id="${draggableId}"]`
		) as HTMLInputElement;

		if (el) {
			el.style.height = isDraggingContentList ? '24px' : '2px';
		}
	};

	return createPortal(
		<div className="qcrm-template-builder-wrapper">
			<div className="qcrm-template-builder">
				<DragDropContext
					onDragStart={onDragStart}
					onDragEnd={onDragEnd}
					onDragUpdate={onDragUpdate}
					onBeforeCapture={onBeforeCapture}
				>
					<BlocksPanel />
					<DropArea
						isDragging={isDragging}
						targetIndex={targetIndex}
					/>

				</DragDropContext>
			</div>
		</div>,
		document.body
	)
}

export default TemplateBuilder;