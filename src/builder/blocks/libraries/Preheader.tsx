/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
/**
 * internal dependencies
 */
import { DraggableTemplate } from '@/builder/components/shared/DraggableTemplate';

const PreheaderLibrary = () => {
	const isProActive = applyFilters('quillcrm_is_pro_active', false) as boolean;

	// Text & Link template
	const textAndLinkTemplate = {
		type: 'preheader-template',
		blocks: [
			{
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
				},
			},
		],
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
					templateType="preheader"
					disabled={!isProActive}
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

export default PreheaderLibrary;
