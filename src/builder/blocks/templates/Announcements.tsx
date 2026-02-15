/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

//@ts-ignore
import newFeatureRelease from '../../../../assets/images/templates/New-Feature-Release.png';
//@ts-ignore
import productLaunch from '../../../../assets/images/templates/Product-Launch.png';
//@ts-ignore
import policyTermsUpdates from '../../../../assets/images/templates/Policy-Terms.png';
//@ts-ignore
import offers from '../../../../assets/images/templates/Offers.png';

const templateItems = [
	{
		id: 'new-feature-release',
		title: __('New Feature Release', 'quillcrm'),
		image: newFeatureRelease,
	},
	{
		id: 'product-launch',
		title: __('Product Launch', 'quillcrm'),
		image: productLaunch,
	},
	{
		id: 'policy-terms-updates',
		title: __('Company or Policy & Terms Updates', 'quillcrm'),
		image: policyTermsUpdates,
	},
	{
		id: 'offers',
		title: __('Offers', 'quillcrm'),
		image: offers,
	},
];

const AnnouncementsTemplates = () => {
	return (
		<div className="grid gap-4">
			{templateItems.map((item) => (
				<div key={item.id} className="flex flex-col gap-1 text-[#333333]">
					<label className="text-sm">{item.title}</label>
					<div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer p-2">
						<img
							src={item.image}
							alt={item.title}
							className="w-full h-32 object-cover rounded"
						/>
					</div>
				</div>
			))}
		</div>
	);
};

export default AnnouncementsTemplates;
