/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

import welcomeSeries from '@doublescale/assets/images/templates/Welcome.png';
import thankYouJoining from '@doublescale/assets/images/templates/Thank_You.png';
import onboardingGuide from '@doublescale/assets/images/templates/Onboarding_Guide.png';
import accountVerification from '@doublescale/assets/images/templates/Account_Verification.png';

const templateItems = [
	{
		id: 'welcome',
		title: __('Welcome', 'doublescale'),
		image: welcomeSeries,
	},
	{
		id: 'thank-you-joining',
		title: __('Thank You for Joining', 'doublescale'),
		image: thankYouJoining,
	},
	{
		id: 'onboarding-guide',
		title: __('Onboarding Guide', 'doublescale'),
		image: onboardingGuide,
	},
	{
		id: 'account-verification',
		title: __('Account Verification', 'doublescale'),
		image: accountVerification,
	},
];

const GreetingTemplates = () => {
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

export default GreetingTemplates;
