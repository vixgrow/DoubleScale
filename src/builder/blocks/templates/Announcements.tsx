/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

import newFeatureRelease from '@doublescale/assets/images/templates/New_Feature_Release.png';
import productLaunch from '@doublescale/assets/images/templates/product_launch.png';
import policyTermsUpdates from '@doublescale/assets/images/templates/Policy_Terms.png';
import offers from '@doublescale/assets/images/templates/Offers.png';

const templateItems = [
	{
		id: 'new-feature-release',
		title: __('New Feature Release', 'doublescale'),
		image: newFeatureRelease,
	},
	{
		id: 'product-launch',
		title: __('Product Launch', 'doublescale'),
		image: productLaunch,
	},
	{
		id: 'policy-terms-updates',
		title: __('Company or Policy & Terms Updates', 'doublescale'),
		image: policyTermsUpdates,
	},
	{
		id: 'offers',
		title: __('Offers', 'doublescale'),
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
