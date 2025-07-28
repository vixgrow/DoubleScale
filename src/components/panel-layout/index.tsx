import { __ } from '@wordpress/i18n';
import { Breadcrumb } from '@quillcrm/components';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import ArrowLeft from '../icons/arrow-left';
import ArrowRightWhite from '../icons/arrow-right-white';

const PanelLayout = ({
	items,
	panelbtns,
	totalSteps,
	currentStep,
	children,
}) => {
	return (
		<div className="absolute top-0 left-0 bottom-0 right-0 w-full h-fit bg-white z-50">
			<div className="p-8">
				<div className="flex justify-between items-center">
					<Breadcrumb items={items} />

					{panelbtns.map((btn, index) => (
						<div key={index} className="mx-2">
							{btn}
						</div>
					))}
				</div>

				<div className="pt-6 pb-8">{children}</div>
			</div>
			<div className="pb-6">
				<Progress value={50} />
				<div className="py-6 flex justify-around items-center">
					<Button
						variant="secondaryDeepBlue"
						// onClick={() =>
						// 	navigate(
						// 		getToLink(`campaigns/${campaign?.id}/information`)
						// 	)
						// }
					>
						<ArrowLeft />
						{__('Back', 'quillcrm')}
					</Button>
					<Button variant="gradient" className="rounded-lg">
						{__('Next', 'quillcrm')}
						<ArrowRightWhite />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default PanelLayout;
