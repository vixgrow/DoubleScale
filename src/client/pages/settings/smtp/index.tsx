/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';
import { AddonCard } from '@/client/pages/intergrations/addon-card';
import { BounceHandler } from '@/components/bounce-handler';
import ModuleDisabledNotice from '@/components/module-disabled-notice';
import BuiltinSmtpSettings from './builtin-smtp-settings';
import { ConnectionsViewToggle } from './connections-view-toggle';

const ProSMTPSettings: React.FC = () => {
	const addons = ConfigAPI.getAddons();
	const smtpAddon = addons['smtp'];
	const smtpModuleOn = ConfigAPI.isModuleEnabled('smtp');
	const [connectionsView, setConnectionsView] = useState<'table' | 'card'>(
		'table'
	);

	const showAddonCard =
		!smtpModuleOn && smtpAddon && !smtpAddon.is_active;

	return (
		<div className="smtp-settings">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div className="text-[#09090B] font-semibold text-2xl">
					{__('SMTP / Email Sending Service Settings', 'doublescale')}
				</div>
				{smtpModuleOn ? (
					<ConnectionsViewToggle
						value={connectionsView}
						onChange={setConnectionsView}
					/>
				) : null}
			</div>

			{smtpModuleOn ? (
				<BuiltinSmtpSettings connectionsView={connectionsView} />
			) : (
				<ModuleDisabledNotice
					featureName={__('SMTP (built-in)', 'doublescale')}
					className="mb-8"
				/>
			)}

			{showAddonCard && (
				<AddonCard
					addon={smtpAddon}
					imageUrl={`${ConfigAPI.getPluginDirUrl()}assets/images/smtp/smtp.svg`}
				/>
			)}

			{/* Bounce Handler Configuration */}
			<div className="mt-8 pt-8 border-t border-gray-200">
				<BounceHandler />
			</div>
		</div>
	);
};

export default ProSMTPSettings;
