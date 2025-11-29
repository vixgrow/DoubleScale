import React, { useState } from 'react';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RecommendedPluginIcon from '@quillcrm/components/icons/recommended-plugin';
import QuillBookingIcon from '@quillcrm/components/icons/quillBooking';
import OptionalPluginIcon from '@quillcrm/components/icons/optional-icon';
import WocommerceIcon from '@quillcrm/components/icons/wocommerce';
import ContactFormIcon from '@quillcrm/components/icons/contact-form';
import ButtonComponent from '../component/button';

const RecommendedPlugins = [
	{
		id: 'quill-booking',
		name: 'Quill Booking',
		icon: <QuillBookingIcon />,
		description:
			'Quill Booking empowers you with seamless appointment scheduling',
		action: 'Install Now',
		actionType: 'install',
	},
	{
		id: 'quill-forms',
		name: 'Quill Forms',
		icon: '📝',
		description:
			'Quill Forms empowers you with seamless appointment scheduling',
		action: 'Install Now',
		actionType: 'install',
	},
	{
		id: 'quill-smtp',
		name: 'Quill SMTP',
		icon: '📧',
		description:
			'Quill SMTP helps you send reliable, trackable emails directly from your CRM',
		action: 'Uninstall',
		actionType: 'uninstall',
	},
];

const OptionalPlugins = [
	{
		id: 'woocommerce',
		name: 'WooCommerce',
		icon: <WocommerceIcon />,
		description:
			'WooCommerce syncs your store data with CRM for smarter sales tracking.',
		action: 'Install Now',
		actionType: 'install',
	},
	{
		id: 'contact-form-7',
		name: 'Contact Form 7',
		icon: <ContactFormIcon />,
		description:
			'It sends form submissions straight to your CRM—no manual entry, full automation.',
		action: 'Install Now',
		actionType: 'install',
	},
	{
		id: 'elementor',
		name: 'Elementor',
		icon: '🎨',
		description:
			'It lets you design stunning pages & sync them with your CRM.',
		action: 'Install Now',
		actionType: 'install',
	},
];

function PluginCard({ plugin }) {
	const isUninstall = plugin.actionType === 'uninstall';

	return (
		<div className="flex items-start justify-between gap-4 p-4 border border-[#DEE1E6] bg-[#F8F8F8] rounded-2xl ">
  <div className="flex flex-col items-start gap-3 flex-1">
    
    <div className="flex justify-between items-center w-full">
      <div className="flex gap-1 flex-1">
        {plugin.icon}
        <h4 className="text-xl font-medium leading-[30px] text-[#09090B]">
          {plugin.name}
        </h4>
      </div>

      <Button
        variant={isUninstall ? "destructive" : "default"}
        size="sm"
        className={`flex-shrink-0 justify-end text-xs h-8 px-4 ${
          isUninstall
            ? "bg-transparent font-medium leading-[26px] text-[#E13B3B] hover:bg-red-100 border border-[#E13B3B]"
            : "bg-transparent font-medium leading-[26px] text-base border border-[#458DC7] text-[#458DC7] hover:bg-blue-100"
        }`}
      >
        {plugin.action}
      </Button>
    </div>

    <p className="text-lg leading-7 text-[#777] mt-1">
      {plugin.description}
    </p>
  </div>
</div>

	);
}

export default function PluginComplete({ onSkip, onPrevious, onNext }) {
	const [email, setEmail] = useState('');

	return (
		<div className=" flex flex-col gap-10">
			<div>
				<h3 className="text-[#170F49] text-[32px] font-semibold">
					Add Your Contacts—Start Building Meaningful CRM Connections
				</h3>
				<p className="text-[#777] text-lg font-normal leading-7">
					Add or import your contacts to start building your CRM
					database—whether it's leads, customers, or team members.
					Organizing contacts now helps you track interactions,
					personalize outreach, and automate smarter.
				</p>
			</div>
			<Accordion
				type="multiple"
				defaultValue={['recommended', 'optional']}
				className="grid grid-cols-1 md:grid-cols-2 gap-12"
			>
				{/* Recommended Plugins */}
				<AccordionItem
					value="recommended"
					className="border border-[#DEE1E6] rounded-lg shadow-sm flex flex-col gap-4"
				>
					<AccordionTrigger className="px-4 py-3 bg-[#F8F8F8] hover:no-underline border-b border-[#DEE1E6] ">
						<div className="flex items-center gap-2">
							<RecommendedPluginIcon />
							<span className="text-lg font-medium leading-7 text-[#09090B]">
								Recommend Plugins
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-4 pb-3">
						<div className=" flex flex-col gap-4">
							{RecommendedPlugins.map((plugin) => (
								<PluginCard key={plugin.id} plugin={plugin} />
							))}
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Optional Plugins */}
				<AccordionItem
					value="optional"
					className="border border-[#DEE1E6] rounded-lg shadow-sm flex flex-col gap-4"
				>
					<AccordionTrigger className="px-4 py-3 bg-[#F8F8F8] hover:no-underline border-b border-[#DEE1E6] ">
						<div className="flex items-center gap-2">
							<OptionalPluginIcon />
							<span className="text-lg font-medium leading-7 text-[#09090B]">
								Optional Plugins
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-4 pb-3">
						<div className="flex flex-col gap-4">
							{OptionalPlugins.map((plugin) => (
								<PluginCard key={plugin.id} plugin={plugin} />
							))}
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>

			<div className=" bg-[#DEE1E6] w-full h-[1px]"></div>

			{/* Email Subscription */}
			<div className=" !p-0 !m-0">
				<label className="text-base leading-6 text-[#09090B] block mb-[2px]">
					Email Address
				</label>
				<Input
					type="email"
					placeholder="Email Address"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full border !border-[#DEE1E6] rounded-lg h-12 py-[5px] px-4 !m-0"
				/>
				<p className="text-xs text-[#CB5301] font-semibold leading-[26px] !m-0">
					We will send marketing tips and advanced usage of Quill CRM
				</p>
			</div>

			{/*  */}
			<div className="flex justify-between pt-8">
				<div className="flex gap-2">
					<ButtonComponent onClick={onPrevious} type="">
						Previous
					</ButtonComponent>

					<ButtonComponent type="no" onClick={onSkip}>
						Skip →
					</ButtonComponent>
				</div>
				<ButtonComponent type="go" onClick={onNext}>
					Next Step
				</ButtonComponent>
			</div>
		</div>
	);
}
