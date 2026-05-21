/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

import newBlogPost from '@doublescale/assets/images/templates/New_Blog_Post.png';
import customerFeedbackSurvey from '@doublescale/assets/images/templates/Customer_Survey.png';

const templateItems = [
	{
		id: 'new-blog-post',
		title: __('New Blog Post', 'doublescale'),
		image: newBlogPost,
	},
	{
		id: 'customer-feedback-survey',
		title: __('Customer Feedback Survey', 'doublescale'),
		image: customerFeedbackSurvey,
	},
];

const EngagementTemplates = () => {
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

export default EngagementTemplates;
