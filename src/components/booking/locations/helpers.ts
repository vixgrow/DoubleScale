import type { LocationsProps, IntegrationType } from './types';
import { INTEGRATION_SLUGS } from './constants';
import { Calendar } from '@/types/booking';

export class IntegrationHelper {
    private connected_integrations: LocationsProps['connected_integrations'];

    constructor(connected_integrations: LocationsProps['connected_integrations']) {
        this.connected_integrations = connected_integrations;
    }


    isCalendarTypeTeam(calendar?: Calendar): boolean {
        return calendar?.type === 'team';
    }

    isIntegrationConnected(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.connected;
            case 'zoom':
                return this.connected_integrations.zoom.connected;
            case 'ms-teams':
                return this.connected_integrations.outlook.connected;
        }
    }

    isIntegrationGlobalConnected(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations.google.has_settings;
            case 'zoom':
                return this.connected_integrations.zoom.has_settings;
            case 'ms-teams':
                return this.connected_integrations.outlook.has_settings;
        }
    }

    hasGetStarted(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations?.google?.has_get_started ?? false;
            case 'zoom':
                return this.connected_integrations?.zoom?.has_get_started ?? false;
            case 'ms-teams':
                return this.connected_integrations?.outlook?.has_get_started ?? false;
        }
    }

    hasProVersion(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations?.google?.has_pro_version ?? false;
            case 'zoom':
                return this.connected_integrations?.zoom?.has_pro_version ?? false;
            case 'ms-teams':
                return this.connected_integrations?.outlook?.has_pro_version ?? false;
        }
    }

    hasSettings(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations?.google?.has_settings ?? false;
            case 'zoom':
                return this.connected_integrations?.zoom?.has_settings ?? false;
            case 'ms-teams':
                return this.connected_integrations?.outlook?.has_settings ?? false;
        }
    }

    hasAccounts(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations?.google?.has_accounts ?? false;
            case 'zoom':
                return this.connected_integrations?.zoom?.has_accounts ?? false;
            case 'ms-teams':
                return this.connected_integrations?.outlook?.has_accounts ?? false;
        }
    }

    isTeamsEnabled(): boolean {
        return this.connected_integrations?.outlook?.teams_enabled ?? false;
    }

    hasTeamMembersIntegrationSetup(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations?.google?.team_members_setup || false;
            case 'zoom':
                return this.connected_integrations?.zoom?.team_members_setup || false;
            case 'ms-teams':
                return this.connected_integrations?.outlook?.team_members_setup || false;
            default:
                return false;
        }
    }

    hasNoProviders(type: IntegrationType): boolean {
        switch (type) {
            case 'google-meet':
                return this.connected_integrations?.google?.no_providers || false;
            case 'zoom':
                return this.connected_integrations?.zoom?.no_providers || false;
            case 'ms-teams':
                return this.connected_integrations?.outlook?.no_providers || false;
            default:
                return false;
        }
    }

    convertToSlug(type: IntegrationType): string {
        return INTEGRATION_SLUGS[type];
    }
}
