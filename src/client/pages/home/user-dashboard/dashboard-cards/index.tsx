/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import {
    ActiveAutomationIcon,
    DashboardSmallCard,
    EmailTemplatesIcon,
    MailSentIcon,
    OrdersIcon,
    RevenueIcon,
    TotalCampaignsIcon,
    TotalContactsIcon,
    TotalTagsIcon,
} from '@quillcrm/components';
import type { DashboardData } from '@quillcrm/client';

interface DashboardCardsProps {
    data: DashboardData;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
    data,
}) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <DashboardSmallCard
                title={__('Total Contacts', 'quillcrm')}
                subtitle={data.total_contacts || 0}
                icon={<TotalContactsIcon />}
            />
            <DashboardSmallCard
                title={__('Total Sent Emails', 'quillcrm')}
                subtitle={data.total_sent_emails || 0}
                icon={<MailSentIcon />}
            />
            <DashboardSmallCard
                title={__('Total Orders', 'quillcrm')}
                subtitle={data.total_orders || 0}
                icon={<OrdersIcon />}
            />
            <DashboardSmallCard
                title={__('Total Revenue', 'quillcrm')}
                subtitle={data.total_revenue || 0}
                icon={<RevenueIcon />}
            />
            <DashboardSmallCard
                title={__('Total Tags', 'quillcrm')}
                subtitle={data.total_tags || 0}
                icon={<TotalTagsIcon />}
            />
            <DashboardSmallCard
                title={__('Active Automation', 'quillcrm')}
                subtitle={data.total_automations || 0}
                icon={<ActiveAutomationIcon />}
            />
            <DashboardSmallCard
                title={__('Email Templates', 'quillcrm')}
                subtitle={data.total_email_templates || 0}
                icon={<EmailTemplatesIcon />}
            />
            <DashboardSmallCard
                title={__('Campaigns', 'quillcrm')}
                subtitle={data.total_campaigns || 0}
                icon={<TotalCampaignsIcon />}
            />
        </div>
    );
};
