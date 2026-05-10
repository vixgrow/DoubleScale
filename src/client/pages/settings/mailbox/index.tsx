/**
 * Mailbox Settings Tab
 *
 * Combines Shared Email (team IMAP inbox), Personal Email
 * (per-user email account), and Email Provider Setup into
 * a single settings tab with sub-tabs.
 *
 * - Shared Email: visible to CRM Manager (and Admin) only
 * - Personal Email: visible to all CRM roles
 * - Email Provider Setup: visible to CRM Manager (and Admin) only
 *
 * @since 1.7.0
 */

import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { Mail, UserCircle, ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InboxSettings from '../email-inbound';
import MyEmailSettings from '../my-email';
import EmailProviderSetup from '../email-provider-setup';
import { useCapabilities } from '@doublescale/hooks/use-capabilities';

const MailboxSettings: React.FC = () => {
	const { isCrmManager } = useCapabilities();

	const canManage = useMemo(
		() => isCrmManager(),
		[isCrmManager]
	);

	const defaultTab = canManage ? 'shared' : 'personal';
	const [activeTab, setActiveTab] = useState(defaultTab);

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="bg-transparent gap-2">
					{canManage && (
						<TabsTrigger
							value="shared"
							className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
						>
							<Mail size={18} />
							{__('Shared Email', 'doublescale')}
						</TabsTrigger>
					)}
					<TabsTrigger
						value="personal"
						className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
					>
						<UserCircle size={18} />
						{__('Personal Email', 'doublescale')}
					</TabsTrigger>
					{canManage && (
						<TabsTrigger
							value="provider-setup"
							className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
						>
							<ShieldCheck size={18} />
							{__('Email Provider Setup', 'doublescale')}
						</TabsTrigger>
					)}
				</TabsList>

				{canManage && (
					<TabsContent value="shared">
						<InboxSettings />
					</TabsContent>
				)}
				<TabsContent value="personal">
					<MyEmailSettings />
				</TabsContent>
				{canManage && (
					<TabsContent value="provider-setup">
						<EmailProviderSetup />
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
};

export default MailboxSettings;
