/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { useDraggable } from '@dnd-kit/core';

const PreheaderLibrary = () => {
	// Text & Link template
	const textAndLinkTemplate = {
		type: 'preheader',
		props: {
			text: 'If you cannot see images, Please',
			linkText: 'Click here',
			linkUrl: 'https://',
			fontSize: 12,
			textColor: '#9197A4',
			linkColor: '#3B82F6',
			textAlign: 'left',
			fontFamily: 'Arial',
			bold: false,
			italic: false,
			underline: true,
			templateLayout: {
				justifyContent: 'flex-start',
				alignItems: 'center',
				width: '100%',
			},
		},
	};

	return (
		<div className="grid gap-4">
			<div className="flex flex-col gap-1 text-[#333333]">
				<label className="text-sm">
					{__('Text & Link', 'quillcrm')}
				</label>
				<DraggableTemplate
					template={textAndLinkTemplate}
					id="preheader"
				>
					<div className="flex gap-1 items-center border rounded-lg p-3 text-[10px]">
						<div className="text-[#9197A4]">
							{__('If you cannot see images, Please', 'quillcrm')}
						</div>
						<div className="text-secondary underline font-extrabold">
							{__('Click here', 'quillcrm')}
						</div>
					</div>
				</DraggableTemplate>
			</div>
		</div>
	);
};

// Draggable component using dnd-kit
const DraggableTemplate = ({ template, id, children }) => {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: id,
		data: {
			type: 'library-template',
			template: template,
		},
	});

	const style = {
		opacity: isDragging ? 0.5 : 1,
		cursor: 'grab',
	};

	console.log(`DraggableTemplate ${id}:`, { isDragging, template });

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className="hover:border-primary transition-colors"
		>
			{children}
		</div>
	);
};

export default PreheaderLibrary;
