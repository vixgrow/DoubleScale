/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import PageTabs from '@/components/page-tabs';
import Emails from '../emails';
import SMS from '../sms';
import WhatsApp from '../whatsapp';
import PurchaseHistory from '../purchase-history';
import Automation from '../automation';
import Notes from '../notes';
import { useContactContext } from '../state/context';
import Deals from '../deals';
import {
	AutomationsIcon,
	ContactSMSIcon,
	ContactTotalEmailsIcon,
	ContactWhatsAppIcon,
	DealsIcon,
	NotesIcon,
	PurchaseHistoryIcon,
} from '@quillcrm/components';

const DataCard: React.FC = () => {
	const { contact } = useContactContext();

	if (!contact) {
		return null;
	}

	const tabsList = [
		{
			value: 'emails',
			label: 'Emails',
			icon: <ContactTotalEmailsIcon width={24} height={24} />,
		},
		{ value: 'sms', label: 'SMS', icon: <ContactSMSIcon /> },
		{ value: 'whatsapp', label: 'WhatsApp', icon: <ContactWhatsAppIcon /> },
		{ value: 'deals', label: 'Deals', icon: <DealsIcon /> },
		{ value: 'notes', label: 'Notes', icon: <NotesIcon /> },
		{
			value: 'automation',
			label: 'Automation',
			icon: <AutomationsIcon width={24} height={24} />,
		},
		{
			value: 'purchase-history',
			label: 'Purchase History',
			icon: <PurchaseHistoryIcon />,
		},
	];

	const tabsContent = [
		{
			value: 'emails',
			children: (
				<CardContent className="pt-6">
					<Emails contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'sms',
			children: (
				<CardContent className="pt-6">
					<SMS contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'whatsapp',
			children: (
				<CardContent className="pt-6">
					<WhatsApp contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'deals',
			children: (
				<CardContent className="pt-6">
					<Deals contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'notes',
			children: (
				<CardContent className="pt-6">
					<Notes contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'automation',
			children: (
				<CardContent className="pt-6">
					<Automation contact_id={contact.id} />
				</CardContent>
			),
		},
		{
			value: 'purchase-history',
			children: (
				<CardContent className="pt-6">
					<PurchaseHistory contact_id={contact.id} />
				</CardContent>
			),
		},
	];

	return (
		<Card className="w-2/3 bg-[#F8F8F8] shadow-none p-5">
			<PageTabs
				defaultValue="emails"
				tabsList={tabsList}
				tabsContent={tabsContent}
				className="w-full"
				tabsListWrapperClassName="border-b pb-7 pt-5"
				tabsListClassName="bg-transparent text-foreground gap-2 justify-start w-full"
			/>
		</Card>
	);
};

export default DataCard;
