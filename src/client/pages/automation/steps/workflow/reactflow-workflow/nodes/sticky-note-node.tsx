/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { type NodeProps } from '@xyflow/react';
import { StickyNote, Trash2 } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { CanvasNote } from '@doublescale/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface StickyNoteNodeData {
	note: CanvasNote;
	viewMode?: boolean;
	onUpdate: (noteId: string, content: string) => void;
	onDelete: (noteId: string) => void;
}

const StickyNoteNode: React.FC<NodeProps> = ({ data }) => {
	const { note, viewMode = false, onUpdate, onDelete } =
		data as unknown as StickyNoteNodeData;
	const [content, setContent] = useState(note.content);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

	useEffect(() => {
		setContent(note.content);
	}, [note.id]);

	useEffect(() => {
		return () => {
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
			}
		};
	}, []);

	const handleContentChange = (value: string) => {
		setContent(value);

		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
		}

		saveTimerRef.current = setTimeout(() => {
			onUpdate(note.id, value);
		}, 400);
	};

	const handleBlur = () => {
		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
		}

		if (content !== note.content) {
			onUpdate(note.id, content);
		}
	};

	return (
		<div
			className={`doublescale-reactflow-sticky-note${viewMode ? ' doublescale-reactflow-sticky-note--readonly' : ''}`}
			style={{
				backgroundColor: note.color || '#fef3c7',
			}}
		>
			<div className="doublescale-reactflow-sticky-note__header">
				<div className="doublescale-reactflow-sticky-note__title">
					<StickyNote className="h-4 w-4" />
					<span>{__('Note', 'doublescale')}</span>
				</div>
				{!viewMode && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="doublescale-reactflow-sticky-note__delete nodrag nopan h-7 w-7"
						onClick={() => onDelete(note.id)}
						title={__('Delete note', 'doublescale')}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				)}
			</div>

			{viewMode ? (
				<div className="doublescale-reactflow-sticky-note__content">
					{content || (
						<span className="doublescale-reactflow-sticky-note__placeholder">
							{__('No note content', 'doublescale')}
						</span>
					)}
				</div>
			) : (
				<Textarea
					value={content}
					onChange={(event) => handleContentChange(event.target.value)}
					onBlur={handleBlur}
					placeholder={__(
						'Add a note about this branch, logic, or reminder...',
						'doublescale'
					)}
					className="doublescale-reactflow-sticky-note__textarea nodrag nopan"
					rows={5}
				/>
			)}
		</div>
	);
};

export default StickyNoteNode;
