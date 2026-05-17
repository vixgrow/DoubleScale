/**
 *  Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
/**
 *  External dependencies
 */
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface FontEditingProps {
	activeEditor: any;
	paragraphFormat: string;
	handleFormatChange: (value: string) => void;
	updateToolbar: () => void;
}

export default function FontEditing({
	activeEditor,
	paragraphFormat,
	handleFormatChange,
	updateToolbar,
}: FontEditingProps) {
	const [isBold, setIsBold] = useState(false);
	const [isItalic, setIsItalic] = useState(false);
	const [isUnderline, setIsUnderline] = useState(false);
	const [isStrikethrough, setIsStrikethrough] = useState(false);

	// Update text formatting states based on selection
	const updateFormatState = useCallback(() => {
		activeEditor.getEditorState().read(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection)) {
				setIsBold(selection.hasFormat('bold'));
				setIsItalic(selection.hasFormat('italic'));
				setIsUnderline(selection.hasFormat('underline'));
				setIsStrikethrough(selection.hasFormat('strikethrough'));
			}
		});
	}, [activeEditor]);

	// Register update listener
	useEffect(() => {
		return activeEditor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				updateFormatState();
			});
		});
	}, [activeEditor, updateFormatState]);

	return (
		<>
			{/* Paragraph format & Font family */}
			<div className="flex gap-2.5 border-r pr-5">
				<Select value={paragraphFormat} onValueChange={handleFormatChange}>
					<SelectTrigger className="w-fit rounded-md border-none outline-none px-2 bg-[#F1F1F2] cursor-pointer">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="paragraph">Paragraph Text</SelectItem>
						<SelectItem value="heading-1">Heading 1</SelectItem>
						<SelectItem value="heading-2">Heading 2</SelectItem>
						<SelectItem value="heading-3">Heading 3</SelectItem>
						<SelectItem value="quote">Quote</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Text formatting */}
			<div className="flex gap-2.5 border-r pr-5">
				<Button
					onClick={() =>
						activeEditor.dispatchCommand(
							FORMAT_TEXT_COMMAND,
							'bold'
						)
					}
					title="Bold"
					variant="ghost"
					size="icon"
					className="h-8 w-8 p-0"
				>
					<Bold
						className={`w-5 h-5 hover:text-primary ${isBold ? 'text-primary' : 'text-[#52525B]'
							}`}
					/>
				</Button>
				<Button
					onClick={() =>
						activeEditor.dispatchCommand(
							FORMAT_TEXT_COMMAND,
							'italic'
						)
					}
					title="Italic"
					variant="ghost"
					size="icon"
					className="h-8 w-8 p-0"
				>
					<Italic
						className={`w-5 h-5 hover:text-primary ${isItalic ? 'text-primary' : 'text-[#52525B]'
							}`}
					/>
				</Button>
				<Button
					onClick={() =>
						activeEditor.dispatchCommand(
							FORMAT_TEXT_COMMAND,
							'underline'
						)
					}
					title="Underline"
					variant="ghost"
					size="icon"
					className="h-8 w-8 p-0"
				>
					<Underline
						className={`w-5 h-5 hover:text-primary ${isUnderline
								? 'text-primary'
								: 'text-[#52525B]'
							}`}
					/>
				</Button>
				<Button
					onClick={() => {
						activeEditor.dispatchCommand(
							FORMAT_TEXT_COMMAND,
							'strikethrough'
						);
						// Force updateToolbar after formatting is applied
						setTimeout(() => {
							updateFormatState();
							updateToolbar();
						}, 0);
					}}
					title="Strikethrough"
					variant="ghost"
					size="icon"
					className="h-8 w-8 p-0"
				>
					<Strikethrough
						className={`w-5 h-5 hover:text-primary ${isStrikethrough
								? 'text-primary'
								: 'text-[#52525B]'
							}`}
					/>
				</Button>
			</div>
		</>
	);
}
