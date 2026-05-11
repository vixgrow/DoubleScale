/**
 *  Wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
/**
 *  External dependencies
 */
import { LuBold, LuItalic } from 'react-icons/lu';
import { RxUnderline } from 'react-icons/rx';
import { RiStrikethrough } from 'react-icons/ri';
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND } from 'lexical';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
            {/* Paragraph format & Font family.
              * Option values must match what ToolbarPlugin.updateToolbar()
              * pushes back via setParagraphFormat — `paragraph`, `heading-1…3`,
              * `quote`. Using bare tag names like `h1` here would round-trip
              * to a value the Select can't display, so the trigger goes blank
              * after the first heading change. */}
            <div className='flex gap-2.5 border-r pr-5'>
				<Select
					value={paragraphFormat || 'paragraph'}
					onValueChange={handleFormatChange}
				>
					<SelectTrigger className="h-9 w-[150px] shadow-none focus:ring-0">
						<SelectValue
							placeholder={__('Paragraph', 'doublescale')}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="paragraph">
							{__('Paragraph', 'doublescale')}
						</SelectItem>
						<SelectItem value="heading-1">
							{__('Heading 1', 'doublescale')}
						</SelectItem>
						<SelectItem value="heading-2">
							{__('Heading 2', 'doublescale')}
						</SelectItem>
						<SelectItem value="heading-3">
							{__('Heading 3', 'doublescale')}
						</SelectItem>
						<SelectItem value="quote">
							{__('Quote', 'doublescale')}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
            {/* Text formatting */}
            <div className='flex gap-2.5 border-r pr-5'>
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
					className="border-none shadow-none cursor-pointer [&_svg]:size-5"
				>
					<LuBold
						className={`text-[20px] hover:text-primary ${
							isBold ? 'text-primary' : 'text-[#52525B]'
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
					className="border-none shadow-none cursor-pointer [&_svg]:size-5"
				>
					<LuItalic
						className={`text-[20px] hover:text-primary ${
							isItalic ? 'text-primary' : 'text-[#52525B]'
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
					className="border-none shadow-none cursor-pointer [&_svg]:size-5"
				>
					<RxUnderline
						className={`text-[20px] hover:text-primary ${
							isUnderline
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
					className="border-none shadow-none cursor-pointer [&_svg]:size-5"
				>
					<RiStrikethrough
						className={`text-[20px] hover:text-primary ${
							isStrikethrough
								? 'text-primary'
								: 'text-[#52525B]'
						}`}
					/>
				</Button>
			</div>
        </>
    );
}
