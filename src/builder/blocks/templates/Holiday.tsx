/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

//@ts-ignore
import BlackFriday from '../../../../assets/images/templates/Black-Friday.png';

const templateItems = [
	{
		id: 'black-friday',
		title: __('Black Friday', 'quillcrm'),
		image: BlackFriday,
	},
];

const HolidayTemplates = () => {
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

export default HolidayTemplates;
