/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Tabs, Card, Button } from 'antd';
import { UserOutlined, UnorderedListOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Settings } from '@quillcrm/client';
import { Field } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';

const SettingsPage: React.FC = () => {
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isUpdating, setIsUpdating] = useState<boolean>(false);
	const [tab, setTab] = useState<string>('business');
	const [settings, setSettings] = useState<Settings | null>(null);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchSettings = async () => {
		try {
			const response = await apiFetch({
				path: '/qc/v1/settings',
			});

			setSettings(response as Settings);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch settings', 'quillcrm'),
			});
		} finally {
			setIsLoading(false);
		}
	};

	const updateSettings = async () => {
		setIsUpdating(true);
		try {
			await apiFetch({
				path: '/qc/v1/settings',
				method: 'POST',
				data: settings,
			});

			createNotice({
				type: 'success',
				message: __('Settings updated successfully', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to update settings', 'quillcrm'),
			});
		} finally {
			setIsUpdating(false);
		}
	};

	useEffect(() => {
		fetchSettings();
	}, []);

	const tabs = [
		{
			key: 'business',
			label: __('Business', 'quillcrm'),
			icon: <UserOutlined />,
			children: settings && (
				<BusinessSettings settings={settings} onChange={setSettings} />
			),
		},
		{
			key: 'email',
			label: __('Email', 'quillcrm'),
			icon: <UnorderedListOutlined />,
			children: settings && (
				<EmailSettings settings={settings} onChange={setSettings} />
			),
		},
		{
			key: 'double_optin',
			label: __('Double Opt-In', 'quillcrm'),
			icon: <UnorderedListOutlined />,
			children: settings && (
				<DoubleOptInSettings
					settings={settings}
					onChange={setSettings}
				/>
			),
		},
		{
			key: 'cart',
			label: __('Cart', 'quillcrm'),
			icon: <UnorderedListOutlined />,
			children: settings && (
				<CartSettings settings={settings} onChange={setSettings} />
			),
		},
	];

	return (
		<div className="quillcrm-settings">
			<Card
				loading={isLoading}
				title={__('Settings', 'quillcrm')}
				extra={
					<Button
						type="primary"
						onClick={updateSettings}
						loading={isUpdating}
					>
						{__('Save', 'quillcrm')}
					</Button>
				}
			>
				<Tabs
					defaultActiveKey="tab"
					activeKey={tab}
					onChange={(key) => setTab(key)}
					items={tabs}
					tabPosition="left"
				/>
			</Card>
		</div>
	);
};

interface BussinessSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const BusinessSettings: React.FC<BussinessSettingsProps> = ({
	settings,
	onChange,
}) => {
	const { business_name, business_address } = settings.business;
	const handleFieldChange = (key: string, value: string) => {
		onChange({
			...settings,
			business: {
				...settings.business,
				[key]: value,
			},
		});
	};
	return (
		<div className="business-settings qcrm-fields">
			<Field
				label={__('Business Name', 'quillcrm')}
				value={business_name || ConfigAPI.getBlogName()}
				onChange={(value) => handleFieldChange('business_name', value)}
				type="text"
			/>
			<Field
				label={__('Business Address', 'quillcrm')}
				value={business_address}
				onChange={(value) =>
					handleFieldChange('business_address', value)
				}
				type="textarea"
			/>
		</div>
	);
};

interface EmailSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({
	settings,
	onChange,
}) => {
	const {
		from_name,
		from_email,
		reply_to,
		email_footer,
		max_in_second,
		max_in_day,
	} = settings.email;
	const handleFieldChange = (key: string, value: string) => {
		onChange({
			...settings,
			email: {
				...settings.email,
				[key]: value,
			},
		});
	};
	return (
		<div className="email-settings qcrm-fields">
			<Field
				label={__('From Name', 'quillcrm')}
				value={from_name || ConfigAPI.getBlogName()}
				onChange={(value) => handleFieldChange('from_name', value)}
				type="text"
			/>
			<Field
				label={__('From Email', 'quillcrm')}
				value={from_email || ConfigAPI.getBlogName()}
				onChange={(value) => handleFieldChange('from_email', value)}
				type="email"
			/>
			<Field
				label={__('Reply To', 'quillcrm')}
				value={reply_to || ConfigAPI.getBlogName()}
				onChange={(value) => handleFieldChange('reply_to', value)}
				type="email"
			/>
			<Field
				label={__('Email Footer', 'quillcrm')}
				value={email_footer}
				onChange={(value) => handleFieldChange('email_footer', value)}
				type="textarea"
			/>
			<Field
				label={__('Max Emails in Second', 'quillcrm')}
				value={max_in_second}
				onChange={(value) => handleFieldChange('max_in_second', value)}
				type="number"
			/>
			<Field
				label={__('Max Emails in Day', 'quillcrm')}
				value={max_in_day}
				onChange={(value) => handleFieldChange('max_in_day', value)}
				type="number"
			/>
		</div>
	);
};

interface DoubleOptInSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const DoubleOptInSettings: React.FC<DoubleOptInSettingsProps> = ({
	settings,
	onChange,
}) => {
	const {
		email_subject,
		email_content,
		after_confirmation,
		confirmation_message,
		confirmation_redirect,
	} = settings.double_optin;
	const handleFieldChange = (key: string, value: string) => {
		onChange({
			...settings,
			[key]: value,
		});
	};
	return (
		<div className="double-optin-settings qcrm-fields">
			<Field
				label={__('Email Subject', 'quillcrm')}
				value={email_subject}
				onChange={(value) => handleFieldChange('email_subject', value)}
				type="text"
			/>
			<Field
				label={__('Email Content', 'quillcrm')}
				value={email_content}
				onChange={(value) => handleFieldChange('email_content', value)}
				type="textarea"
			/>
			<Field
				label={__('After Confirmation', 'quillcrm')}
				value={after_confirmation}
				onChange={(value) =>
					handleFieldChange('after_confirmation', value)
				}
				type="text"
			/>
			<Field
				label={__('Confirmation Message', 'quillcrm')}
				value={confirmation_message}
				onChange={(value) =>
					handleFieldChange('confirmation_message', value)
				}
				type="textarea"
			/>
			<Field
				label={__('Confirmation Redirect', 'quillcrm')}
				value={confirmation_redirect}
				onChange={(value) =>
					handleFieldChange('confirmation_redirect', value)
				}
				type="text"
			/>
		</div>
	);
};

interface CartSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const CartSettings: React.FC<CartSettingsProps> = ({ settings, onChange }) => {
	const {
		enable_cart_tracking,
		wait_period,
		cool_off_period,
		lost_cart_days,
	} = settings.cart;
	const handleFieldChange = (key: string, value: string) => {
		onChange({
			...settings,
			cart: {
				...settings.cart,
				[key]: value,
			},
		});
	};
	return (
		<div className="cart-settings qcrm-fields">
			<Field
				label={__('Enable Cart Tracking', 'quillcrm')}
				value={enable_cart_tracking}
				onChange={(value) =>
					handleFieldChange('enable_cart_tracking', value)
				}
				type="checkbox"
			/>
			{enable_cart_tracking && (
				<>
					<Field
						label={__('Wait Period (minutes)', 'quillcrm')}
						value={wait_period}
						onChange={(value) =>
							handleFieldChange('wait_period', value)
						}
						type="number"
					/>
					<Field
						label={__('Cool Off Period (days)', 'quillcrm')}
						value={cool_off_period}
						onChange={(value) =>
							handleFieldChange('cool_off_period', value)
						}
						type="number"
					/>
					<Field
						label={__('Lost Cart (days)', 'quillcrm')}
						value={lost_cart_days}
						onChange={(value) =>
							handleFieldChange('lost_cart_days', value)
						}
						type="number"
					/>
				</>
			)}
		</div>
	);
};

export default SettingsPage;
