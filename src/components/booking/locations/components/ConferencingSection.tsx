import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import type { ExtendedLocation, IntegrationType } from '../types';
import { IntegrationHelper } from '../helpers';
import { INTEGRATION_ICONS, INTEGRATION_NAMES } from '../constants';
import { Calendar } from '@/types/booking';
import { useProUpgrade } from '@doublescale/hooks/use-pro-upgrade';

import LocationRow from './LocationRow';

interface ConferencingSectionProps {
	locations: ExtendedLocation[];
	integrationHelper: IntegrationHelper;
	onCheckboxChange: (type: string, checked: boolean) => Promise<void>;
	calendar?: Calendar;
	messageClassName?: string;
	messageColor?: string;
}

const ConferencingSection: React.FC<ConferencingSectionProps> = ({
	locations,
	integrationHelper,
	onCheckboxChange,
	calendar,
	messageClassName = 'text-[#9197A4] text-[12px] italic',
	messageColor,
}) => {
	const isServiceContext = !calendar;
	const { isProActive, handleUpgradeClick, getUpgradeButtonText } = useProUpgrade();

	const isIntegrationDisabled = (type: IntegrationType): boolean => {
		// If integration is already selected, allow unchecking
		if (locations.some((loc) => loc.type === type)) {
			return false;
		}

		// Conferencing requires the Pro plugin to be installed and active
		if (!isProActive) {
			return true;
		}

		// Service context: all linked providers must have the integration set up
		if (isServiceContext) {
			if (integrationHelper.hasNoProviders(type)) {
				return true;
			}

			if (!integrationHelper.hasTeamMembersIntegrationSetup(type)) {
				return true;
			}

			if (type === 'ms-teams') {
				return (
					!integrationHelper.hasAccounts(type) ||
					!integrationHelper.isTeamsEnabled()
				);
			}

			if (type === 'google-meet') {
				return (
					!integrationHelper.hasAccounts(type)
				);
			}

			if (type === 'zoom') {
				return (
					!integrationHelper.hasAccounts(type)
				);
			}

			return false;
		}

		if (
			integrationHelper.isCalendarTypeTeam(calendar) &&
			!integrationHelper.hasTeamMembersIntegrationSetup(type)
		) {
			return true;
		}

		if (integrationHelper.hasGetStarted(type)) {
			return false;
		}

		if (type === 'ms-teams') {
			return (
				!integrationHelper.hasAccounts(type) ||
				!integrationHelper.isTeamsEnabled()
			);
		}

		if (type === 'google-meet') {
			return (
				!integrationHelper.hasAccounts(type)
			);
		}

		if (type === 'zoom') {
			return (
				!integrationHelper.hasAccounts(type)
			);
		}

		return false;
	};

	const getIntegrationStatusMessage = (
		type: IntegrationType,
		calendar?: Calendar
	): { message: string; className?: string; color?: string } => {
		// Conferencing integrations require the Pro plugin
		if (!isProActive) {
			return {
				message: sprintf(
					/* translators: %s: e.g. Google Meet, Zoom Video, MS Teams */
					__(
						'Upgrade to Pro to use %s.',
						'doublescale'
					),
					INTEGRATION_NAMES[type]
				),
				className: 'text-[#458DC7] text-[12px] italic',
			};
		}

		// Service context: messages about provider readiness
		if (isServiceContext) {
			if (integrationHelper.hasNoProviders(type)) {
				return {
					message: __(
						'Add providers to this service first to configure conferencing.',
						'doublescale'
					),
					className: 'text-yellow-500 text-[12px] italic',
				};
			}

			if (!integrationHelper.hasTeamMembersIntegrationSetup(type)) {
				return {
					message: __(
						`All providers must have ${INTEGRATION_NAMES[type]} connected to use this location.`,
						'doublescale'
					),
					className: 'text-red-500 text-[12px] italic',
				};
			}

			if (type === 'ms-teams' && !integrationHelper.isTeamsEnabled()) {
				return {
					message: __(
						'Teams must be enabled for the providers to use this location.',
						'doublescale'
					),
					className: 'text-yellow-500 text-[12px] italic',
				};
			}

			if (integrationHelper.hasAccounts(type)) {
				return {
					message: __(
						'All providers are connected.',
						'doublescale'
					),
					className: 'text-green-500 text-[12px] italic',
				};
			}

			return { message: '' };
		}

		// Event context — team calendars: every member included for this event must have the integration (API scopes hosts).
		if (
			integrationHelper.isCalendarTypeTeam(calendar) &&
			!integrationHelper.hasTeamMembersIntegrationSetup(type)
		) {
			return {
				message: sprintf(
					/* translators: %s: e.g. Google Meet, Zoom Video, MS Teams */
					__(
						'Looks like your remote connection for this location is disabled. Every team member added to this event must connect %s before guests can use this location.',
						'doublescale'
					),
					INTEGRATION_NAMES[type]
				),
				className: 'text-red-500 text-[12px] italic',
			};
		}

		if (type === 'ms-teams') {
			if (!integrationHelper.hasAccounts(type)) {
				return {
					message: __(
						'Add an account to use Outlook integration.',
						'doublescale'
					),
					className: 'text-blue-500 text-[12px] italic',
				};
			}
			if (!integrationHelper.isTeamsEnabled()) {
				return {
					message: __(
						'Teams is not enabled for your default account. Please enable it in the Outlook integration settings.',
						'doublescale'
					),
					className: 'text-yellow-500 text-[12px] italic',
				};
			}
		}



		if (type === 'zoom' && integrationHelper.hasAccounts(type)) {
			return {
				message: __(
					'You are connected now by your account.',
					'doublescale'
				),
				className: 'text-green-500 text-[12px] italic',
			};
		}

		if (!integrationHelper.hasAccounts(type)) {
			return {
				message: __(
					`Add an account to use ${INTEGRATION_NAMES[type]} integration.`,
					'doublescale'
				),
				className: 'text-blue-500 text-[12px] italic',
			};
		}

		if (integrationHelper.hasAccounts(type)) {
			return {
				message: __(
					`You are connected now by your account.`,
					'doublescale'
				),
				className: 'text-green-500 text-[12px] italic',
			};
		}

		return { message: '' };
	};

	const renderIntegrationCheckbox = (type: IntegrationType) => {
		const status = getIntegrationStatusMessage(type, calendar);
		return (
			<LocationRow
				key={type}
				checked={locations.some((loc) => loc.type === type)}
				disabled={isIntegrationDisabled(type)}
				onCheckedChange={(checked) => onCheckboxChange(type, checked)}
			>
				<div className="flex items-center w-full gap-3">
					<img
						src={INTEGRATION_ICONS[type]}
						alt={`${type}.png`}
						className="size-7 shrink-0"
					/>
					<div className="flex min-w-0 flex-col">
						<div className="text-[#3F4254] text-[16px] font-semibold">
							{__(INTEGRATION_NAMES[type], 'doublescale')}
						</div>
						<div
							className={status.className || messageClassName}
							style={
								messageColor
									? { color: messageColor }
									: status.color
										? { color: status.color }
										: undefined
							}
						>
							{status.message}
						</div>
					</div>
				</div>
			</LocationRow>
		);
	};

	return (
        <div className='flex flex-col gap-2.5 justify-start items-start'>
            <div className="flex items-center justify-between w-full">
				<div className="text-[#09090B] text-[16px]">
					{__('Conferencing', 'doublescale')}
				</div>
				{!isProActive && (
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							handleUpgradeClick();
						}}
						className="text-[#458DC7] text-[12px] italic underline hover:no-underline"
					>
						{getUpgradeButtonText()}
					</button>
				)}
			</div>
            {renderIntegrationCheckbox('google-meet')}
            {renderIntegrationCheckbox('zoom')}
            {renderIntegrationCheckbox('ms-teams')}
        </div>
    );
};

export default ConferencingSection;
