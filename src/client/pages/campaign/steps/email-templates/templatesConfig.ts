/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import newFeatureRelease from '@/builder/blocks/templates/data/New-Feature-Release.json';
import productLaunch from '@/builder/blocks/templates/data/Product-Launch.json';
import policyTermsUpdates from '@/builder/blocks/templates/data/Policy-Terms-Updates.json';
import offers from '@/builder/blocks/templates/data/Offers.json';
import blackFriday from '@/builder/blocks/templates/data/Black-Friday.json';
import welcomeSeries from '@/builder/blocks/templates/data/Welcome-Series.json';
import thankYouForJoining from '@/builder/blocks/templates/data/Thank-You-For-Joining.json';
import onboardingGuide from '@/builder/blocks/templates/data/Onboarding-Guide.json';
import accountVerification from '@/builder/blocks/templates/data/Account-Verification.json';
import plainText from '@/builder/blocks/templates/data/Plain-Text.json';
import newBlogPost from '@/builder/blocks/templates/data/New-Blog-Post.json';
import customerSurvey from '@/builder/blocks/templates/data/Customer-Survey.json';
import newFeatureReleaseImg from '@doublescale/assets/images/templates/New_Feature_Release.png';
import productLaunchImg from '@doublescale/assets/images/templates/product_launch.png';
import policyTermsImg from '@doublescale/assets/images/templates/Policy_Terms.png';
import offersImg from '@doublescale/assets/images/templates/Offers.png';
import blackFridayImg from '@doublescale/assets/images/templates/Black_Friday.png';
import welcomeImg from '@doublescale/assets/images/templates/Welcome.png';
import thankYouImg from '@doublescale/assets/images/templates/Thank_You.png';
import onboardingImg from '@doublescale/assets/images/templates/Onboarding_Guide.png';
import accountVerificationImg from '@doublescale/assets/images/templates/Account_Verification.png';
import plainTextImg from '@doublescale/assets/images/templates/plain_Text.png';
import newBlogPostImg from '@doublescale/assets/images/templates/New_Blog_Post.png';
import customerSurveyImg from '@doublescale/assets/images/templates/Customer_Survey.png';

export interface TemplateItemConfig {
	id: string;
	title: string;
	data: any;
	imageUrl: string;
}

export interface CategoryConfig {
	id: string;
	title: string;
	templates: TemplateItemConfig[];
}

export const TEMPLATE_CATEGORIES: CategoryConfig[] = [
	{
		id: 'announcements',
		title: __('Announcements', 'doublescale'),
		templates: [
			{
				id: 'new-feature-release',
				title: __('New Feature Release', 'doublescale'),
				data: newFeatureRelease,
				imageUrl: newFeatureReleaseImg,
			},
			{
				id: 'product-launch',
				title: __('Product Launch', 'doublescale'),
				data: productLaunch,
				imageUrl: productLaunchImg,
			},
			{
				id: 'policy-terms-updates',
				title: __('Policy & Terms Updates', 'doublescale'),
				data: policyTermsUpdates,
				imageUrl: policyTermsImg,
			},
			{
				id: 'offers',
				title: __('Offers', 'doublescale'),
				data: offers,
				imageUrl: offersImg,
			},
		],
	},
	{
		id: 'holiday',
		title: __('Holiday', 'doublescale'),
		templates: [
			{
				id: 'black-friday',
				title: __('Black Friday', 'doublescale'),
				data: blackFriday,
				imageUrl: blackFridayImg,
			},
		],
	},
	{
		id: 'greeting',
		title: __('Greeting', 'doublescale'),
		templates: [
			{
				id: 'welcome-series',
				title: __('Welcome Series', 'doublescale'),
				data: welcomeSeries,
				imageUrl: welcomeImg,
			},
			{
				id: 'thank-you-joining',
				title: __('Thank You for Joining', 'doublescale'),
				data: thankYouForJoining,
				imageUrl: thankYouImg,
			},
			{
				id: 'onboarding-guide',
				title: __('Onboarding Guide', 'doublescale'),
				data: onboardingGuide,
				imageUrl: onboardingImg,
			},
			{
				id: 'account-verification',
				title: __('Account Verification', 'doublescale'),
				data: accountVerification,
				imageUrl: accountVerificationImg,
			},
		],
	},
	// {
	// 	id: 'ecommerce',
	// 	title: __('Ecommerce', 'doublescale'),
	// 	templates: [],
	// },
	{
		id: 'plain-text',
		title: __('Plain Text', 'doublescale'),
		templates: [
			{
				id: 'plain-text',
				title: __('Plain Text', 'doublescale'),
				data: plainText,
				imageUrl: plainTextImg,
			},
		],
	},
	{
		id: 'engagement',
		title: __('Engagement', 'doublescale'),
		templates: [
			{
				id: 'new-blog-post',
				title: __('New Blog Post', 'doublescale'),
				data: newBlogPost,
				imageUrl: newBlogPostImg,
			},
			{
				id: 'customer-survey',
				title: __('Customer Survey', 'doublescale'),
				data: customerSurvey,
				imageUrl: customerSurveyImg,
			},
		],
	},
];
