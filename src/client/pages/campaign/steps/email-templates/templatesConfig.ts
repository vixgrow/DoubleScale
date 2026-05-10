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

const TEMPLATES_IMAGE_BASE = 'http://images.doublescale.io/templates-images';

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
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/New-Feature-Release.png`,
			},
			{
				id: 'product-launch',
				title: __('Product Launch', 'doublescale'),
				data: productLaunch,
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Product-Launch.png`,
			},
			{
				id: 'policy-terms-updates',
				title: __('Policy & Terms Updates', 'doublescale'),
				data: policyTermsUpdates,
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Policy-Terms.png`,
			},
			{
				id: 'offers',
				title: __('Offers', 'doublescale'),
				data: offers,
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Offers.png`,
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
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Black-Friday.png`,
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
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Welcome.png`,
			},
			{
				id: 'thank-you-joining',
				title: __('Thank You for Joining', 'doublescale'),
				data: thankYouForJoining,
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Thank-You-for-Joining.png`,
			},
			{
				id: 'onboarding-guide',
				title: __('Onboarding Guide', 'doublescale'),
				data: onboardingGuide,
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Onboarding-Guide.png`,
			},
			{
				id: 'account-verification',
				title: __('Account Verification', 'doublescale'),
				data: accountVerification,
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Account-Verification.png`,
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
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/plain-Text.png`,
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
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/New-Blog-Post.png`,
			},
			{
				id: 'customer-survey',
				title: __('Customer Survey', 'doublescale'),
				data: customerSurvey,
				imageUrl: `${TEMPLATES_IMAGE_BASE}/templates/Customer-Survey.png`,
			},
		],
	},
];
